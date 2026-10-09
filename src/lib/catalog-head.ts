type ProjectHead = { title:string; short_desc:string; seo_title?:string|null; seo_description?:string|null; noindex?:boolean; thumbnail_url?:string|null };
export function projectHead(project?: ProjectHead | null) {
  const title = project ? project.seo_title || `${project.title} — Bnoy Studios` : 'Project unavailable — Bnoy Studios';
  const description = project?.seo_description || project?.short_desc || 'This Bnoy Studios project is unavailable.';
  return { meta:[ {title}, {name:'description',content:description}, {property:'og:title',content:title}, {property:'og:description',content:description}, {property:'og:type',content:'website'}, {name:'twitter:card',content:'summary_large_image'}, ...(!project || project.noindex ? [{name:'robots',content:'noindex'}] : []), ...(project?.thumbnail_url?.startsWith('https://') ? [{property:'og:image',content:project.thumbnail_url},{name:'twitter:image',content:project.thumbnail_url}] : []) ] };
}