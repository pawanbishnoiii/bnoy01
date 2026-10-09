import { z } from 'zod';
import { logTruecaller } from '@/lib/truecaller-log';
const schema = z.object({ requestId: z.string().min(1).max(200), accessToken: z.string().min(10).max(4000).optional(), endpoint: z.string().max(500).optional(), status: z.string().max(80).optional() }).passthrough();
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export async function truecallerCallback(request: Request) {
  if (Number(request.headers.get('content-length') || 0) > 10000) return new Response('Too large', { status: 413 });
  const body = await request.text();
  if (body.length > 10000) return new Response('Too large', { status: 413 });
  let json: unknown;
  const ua = request.headers.get('user-agent');
  try { json = JSON.parse(body); } catch (e) { console.error('truecaller callback: invalid JSON', e); await logTruecaller({ stage: 'callback_parse', message: 'Callback body was not JSON', details: { sample: body.slice(0, 300) }, userAgent: ua }); return new Response('Invalid callback', { status: 400 }); }
  const input = schema.safeParse(json);
  if (!input.success || !uuid.test(input.data.requestId)) { console.error('truecaller callback: unexpected payload shape'); await logTruecaller({ stage: 'callback_shape', message: 'Callback payload had unexpected shape', details: { keys: json && typeof json === 'object' ? Object.keys(json) : [] }, userAgent: ua }); return new Response('Invalid callback', { status: 400 }); }
  const { supabaseAdmin: db } = await import('@/integrations/supabase/client.server');
  const p = input.data;
  const { data: attempt } = await db.from('truecaller_requests').select('id,expires_at,status').eq('id', p.requestId).maybeSingle();
  if (!attempt || attempt.status !== 'pending' || Date.parse(attempt.expires_at) < Date.now()) { await logTruecaller({ requestId: p.requestId, stage: 'callback_expired', message: `Callback for ${attempt ? attempt.status : 'unknown'} request`, details: { status: p.status }, userAgent: ua }); return new Response('Expired', { status: 400 }); }
  const fail = async (msg: string, code: number, details?: unknown) => {
    const { error } = await db.from('truecaller_requests').update({ status: 'error', error: msg }).eq('id', p.requestId).eq('status', 'pending');
    if (error) console.error('truecaller callback: could not save error', error.message);
    await logTruecaller({ requestId: p.requestId, stage: 'callback', message: msg, details: { truecallerStatus: p.status ?? null, endpointHost: (() => { try { return p.endpoint ? new URL(p.endpoint).hostname : null; } catch { return 'invalid'; } })(), ...(details && typeof details === 'object' ? details : {}) }, userAgent: ua });
    // Always answer 200 once the error is recorded so Truecaller does not keep retrying; the waiting page shows the reason.
    return new Response(msg, { status: error ? 503 : code });
  };
  if (p.status === 'user_rejected') return fail('You cancelled the Truecaller confirmation. Tap retry to try again.', 200);
  if (p.status === 'use_another_number') return fail('You chose to use another number. Please sign in with email or Google instead.', 200);
  if (!p.endpoint || !p.accessToken) return fail(`Truecaller did not send a verified profile${p.status ? ` (status: ${p.status})` : ''}. Please retry.`, 200);
  let url: URL;
  try { url = new URL(p.endpoint); } catch { return fail('Truecaller sent an invalid profile address. Please retry.', 200); }
  if (url.protocol !== 'https:' || !/^profile\d*-(?:noneu|eu)\.truecaller\.com$/.test(url.hostname) || !/^\/v1\/default\/?$/.test(url.pathname) || url.username || url.password || url.port) {
    console.error('truecaller callback: endpoint rejected', url.hostname, url.pathname);
    return fail('Truecaller sent an unexpected profile address. Please retry.', 200);
  }
  try {
    // Workers do not support redirect: 'error'; use manual and reject any redirect response.
    const result = await fetch(url.href, { headers: { Authorization: `Bearer ${p.accessToken}`, 'Cache-Control': 'no-cache', Accept: 'application/json' }, redirect: 'manual', signal: AbortSignal.timeout(8000) });
    if (result.status >= 300 && result.status < 400) return fail('Truecaller profile address redirected unexpectedly. Please retry.', 200);
    if (!result.ok) {
      console.error('truecaller callback: profile fetch failed', result.status);
      const reason = result.status === 401 || result.status === 403 ? 'Truecaller rejected the sign-in token (check the app key in admin settings).' : `Truecaller profile service returned error ${result.status}.`;
      return fail(`${reason} Please retry.`, 200);
    }
    const profile = await result.json() as { phoneNumbers?: string[] } & Record<string, string | string[] | null>;
    if (!Array.isArray(profile.phoneNumbers) || !profile.phoneNumbers.length) return fail('Your Truecaller profile has no phone number.', 200);
    const { error } = await db.from('truecaller_requests').update({ status: 'verified', verified_profile: profile }).eq('id', p.requestId).eq('status', 'pending');
    if (error) { console.error('truecaller callback: save failed', error.message); return fail('Your profile could not be saved. Please retry.', 200); }
    return new Response('ok');
  } catch (e) {
    console.error('truecaller callback: profile fetch threw', e);
    const timedOut = e instanceof Error && (e.name === 'TimeoutError' || e.name === 'AbortError');
    return fail(timedOut ? 'Truecaller took too long to share your profile. Please retry.' : 'Could not reach Truecaller to confirm your profile. Please retry.', 200);
  }
}
