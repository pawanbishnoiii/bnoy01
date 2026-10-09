import { createFileRoute } from "@tanstack/react-router";
import { publicCatalogClient } from '@/lib/public-catalog.server';

const esc = (s: string) => s.replace(/[<>&'"]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", '"': "&quot;" })[c]!);

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const origin = new URL(request.url).origin;
        const sb = publicCatalogClient();
        const [projectResult, settingsResult, appResult] = await Promise.all([
          sb.from("projects").select("id, slug, created_at, noindex").eq("status", "published"),
          sb.from("site_settings").select("site_url").limit(1).maybeSingle(),
          sb.from('apps').select('id,created_at').eq('status','published'),
        ]);
        if (projectResult.error || settingsResult.error || appResult.error) return new Response('Sitemap temporarily unavailable',{status:503});
        const projects = projectResult.data;
        const settings = settingsResult.data;
        const base = (settings?.site_url || origin).replace(/\/$/, "");
        const urls: { loc: string; lastmod?: string; priority: string }[] = [
          { loc: `${base}/`, priority: "1.0" },
          { loc: `${base}/marketplace`, priority: "0.9" },
          { loc: `${base}/apps`, priority: "0.8" },
          { loc: `${base}/windows`, priority: "0.8" },
          { loc: `${base}/refund`, priority: "0.3" },
          { loc: `${base}/call`, priority: '0.6' },
          ...(appResult.data || []).map(a => ({loc:`${base}/app/${a.id}`,lastmod:a.created_at?.slice(0,10),priority:'0.7'})),
          ...(projects ?? [])
            .filter((p) => !p.noindex)
            .map((p) => ({
              loc: p.slug ? `${base}/p/${p.slug}` : `${base}/project/${p.id}`,
              lastmod: p.created_at?.slice(0, 10),
              priority: "0.7",
            })),
        ];
        const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls
          .map((u) => `  <url><loc>${esc(u.loc)}</loc>${u.lastmod ? `<lastmod>${u.lastmod}</lastmod>` : ""}<priority>${u.priority}</priority></url>`)
          .join("\n")}\n</urlset>\n`;
        return new Response(xml, { headers: { "Content-Type": "application/xml; charset=utf-8", "Cache-Control": "public, max-age=3600" } });
      },
    },
  },
});
