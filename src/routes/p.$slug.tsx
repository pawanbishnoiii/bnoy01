import { createFileRoute } from "@tanstack/react-router";
import Screen from "@/screens/ProjectDetail";
import { getPublicProject } from '@/lib/public-catalog.functions';
import { projectHead } from '@/lib/catalog-head';

export const Route = createFileRoute("/p/$slug")({
  loader: ({params}) => getPublicProject({data:{value:params.slug,by:'slug'}}),
  head: ({loaderData}) => projectHead(loaderData),
  component: Screen,
});
