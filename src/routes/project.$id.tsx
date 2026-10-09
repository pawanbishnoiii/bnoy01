import { createFileRoute } from "@tanstack/react-router";
import Screen from "@/screens/ProjectDetail";
import { getPublicProject } from '@/lib/public-catalog.functions';
import { projectHead } from '@/lib/catalog-head';

export const Route = createFileRoute("/project/$id")({
  loader: ({params}) => getPublicProject({data:{value:params.id,by:'id'}}),
  head: ({loaderData}) => projectHead(loaderData),
  component: Screen,
});
