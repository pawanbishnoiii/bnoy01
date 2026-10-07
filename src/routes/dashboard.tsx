import { createFileRoute } from "@tanstack/react-router";
import Screen from "@/screens/Dashboard";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { title: "My Dashboard — Bnoy Studios" },
      { name: "description", content: "Your purchases, downloads and wishlist." },
      { property: "og:title", content: "My Dashboard — Bnoy Studios" },
      { property: "og:description", content: "Your purchases, downloads and wishlist." },
    ],
  }),
  component: Screen,
});
