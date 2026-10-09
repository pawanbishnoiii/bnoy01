import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';
import { publicCatalogClient } from './public-catalog.server';
export const getPublicProject = createServerFn({method:'GET'})
  .inputValidator(d => z.object({ value:z.string().min(1).max(160), by:z.enum(['id','slug']) }).parse(d))
  .handler(async ({data}) => {
    const client = publicCatalogClient();
    const {data:project,error} = await client.from('projects').select('id,title,short_desc,slug,thumbnail_url,seo_title,seo_description,noindex,created_at').eq('status','published').eq(data.by,data.value).maybeSingle();
    if (error) throw new Error('Project could not load.');
    return project;
  });
export const getPublicApp = createServerFn({method:'GET'})
  .inputValidator(d => z.object({id:z.string().uuid()}).parse(d))
  .handler(async ({data}) => {
    const client = publicCatalogClient();
    const {data:app,error} = await client.from('apps').select('id,name,description,version,platform,price,icon_url,screenshots_urls,file_size,changelog,download_count,is_latest,status,created_at,architecture,system_requirements').eq('status','published').eq('id',data.id).maybeSingle();
    if (error) throw new Error('Software could not load.');
    return app;
  });