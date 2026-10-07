import { createFileRoute } from "@tanstack/react-router";
import Screen from "@/screens/ProjectDetail";

export const Route = createFileRoute("/p/$slug")({
  head: () => ({
    meta: [
      { title: "Project — Bnoy Studios" },
      { name: "description", content: "Project details, live preview and pricing." },
      { property: "og:title", content: "Project — Bnoy Studios" },
      { property: "og:description", content: "Project details, live preview and pricing." },
    ],
  }),
  component: Screen,
});
