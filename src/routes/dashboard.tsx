import { createFileRoute } from "@tanstack/react-router";
import Screen from "@/screens/Dashboard";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "My Dashboard — Bnoy Studios" },
      { name: "description", content: "Your purchases, downloads and wishlist." },
      { property: "og:title", content: "My Dashboard — Bnoy Studios" },
      { property: "og:description", content: "Your purchases, downloads and wishlist." },
    ],
  }),
  component: Screen,
});
