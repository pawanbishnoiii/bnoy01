import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';
import { createClient } from '@supabase/supabase-js';
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware';

/** Admin-only: after re-entering their password, reveal the public deploy values needed on Vercel. */
export const revealDeployValues = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ password: z.string().min(1).max(200) }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: isAdmin } = await context.supabase.rpc('has_role', { _user_id: context.userId, _role: 'admin' });
    if (!isAdmin) throw new Error('Forbidden');
    const email = (context.claims as any)?.email as string | undefined;
    if (!email) throw new Error('Password check needs an email account.');
    const url = process.env['SUPABASE_URL']!;
    const key = process.env['SUPABASE_PUBLISHABLE_KEY']!;
    const check = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
    const { error } = await check.auth.signInWithPassword({ email, password: data.password });
    if (error) throw new Error('Wrong password.');
    await check.auth.signOut().catch(() => {});
    const projectId = process.env['SUPABASE_PROJECT_ID'] || new URL(url).hostname.split('.')[0];
    const site = 'https://bnoy01.lovable.app';
    return [
      ['SUPABASE_PROJECT_ID', projectId], ['SUPABASE_URL', url], ['SUPABASE_PUBLISHABLE_KEY', key],
      ['SUPABASE_ANON_KEY', process.env['SUPABASE_ANON_KEY'] || key],
      ['VITE_SUPABASE_PROJECT_ID', projectId], ['VITE_SUPABASE_URL', url], ['VITE_SUPABASE_PUBLISHABLE_KEY', key],
      ['Auth callback URL', `${url}/auth/v1/callback`], ['REST API URL', `${url}/rest/v1`], ['Storage URL', `${url}/storage/v1`],
      ['Site URL', site], ['Truecaller callback', `${site}/api/public/truecaller`], ['Sitemap', `${site}/sitemap.xml`], ['Robots', `${site}/robots.txt`],
      ['SMTP_USER', process.env['SMTP_USER'] || '(not set)'],
      ['Secrets kept private', 'Service role key, database password, SMTP password and AI key are never shown here — set them in Vercel from your own records.'],
    ] as [string, string][];
  });
