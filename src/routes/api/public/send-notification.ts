import { createFileRoute } from "@tanstack/react-router";

const GATEWAY_URL = "https://connector-gateway.lovable.dev/firebase_messaging";

export const Route = createFileRoute("/api/public/send-notification")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const json = (b: unknown, status = 200) => Response.json(b, { status });
        const LOVABLE_API_KEY = process.env.LOVABLE_API_KEY;
        const connectionApiKey = process.env.FIREBASE_MESSAGING_API_KEY;
        if (!LOVABLE_API_KEY || !connectionApiKey) return json({ error: "Push notifications are not connected yet" }, 500);

        const { supabaseAdmin: admin } = await import("@/integrations/supabase/client.server");
        const token = (request.headers.get("Authorization") ?? "").replace("Bearer ", "");
        const { data: userData, error: userErr } = await admin.auth.getUser(token);
        if (userErr || !userData?.user) return json({ error: "Unauthorized" }, 401);
        const { data: isAdmin } = await admin.rpc("has_role", { _user_id: userData.user.id, _role: "admin" });
        if (!isAdmin) return json({ error: "Admins only" }, 403);

        const body = (await request.json().catch(() => ({}))) as { notificationId?: string };
        if (!body.notificationId) return json({ error: "notificationId is required" }, 400);
        const { data: notif } = await admin.from("notifications").select("*").eq("id", body.notificationId).maybeSingle();
        if (!notif) return json({ error: "Notification not found" }, 404);

        let query = admin.from("push_subscribers").select("id, token, user_id");
        if (notif.audience === "user") {
          if (!notif.target_user_id) return json({ error: "Target user missing" }, 400);
          query = query.eq("user_id", notif.target_user_id);
        }
        const { data: subs } = await query;
        if (!subs || subs.length === 0) {
          await admin.from("notifications").update({ status: "failed", error: "No subscribed devices" }).eq("id", notif.id);
          return json({ error: "No subscribed devices for this audience" }, 400);
        }
        const data: Record<string, string> = { title: notif.title ?? "", body: notif.body ?? "", url: notif.url ?? "/" };
        if (notif.banner_url) data.banner = notif.banner_url;
        if (notif.tag) data.tag = notif.tag;

        let sent = 0;
        const stale: string[] = [];
        const errors: string[] = [];
        for (const sub of subs) {
          const res = await fetch(`${GATEWAY_URL}/v1/projects/_/messages:send`, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${LOVABLE_API_KEY}`,
              "X-Connection-Api-Key": connectionApiKey,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              message: {
                token: sub.token,
                data,
                webpush: {
                  notification: { title: data.title, body: data.body, image: data.banner, tag: data.tag, icon: "/favicon.ico" },
                  fcm_options: { link: data.url },
                },
              },
            }),
          });
          if (res.ok) { sent++; continue; }
          const t = await res.text();
          if (res.status === 404 || res.status === 400) stale.push(sub.token);
          if (errors.length < 3) errors.push(`[${res.status}] ${t.slice(0, 200)}`);
        }
        if (stale.length) await admin.from("push_subscribers").delete().in("token", stale);
        const failed = subs.length - sent;
        await admin.from("notifications").update({
          status: sent > 0 ? "sent" : "failed",
          sent_count: sent,
          failed_count: failed,
          sent_at: new Date().toISOString(),
          error: errors.length ? errors.join(" | ") : null,
        }).eq("id", notif.id);
        return json({ sent, failed, removed_stale: stale.length, errors });
      },
    },
  },
});
