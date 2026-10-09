import { createFileRoute } from '@tanstack/react-router';
import { getPublicApp } from '@/lib/public-catalog.functions';
import AppDetail from '@/screens/AppDetail';
export const Route = createFileRoute('/app/$id')({
  loader:({params}) => getPublicApp({data:{id:params.id}}),
  head:({loaderData:app}) => {
    const title = app ? `${app.name} for ${app.platform || 'mobile & desktop'} — Bnoy Studios` : 'Software unavailable — Bnoy Studios';
    const description = app?.description?.replace(/<[^>]*>/g,'').slice(0,180) || 'Software details, screenshots, requirements and release notes from Bnoy Studios.';
    const image = app?.screenshots_urls?.find((s):s is string => typeof s === 'string' && s.startsWith('https://')) || app?.icon_url;
    return {meta:[{title},{name:'description',content:description},{property:'og:title',content:title},{property:'og:description',content:description},{property:'og:type',content:'website'},{name:'twitter:card',content:'summary_large_image'},...(!app ? [{name:'robots',content:'noindex'}] : []),...(image?.startsWith('https://') ? [{property:'og:image',content:image},{name:'twitter:image',content:image}] : [])]};
  },
  component:() => <AppDetail app={Route.useLoaderData()} />,
});