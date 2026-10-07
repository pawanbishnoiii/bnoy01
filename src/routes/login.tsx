import { createFileRoute } from "@tanstack/react-router";
import Screen from "@/screens/Signup";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Sign in — Bnoy Studios" },
      { name: "description", content: "Sign in to your Bnoy Studios account." },
      { property: "og:title", content: "Sign in — Bnoy Studios" },
      { property: "og:description", content: "Sign in to your Bnoy Studios account." },
    ],
  }),
  component: Screen,
});
