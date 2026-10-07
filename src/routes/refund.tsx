import { createFileRoute } from "@tanstack/react-router";
import Screen from "@/screens/RefundPolicy";

export const Route = createFileRoute("/refund")({
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { title: "Refund Policy — Bnoy Studios" },
      { name: "description", content: "Refund policy for purchases made on Bnoy Studios." },
      { property: "og:title", content: "Refund Policy — Bnoy Studios" },
      { property: "og:description", content: "Refund policy for purchases made on Bnoy Studios." },
    ],
  }),
  component: Screen,
});
