import { createFileRoute } from "@tanstack/react-router";
import Screen from "@/screens/Apps";

export const Route = createFileRoute("/apps")({
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { title: "Apps — Bnoy Studios" },
      { name: "description", content: "Download Android and Windows apps from Bnoy Studios." },
      { property: "og:title", content: "Apps — Bnoy Studios" },
      { property: "og:description", content: "Download Android and Windows apps from Bnoy Studios." },
    ],
  }),
  component: Screen,
});
