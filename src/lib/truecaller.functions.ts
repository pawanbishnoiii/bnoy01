import { createServerFn } from '@tanstack/react-start';
import { getRequest } from '@tanstack/react-start/server';
import { z } from 'zod';
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware';
import { normalizePhone } from '@/lib/identity';
import { logTruecaller } from '@/lib/truecaller-log';

export const startTruecaller = createServerFn({ method: 'POST' }).handler(async () => {
  const request = getRequest();
  const { supabaseAdmin: db } = await import('@/integrations/supabase/client.server');
  const { data: settings, error: settingsError } = await db.from('truecaller_settings').select('*').eq('id', true).single();
  if (settingsError) throw new Error('Truecaller settings are unavailable. Please try another sign-in method.');
  if (!settings?.enabled || !settings.app_key) throw new Error('Truecaller is not configured.');
  const origin = new URL(request.url).origin;
  if (origin !== settings.app_domain && !origin.startsWith('http://localhost:')) throw new Error('Use the registered app domain for Truecaller sign-in.');
  const callback = new URL(settings.callback_url);
  if (callback.protocol !== 'https:' || callback.origin !== settings.app_domain || !['/auth/true-sdk', '/api/public/truecaller'].includes(callback.pathname)) throw new Error('Ask the administrator to register /auth/true-sdk as the Truecaller callback on the app domain.');
  let userId: string | null = null;
  const token = request.headers.get('authorization')?.replace(/^Bearer /, '');
  if (token) { const { data, error } = await db.auth.getUser(token); if (error || !data.user) throw new Error('Your session expired. Sign in again before linking a phone.'); userId = data.user.id; }
  const proof = crypto.randomUUID() + crypto.randomUUID();
  const { createHash } = await import('node:crypto');
  const { data, error } = await db.from('truecaller_requests').insert({ proof_hash: createHash('sha256').update(proof).digest('hex'), user_id: userId }).select('id,expires_at').single();
  if (error || !data) throw new Error('Could not start verification.');
  const params = new URLSearchParams({ requestNonce: data.id, partnerKey: settings.app_key, partnerName: 'Bnoy Studios', lang: 'en', privacyUrl: `${settings.app_domain}/refund`, termsUrl: `${settings.app_domain}/refund` });
  return { requestId: data.id, proof, expiresAt: data.expires_at, deepLink: `truecallersdk://truesdk/web_verify?${params}` };
});

const requestSchema = z.object({ requestId: z.string().uuid(), proof: z.string().min(64).max(100) });
export const finishTruecaller = createServerFn({ method: 'POST' }).inputValidator(input => requestSchema.parse(input)).handler(async ({ data }) => {
  const { supabaseAdmin: db } = await import('@/integrations/supabase/client.server');
  const { createHash } = await import('node:crypto');
  const hash = createHash('sha256').update(data.proof).digest('hex');
  const { data: attempt } = await db.from('truecaller_requests').select('*').eq('id', data.requestId).eq('proof_hash', hash).maybeSingle();
  if (!attempt || Date.parse(attempt.expires_at) < Date.now()) return { status: 'error', message: 'Verification expired. Please retry.' };
  if (attempt.status === 'pending') return { status: 'pending' };
  if (attempt.status === 'consuming') return { status: 'pending' };
  if (attempt.status !== 'verified') return { status: 'error', message: attempt.error || 'Verification could not be completed.', requestId: attempt.id };
  const { data: claimed } = await db.from('truecaller_requests').update({ status: 'consuming' }).eq('id', attempt.id).eq('status', 'verified').select('id').maybeSingle();
  if (!claimed) return { status: 'error', message: 'Verification has already been used.' };
  try {
    const p = (attempt.verified_profile || {}) as Record<string, any>;
    const { phone, countryCode } = normalizePhone(String(p.phoneNumbers?.[0] || ''));
    const { data: existing } = await db.from('profiles').select('id').eq('phone', phone).eq('phone_verified', true).maybeSingle();
    if (attempt.user_id && existing && existing.id !== attempt.user_id) {
      await db.from('truecaller_requests').update({ status: 'conflict', error: 'This verified phone belongs to another account. Sign in to that account before linking; accounts were not merged.' }).eq('id', attempt.id);
      await logTruecaller({ requestId: attempt.id, stage: 'finish_conflict', message: 'Verified phone belongs to another account' });
      return { status: 'conflict', message: 'This phone is already linked to another account. Sign in to that account to resolve the conflict.' };
    }
    let userId = attempt.user_id || existing?.id;
    let createdUser: Awaited<ReturnType<typeof db.auth.admin.createUser>>['data']['user'] = null;
    if (!userId) {
      const uuid = crypto.randomUUID();
      const { data, error } = await db.auth.admin.createUser({ email: `${uuid}@phone.bnoy.invalid`, email_confirm: true, phone, phone_confirm: true, user_metadata: { name: [p.name?.first, p.name?.last].filter(Boolean).join(' '), provider: 'truecaller' } });
      if (error || !data.user) throw new Error('Could not create your verified account.');
      userId = data.user.id;
      createdUser = data.user;
    }
    const authUser = createdUser ? { user: createdUser } : (await db.auth.admin.getUserById(userId)).data;
    if (!authUser.user) throw new Error('Account unavailable.');
    const actualEmail = authUser.user.email && !authUser.user.email.endsWith('@phone.bnoy.invalid') && authUser.user.email_confirmed_at ? authUser.user.email.toLowerCase() : null;
    if (authUser.user.phone !== phone.replace(/^\+/, '') && authUser.user.phone !== phone) {
      const { error: phoneError } = await db.auth.admin.updateUserById(userId, { phone, phone_confirm: true });
      if (phoneError) throw new Error('This verified phone is already linked to another account.');
    }
    const fields = { id: userId, phone, country_code: countryCode, phone_verified: true, first_name: String(p.name?.first || '').slice(0,100), last_name: String(p.name?.last || '').slice(0,100), name: [p.name?.first, p.name?.last].filter(Boolean).join(' ').slice(0,200), avatar_url: typeof p.avatarUrl === 'string' && p.avatarUrl.startsWith('https://') ? p.avatarUrl : null, gender: typeof p.gender === 'string' ? p.gender : null, city: p.addresses?.[0]?.city || null, company: p.companyName || null, job_title: p.jobTitle || null, verified_name: Array.isArray(p.badges) && p.badges.includes('verified'), email: actualEmail, email_verified: !!actualEmail };
    const { error } = await db.from('profiles').upsert(fields);
    if (error) throw new Error('Could not link verified profile.');
    const needs = [...(actualEmail ? [] : ['email']), ...(fields.first_name ? [] : ['name'])];
    if (attempt.user_id) {
      await db.from('truecaller_requests').update({ status: 'consumed', verified_profile: null }).eq('id', attempt.id);
      return { status: 'linked', needs };
    }
    if (!authUser.user.email) throw new Error('Account session cannot be issued.');
    const { data: link, error: linkError } = await db.auth.admin.generateLink({ type: 'magiclink', email: authUser.user.email });
    if (linkError || !link.properties?.hashed_token) throw new Error('Could not create a secure session.');
    await db.from('truecaller_requests').update({ status: 'consumed', verified_profile: null }).eq('id', attempt.id);
    return { status: 'ready', tokenHash: link.properties.hashed_token, needs };
  } catch (err) {
    await db.from('truecaller_requests').update({ status: 'error', verified_profile: null, error: 'Verification failed. Please retry.' }).eq('id', attempt.id);
    await logTruecaller({ requestId: attempt.id, stage: 'finish', message: err instanceof Error ? err.message : 'Verification failed', details: { stack: err instanceof Error ? err.stack?.slice(0, 800) : String(err) } });
    return { status: 'error', message: err instanceof Error ? err.message : 'Verification failed.' };
  }
});

export const syncVerifiedIdentity = createServerFn({ method: 'POST' }).middleware([requireSupabaseAuth]).handler(async ({ context }) => {
  const { data: { user } } = await context.supabase.auth.getUser();
  if (!user) throw new Error('Sign in required.');
  const email = user.email_confirmed_at && user.email && !user.email.endsWith('@phone.bnoy.invalid') ? user.email.toLowerCase() : null;
  const { supabaseAdmin: db } = await import('@/integrations/supabase/client.server');
  const { error } = await db.from('profiles').upsert({ id: user.id, email, email_verified: !!email });
  if (error) throw new Error('Email identity conflicts with another account. Sign in to both accounts before linking.');
  return { email };
});

export const requestEmailLink = createServerFn({ method: 'POST' }).middleware([requireSupabaseAuth]).inputValidator(input => z.object({ email: z.string().trim().email().max(254) }).parse(input)).handler(async ({ data, context }) => {
  const { error } = await context.supabase.auth.updateUser({ email: data.email.toLowerCase() });
  if (error) throw new Error('Email could not be linked. If it belongs to another account, sign in to that account; no accounts were merged.');
  return { success: true };
});
export const reportTruecallerError = createServerFn({ method: 'POST' }).inputValidator(input => z.object({ requestId: z.string().max(60).optional(), stage: z.string().min(1).max(60), message: z.string().min(1).max(1000) }).parse(input)).handler(async ({ data }) => {
  await logTruecaller({ requestId: data.requestId, stage: `client_${data.stage}`, message: data.message, userAgent: getRequest().headers.get('user-agent') });
  return { ok: true };
});

export const getOnboardingNeeds = createServerFn({ method: 'POST' }).middleware([requireSupabaseAuth]).handler(async ({ context }) => {
  const { data: { user } } = await context.supabase.auth.getUser();
  if (!user) throw new Error('Sign in required.');
  const { supabaseAdmin: db } = await import('@/integrations/supabase/client.server');
  const { data: profile } = await db.from('profiles').select('first_name,last_name,name').eq('id', user.id).maybeSingle();
  const hasEmail = !!user.email && !user.email.endsWith('@phone.bnoy.invalid');
  return { needs: [...(hasEmail ? [] : ['email']), ...(profile?.first_name || profile?.name ? [] : ['name'])], pendingEmail: user.new_email || null };
});

export const saveOnboardingName = createServerFn({ method: 'POST' }).middleware([requireSupabaseAuth]).inputValidator(input => z.object({ firstName: z.string().trim().min(1).max(100), lastName: z.string().trim().max(100) }).parse(input)).handler(async ({ data, context }) => {
  const { supabaseAdmin: db } = await import('@/integrations/supabase/client.server');
  const { data: profile } = await db.from('profiles').select('first_name,name').eq('id', context.userId).maybeSingle();
  // Only fill a name Truecaller did not provide; never overwrite verified data.
  if (profile?.first_name || profile?.name) return { saved: false };
  const { error } = await db.from('profiles').upsert({ id: context.userId, first_name: data.firstName, last_name: data.lastName || null, name: [data.firstName, data.lastName].filter(Boolean).join(' ') });
  if (error) throw new Error('Name could not be saved. Please retry.');
  return { saved: true };
});
