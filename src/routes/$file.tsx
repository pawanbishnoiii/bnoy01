import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import NotFound from "@/screens/NotFound";

// Serves the Google / Bing HTML verification file an admin saved (e.g. /google1234abcd.html).
export const Route = createFileRoute("/$file")({
  server: {
    handlers: {
      GET: async ({ params, next }) => {
        const file = params.file;
        if (!/^(google[a-z0-9]+\.html|BingSiteAuth\.xml|yandex_[a-z0-9]+\.html)$/i.test(file)) return next();
        const sb = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_PUBLISHABLE_KEY!, {
          auth: { persistSession: false, autoRefreshToken: false },
        });
        const { data } = await sb
          .from("site_settings")
          .select("google_verify_file_name, google_verify_file_content")
          .limit(1)
          .maybeSingle();
        if (data?.google_verify_file_name?.toLowerCase() === file.toLowerCase() && data.google_verify_file_content) {
          const type = file.endsWith(".xml") ? "application/xml" : "text/html";
          return new Response(data.google_verify_file_content, { headers: { "Content-Type": `${type}; charset=utf-8` } });
        }
        return next();
      },
    },
  },
  head: () => ({ meta: [{ title: "Page not found — Bnoy Studios" }, { name: "robots", content: "noindex" }] }),
  component: NotFound,
});
