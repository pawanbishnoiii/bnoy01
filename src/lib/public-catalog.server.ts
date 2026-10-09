import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/integrations/supabase/types';

export function publicCatalogClient() {
  const url = process.env['SUPABASE_URL'];
  const key = process.env['SUPABASE_PUBLISHABLE_KEY'] || process.env['SUPABASE_ANON_KEY'];
  if (!url || !key) throw new Error('Catalog is temporarily unavailable.');
  return createClient<Database>(url,key,{ auth:{persistSession:false,autoRefreshToken:false}, global:{fetch: (input,init) => {
    const headers = new Headers(init?.headers);
    if (key.startsWith('sb_')) { headers.delete('Authorization'); headers.set('apikey',key); }
    return fetch(input,{...init,headers});
  }} });
}