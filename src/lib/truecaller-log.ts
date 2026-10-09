// Server-only helper: records every Truecaller failure so admins can see the exact stage that broke.
export async function logTruecaller(entry: { requestId?: string | null; stage: string; message: string; details?: unknown; userAgent?: string | null }) {
  try {
    const { supabaseAdmin: db } = await import('@/integrations/supabase/client.server');
    const uuid = /^[0-9a-f-]{36}$/i;
    const { error } = await db.from('truecaller_logs').insert({
      request_id: entry.requestId && uuid.test(entry.requestId) ? entry.requestId : null,
      stage: entry.stage.slice(0, 60),
      message: entry.message.slice(0, 1000),
      details: (entry.details ?? null) as never,
      user_agent: entry.userAgent?.slice(0, 300) ?? null,
    });
    if (error) console.error('truecaller log insert failed', error.message);
  } catch (e) { console.error('truecaller log failed', e); }
}
