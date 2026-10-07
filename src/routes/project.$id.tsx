import { createFileRoute } from "@tanstack/react-router";
import Screen from "@/screens/ProjectDetail";

export const Route = createFileRoute("/project/$id")({
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { title: "Project Details — Bnoy Studios" },
      { name: "description", content: "Project details, live preview and pricing." },
      { property: "og:title", content: "Project Details — Bnoy Studios" },
      { property: "og:description", content: "Project details, live preview and pricing." },
    ],
  }),
  component: Screen,
});
