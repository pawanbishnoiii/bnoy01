import { createFileRoute } from "@tanstack/react-router";
import Screen from "@/screens/Apps";

export const Route = createFileRoute("/apps")({
  head: () => ({
    meta: [
      { title: "Apps — Bnoy Studios" },
      { name: "description", content: "Download Android and Windows apps from Bnoy Studios." },
      { property: "og:title", content: "Apps — Bnoy Studios" },
      { property: "og:description", content: "Download Android and Windows apps from Bnoy Studios." },
    ],
  }),
  component: Screen,
});
