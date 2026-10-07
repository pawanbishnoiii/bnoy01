import { createFileRoute } from "@tanstack/react-router";
import Screen from "@/screens/AdminPanel";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { title: "Admin — Bnoy Studios" },
      { name: "description", content: "Bnoy Studios admin dashboard." },
      { property: "og:title", content: "Admin — Bnoy Studios" },
      { property: "og:description", content: "Bnoy Studios admin dashboard." },
    ],
  }),
  component: Screen,
});
