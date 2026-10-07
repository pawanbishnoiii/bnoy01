import { createFileRoute } from "@tanstack/react-router";
import Screen from "@/screens/Marketplace";

export const Route = createFileRoute("/marketplace")({
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { title: "Marketplace — Bnoy Studios" },
      { name: "description", content: "Browse premium, ready-to-deploy web and mobile projects with live previews." },
      { property: "og:title", content: "Marketplace — Bnoy Studios" },
      { property: "og:description", content: "Browse premium, ready-to-deploy web and mobile projects with live previews." },
    ],
  }),
  component: Screen,
});
