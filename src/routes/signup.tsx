import { createFileRoute } from "@tanstack/react-router";
import Screen from "@/screens/Signup";

export const Route = createFileRoute("/signup")({
  head: () => ({
    meta: [
      { title: "Create account — Bnoy Studios" },
      { name: "description", content: "Sign up for Bnoy Studios to buy and download projects." },
      { property: "og:title", content: "Create account — Bnoy Studios" },
      { property: "og:description", content: "Sign up for Bnoy Studios to buy and download projects." },
    ],
  }),
  component: Screen,
});
