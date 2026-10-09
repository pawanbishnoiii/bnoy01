import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware';

const SITE = 'https://bnoy01.lovable.app';
const BANNER = `${SITE}/__l5e/assets-v1/56c5d7ac-92d7-42e2-8e97-cd97dbd6bec4/welcome-banner.jpg`;
const isPlaceholder = (e?: string | null) => !e || e.endsWith('.invalid');

async function sha(s: string) {
  const b = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s));
  return Array.from(new Uint8Array(b)).map((x) => x.toString(16).padStart(2, '0')).join('');
}

/** Step 1: email a 6-digit code to the new address (works for Truecaller/phone placeholder accounts). */
export const sendEmailCode = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ email: z.string().trim().email().max(254) }).parse(d))
  .handler(async ({ data, context }) => {
    const email = data.email.toLowerCase();
    const { supabaseAdmin: db } = await import('@/integrations/supabase/client.server');
    const { data: taken } = await db.from('profiles').select('id').eq('email', email).neq('id', context.userId).maybeSingle();
    if (taken) throw new Error('This email already belongs to another account. Sign in to that account instead.');
    const since = new Date(Date.now() - 60_000).toISOString();
    const { count } = await db.from('email_otps').select('id', { count: 'exact', head: true }).eq('user_id', context.userId).gte('created_at', since);
    if ((count || 0) > 0) throw new Error('Please wait a minute before requesting another code.');
    const code = String(Math.floor(100000 + (crypto.getRandomValues(new Uint32Array(1))[0] % 900000)));
    await db.from('email_otps').insert({ user_id: context.userId, email, code_hash: await sha(code + context.userId), expires_at: new Date(Date.now() + 10 * 60_000).toISOString() });
    const { getTheme, renderEmail, sendMail } = await import('./mailer.server');
    const theme = await getTheme();
    const r = await sendMail(email, `Your Bnoy Studios code: ${code}`, renderEmail(theme, { title: 'Confirm your email', intro: `Use this code to add this email to your account. It expires in 10 minutes.`, code }), 'email-code');
    if (!r.sent) throw new Error('Could not send the code. Please try again.');
    return { ok: true };
  });

/** Step 2: verify code, replace placeholder email, then send the welcome email. */
export const verifyEmailCode = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ email: z.string().trim().email().max(254), code: z.string().regex(/^\d{6}$/) }).parse(d))
  .handler(async ({ data, context }) => {
    const email = data.email.toLowerCase();
    const { supabaseAdmin: db } = await import('@/integrations/supabase/client.server');
    const { data: otp } = await db.from('email_otps').select('*').eq('user_id', context.userId).eq('email', email).order('created_at', { ascending: false }).limit(1).maybeSingle();
    if (!otp || new Date(otp.expires_at) < new Date()) throw new Error('Code expired. Request a new one.');
    if (otp.attempts >= 5) throw new Error('Too many attempts. Request a new code.');
    if (otp.code_hash !== (await sha(data.code + context.userId))) {
      await db.from('email_otps').update({ attempts: otp.attempts + 1 }).eq('id', otp.id);
      throw new Error('Wrong code.');
    }
    const { error } = await db.auth.admin.updateUserById(context.userId, { email, email_confirm: true });
    if (error) throw new Error('This email is already used by another account.');
    await db.from('email_otps').delete().eq('user_id', context.userId);
    await db.from('profiles').update({ email, email_verified: true, welcome_email_sent: true }).eq('id', context.userId);
    const { data: p } = await db.from('profiles').select('name,first_name').eq('id', context.userId).maybeSingle();
    await sendWelcome(email, p?.first_name || p?.name || '');
    return { ok: true };
  });

export async function sendWelcome(email: string, name: string) {
  const { getTheme, renderEmail, sendMail } = await import('./mailer.server');
  const theme = await getTheme();
  if (!theme.signup_enabled || isPlaceholder(email)) return { sent: false };
  return sendMail(email, 'Welcome to Bnoy Studios 🚀', renderEmail(theme, {
    title: `Welcome${name ? ', ' + name : ''}!`, banner: BANNER,
    intro: 'Your account is ready. Explore ready-made websites, apps and Windows software, or book a free call to build your own idea.',
    rows: [['🛍️ Marketplace', 'Ready projects with source code'], ['📞 Free call', 'Plan your idea with us'], ['⚡ Updates', 'New versions straight to your inbox']],
    cta: { label: 'Start exploring', url: `${SITE}/marketplace` },
  }), 'welcome');
}
