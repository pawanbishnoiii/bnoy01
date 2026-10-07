import { useEffect, useRef } from "react";
import { useRouterState } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

const VKEY = "bnoy_vid";
const SKEY = "bnoy_sid";

function visitorId() {
  let id = localStorage.getItem(VKEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(VKEY, id);
  }
  return id;
}

async function send(payload: Record<string, unknown>, beacon = false) {
  const body = JSON.stringify(payload);
  if (beacon && navigator.sendBeacon) {
    navigator.sendBeacon("/api/public/track", new Blob([body], { type: "application/json" }));
    return null;
  }
  const { data: { session } } = await supabase.auth.getSession();
  const res = await fetch("/api/public/track", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(session ? { Authorization: `Bearer ${session.access_token}` } : {}) },
    body,
    keepalive: true,
  }).catch(() => null);
  if (!res?.ok) return null;
  const j = (await res.json()) as { sessionId?: string };
  return j.sessionId ?? null;
}

/** Records every visit (signed in or not): IP-based location, device, pages and time spent. */
export default function VisitorTracker() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const since = useRef(Date.now());
  const lastPath = useRef<string | null>(null);

  useEffect(() => {
    if (pathname.startsWith("/admin")) return;
    const vid = visitorId();
    const prev = lastPath.current;
    const sid = sessionStorage.getItem(SKEY);
    const flush = () => {
      const secs = Math.round((Date.now() - since.current) / 1000);
      since.current = Date.now();
      return secs;
    };
    (async () => {
      if (prev && sid) await send({ visitorId: vid, sessionId: sid, path: prev, seconds: flush() });
      since.current = Date.now();
      const id = await send({
        visitorId: vid,
        sessionId: sessionStorage.getItem(SKEY),
        path: pathname,
        title: document.title,
        screen: `${window.screen.width}x${window.screen.height}`,
        language: navigator.language,
        referrer: document.referrer,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      });
      if (id) sessionStorage.setItem(SKEY, id);
    })();
    lastPath.current = pathname;
  }, [pathname]);

  useEffect(() => {
    const leave = () => {
      const sid = sessionStorage.getItem(SKEY);
      if (!sid || !lastPath.current) return;
      const secs = Math.round((Date.now() - since.current) / 1000);
      since.current = Date.now();
      if (secs > 0) send({ visitorId: visitorId(), sessionId: sid, path: lastPath.current, seconds: secs }, true);
    };
    const onVis = () => { if (document.visibilityState === "hidden") leave(); else since.current = Date.now(); };
    document.addEventListener("visibilitychange", onVis);
    window.addEventListener("pagehide", leave);
    return () => {
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("pagehide", leave);
    };
  }, []);

  return null;
}
