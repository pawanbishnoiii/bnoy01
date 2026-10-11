import { createFileRoute } from "@tanstack/react-router";
import { PUBLIC_MEDIA_BUCKETS } from "@/lib/media-url";

// Serves files from the picture buckets that the storage policy already marks as
// publicly readable. The workspace blocks public buckets, so pictures are streamed
// through this route instead. Private buckets (source code, installers, Media Cloud)
// are never served here.
export const Route = createFileRoute("/api/public/media/$")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const splat = (params as { _splat?: string })._splat || "";
        const [bucket, ...rest] = splat.split("/");
        const path = rest.map((p) => decodeURIComponent(p)).join("/");
        if (!(PUBLIC_MEDIA_BUCKETS as readonly string[]).includes(bucket) || !path || path.includes("..")) {
          return new Response("Not found", { status: 404 });
        }
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { data, error } = await supabaseAdmin.storage.from(bucket).download(path);
        if (error || !data) return new Response("Not found", { status: 404 });
        return new Response(data, {
          headers: {
            "Content-Type": data.type || "application/octet-stream",
            "Cache-Control": "public, max-age=86400, immutable",
            "X-Content-Type-Options": "nosniff",
          },
        });
      },
    },
  },
});
