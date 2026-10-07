import { createFileRoute } from "@tanstack/react-router";
import Screen from "@/screens/Signup";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { title: "Sign in — Bnoy Studios" },
      { name: "description", content: "Sign in to your Bnoy Studios account." },
      { property: "og:title", content: "Sign in — Bnoy Studios" },
      { property: "og:description", content: "Sign in to your Bnoy Studios account." },
    ],
  }),
  component: Screen,
});
