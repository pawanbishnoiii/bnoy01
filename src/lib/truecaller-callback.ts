import { z } from 'zod';
const schema = z.object({ requestId: z.string().uuid(), accessToken: z.string().min(10).max(4000).optional(), endpoint: z.string().url().optional(), status: z.string().max(80).optional() });
export async function truecallerCallback(request: Request) {
  if (Number(request.headers.get('content-length') || 0) > 10000) return new Response('Too large', { status: 413 });
  const body = await request.text();
  if (body.length > 10000) return new Response('Too large', { status: 413 });
  let json: unknown;
  try { json = JSON.parse(body); } catch (e) { console.error('truecaller callback', e); return new Response('Invalid callback', { status: 400 }); }
  const input = schema.safeParse(json);
  if (!input.success) return new Response('Invalid callback', { status: 400 });
  const { supabaseAdmin: db } = await import('@/integrations/supabase/client.server');
  const p = input.data;
  const { data: attempt } = await db.from('truecaller_requests').select('id,expires_at,status').eq('id', p.requestId).maybeSingle();
  if (!attempt || attempt.status !== 'pending' || Date.parse(attempt.expires_at) < Date.now()) return new Response('Expired', { status: 400 });
  if (p.status === 'user_rejected') { await db.from('truecaller_requests').update({ status: 'error', error: 'Verification was cancelled.' }).eq('id', p.requestId).eq('status', 'pending'); return new Response('ok'); }
  const fail = async (msg: string, code: number) => { await db.from('truecaller_requests').update({ status: 'error', error: msg }).eq('id', p.requestId).eq('status', 'pending'); return new Response(msg, { status: code }); };
  if (!p.endpoint || !p.accessToken) return fail('Truecaller did not send a verified profile. Please retry.', 400);
  const url = new URL(p.endpoint);
  if (url.protocol !== 'https:' || !/^profile\d*-(?:noneu|eu)\.truecaller\.com$/.test(url.hostname) || url.pathname !== '/v1/default' || url.username || url.password || url.port || url.search) return fail('Truecaller sent an unexpected profile address. Please retry.', 400);
  try {
    const result = await fetch(url.href, { headers: { Authorization: `Bearer ${p.accessToken}`, 'Cache-Control': 'no-cache' }, redirect: 'error', signal: AbortSignal.timeout(8000) });
    if (!result.ok) { console.error('truecaller profile fetch', result.status); return fail('Truecaller could not confirm your profile. Please retry.', 401); }
    const profile = await result.json();
    if (!Array.isArray(profile.phoneNumbers) || !profile.phoneNumbers.length) return fail('Your Truecaller profile has no phone number.', 400);
    const { error } = await db.from('truecaller_requests').update({ status: 'verified', verified_profile: profile }).eq('id', p.requestId).eq('status', 'pending');
    if (error) console.error('truecaller save', error.message);
    return new Response(error ? 'Retry' : 'ok', { status: error ? 503 : 200 });
  } catch (e) { console.error('truecaller callback', e); return new Response('Verification temporarily unavailable', { status: 503 }); }
}