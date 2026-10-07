import { createFileRoute } from "@tanstack/react-router";
import { parseUserAgent } from "@/lib/user-agent";

type Body = {
  visitorId?: string;
  sessionId?: string | null;
  path?: string;
  title?: string;
  seconds?: number;
  screen?: string;
  language?: string;
  referrer?: string;
  timezone?: string;
};

function clientIp(req: Request) {
  const h = req.headers;
  return (
    h.get("cf-connecting-ip") ||
    h.get("x-vercel-forwarded-for")?.split(",")[0].trim() ||
    h.get("x-forwarded-for")?.split(",")[0].trim() ||
    h.get("x-real-ip") ||
    null
  );
}

async function geo(ip: string | null) {
  if (!ip || ip === "127.0.0.1" || ip === "::1") return {};
  try {
    const r = await fetch(`https://ipwho.is/${encodeURIComponent(ip)}`, { signal: AbortSignal.timeout(3000) });
    const j = (await r.json()) as Record<string, any>;
    if (!j.success) return {};
    return {
      country: j.country ?? null,
      region: j.region ?? null,
      city: j.city ?? null,
      postal: j.postal ?? null,
      latitude: typeof j.latitude === "number" ? j.latitude : null,
      longitude: typeof j.longitude === "number" ? j.longitude : null,
      isp: j.connection?.isp ?? j.connection?.org ?? null,
      timezone: j.timezone?.id ?? null,
    };
  } catch {
    return {};
  }
}

const clip = (v: unknown, n = 500) => (typeof v === "string" ? v.slice(0, n) : null);

export const Route = createFileRoute("/api/public/track")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const body = (await request.json().catch(() => ({}))) as Body;
        const visitorId = clip(body.visitorId, 80);
        if (!visitorId || !/^[a-zA-Z0-9-]{8,80}$/.test(visitorId)) return Response.json({ error: "bad visitor" }, { status: 400 });
        const { supabaseAdmin: db } = await import("@/integrations/supabase/client.server");

        let userId: string | null = null;
        const token = (request.headers.get("Authorization") ?? "").replace("Bearer ", "");
        if (token) {
          const { data } = await db.auth.getUser(token);
          userId = data?.user?.id ?? null;
        }
        const path = clip(body.path, 500) ?? "/";
        const seconds = Math.max(0, Math.min(1800, Math.round(Number(body.seconds) || 0)));

        // Heartbeat / page-leave: add time to existing session
        if (body.sessionId) {
          const { data: s } = await db.from("visitor_sessions").select("id, total_seconds, user_id, visitor_id").eq("id", body.sessionId).maybeSingle();
          if (s && s.visitor_id === visitorId) {
            await db.from("visitor_sessions").update({
              total_seconds: s.total_seconds + seconds,
              last_seen: new Date().toISOString(),
              last_page: path,
              user_id: s.user_id ?? userId,
            }).eq("id", s.id);
            if (seconds > 0) {
              const { data: pv } = await db.from("page_views").select("id, duration_seconds").eq("session_id", s.id).eq("path", path).order("created_at", { ascending: false }).limit(1).maybeSingle();
              if (pv) await db.from("page_views").update({ duration_seconds: pv.duration_seconds + seconds }).eq("id", pv.id);
            }
            if (!seconds) {
              const { data: cur } = await db.from("visitor_sessions").select("page_views").eq("id", s.id).single();
              await db.from("visitor_sessions").update({ page_views: (cur?.page_views ?? 0) + 1 }).eq("id", s.id);
              await db.from("page_views").insert({ session_id: s.id, path, title: clip(body.title, 300) });
            }
            return Response.json({ sessionId: s.id });
          }
        }

        // New session
        const ip = clientIp(request);
        const ua = request.headers.get("user-agent") ?? "";
        const parsed = parseUserAgent(ua);
        const g = await geo(ip);
        const { data: created, error } = await db.from("visitor_sessions").insert({
          visitor_id: visitorId,
          user_id: userId,
          ip,
          ...g,
          timezone: (g as { timezone?: string }).timezone ?? clip(body.timezone, 80),
          device_type: parsed.deviceType,
          device_name: parsed.deviceName,
          os: parsed.os,
          browser: parsed.browser,
          user_agent: ua.slice(0, 500),
          screen: clip(body.screen, 40),
          language: clip(body.language, 40),
          referrer: clip(body.referrer, 500),
          landing_page: path,
          last_page: path,
          page_views: 1,
        }).select("id").single();
        if (error || !created) return Response.json({ error: "could not track" }, { status: 500 });
        await db.from("page_views").insert({ session_id: created.id, path, title: clip(body.title, 300) });
        return Response.json({ sessionId: created.id });
      },
    },
  },
});
