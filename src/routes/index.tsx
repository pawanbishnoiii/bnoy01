import { createFileRoute } from "@tanstack/react-router";
import Screen from "@/screens/Index";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Bnoy Studios — Premium web & mobile projects" },
      { name: "description", content: "Buy, preview and ship production-ready SaaS, dashboards, e-commerce and portfolio projects in minutes." },
      { property: "og:title", content: "Bnoy Studios — Premium web & mobile projects" },
      { property: "og:description", content: "Buy, preview and ship production-ready SaaS, dashboards, e-commerce and portfolio projects in minutes." },
    ],
  }),
  component: Screen,
});
