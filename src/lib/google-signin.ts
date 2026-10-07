import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";

/**
 * Hosts where the Lovable sign-in broker (/~oauth/*) is available.
 * Anywhere else (Vercel, Netlify, localhost builds) we use the direct flow,
 * which avoids the "/~oauth/initiate … Page not found" error.
 */
export function brokerAvailable(hostname: string) {
  return /\.lovable\.app$|\.lovableproject\.com$|\.lovable\.dev$/.test(hostname);
}

async function getMode(): Promise<string> {
  const { data } = await supabase.from("site_settings").select("google_auth_mode").limit(1).maybeSingle();
  return (data?.google_auth_mode as string) || "auto";
}

export async function signInWithGoogle(): Promise<{ error?: string }> {
  const origin = window.location.origin;
  const mode = await getMode().catch(() => "auto");
  const useBroker = mode === "lovable" || (mode !== "custom" && brokerAvailable(window.location.hostname));
  if (useBroker) {
    const r = await lovable.auth.signInWithOAuth("google", { redirect_uri: origin });
    if (r.error) return { error: r.error.message ?? String(r.error) };
    return {};
  }
  const { error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: `${origin}/`, queryParams: { prompt: "select_account" } },
  });
  return error ? { error: error.message } : {};
}
