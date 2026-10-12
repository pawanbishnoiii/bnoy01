import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware';

// Tables an admin may back up / restore. Auth secrets (OTP codes, Truecaller proofs) are never exported.
export const BACKUP_TABLES = [
  'projects', 'project_versions', 'apps', 'categories', 'bookings', 'purchases', 'checkout_orders',
  'project_comments', 'project_likes', 'wishlists', 'team_members', 'media_files', 'notifications',
  'email_logs', 'email_theme', 'site_settings', 'truecaller_settings', 'truecaller_logs', 'profiles',
  'user_roles', 'user_login_logs', 'visitor_sessions', 'page_views', 'push_subscribers', 'system_checks', 'auth_settings',
] as const;
// Deleting these would lock people out or break the site, so delete is not offered for them.
const NO_DELETE = new Set(['profiles', 'user_roles', 'site_settings', 'email_theme', 'truecaller_settings', 'auth_settings']);
const NO_DATE = new Set(['site_settings', 'email_theme', 'truecaller_settings']);

const tableEnum = z.enum(BACKUP_TABLES);
const range = { from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(), to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional() };

async function admin(ctx: { supabase: any; userId: string }) {
  const { data } = await ctx.supabase.rpc('has_role', { _user_id: ctx.userId, _role: 'admin' });
  if (!data) throw new Error('Only admins can use backups.');
  const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
  return supabaseAdmin as any;
}
function applyRange(q: any, table: string, from?: string, to?: string) {
  if (NO_DATE.has(table)) return q;
  if (from) q = q.gte('created_at', `${from}T00:00:00Z`);
  if (to) q = q.lte('created_at', `${to}T23:59:59Z`);
  return q;
}

export const backupCounts = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object(range).parse(d))
  .handler(async ({ data, context }) => {
    const db = await admin(context);
    const out: Record<string, number> = {};
    await Promise.all(BACKUP_TABLES.map(async (t) => {
      const { count } = await applyRange(db.from(t).select('*', { count: 'exact', head: true }), t, data.from, data.to);
      out[t] = count ?? 0;
    }));
    return out;
  });

export const exportBackup = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ tables: z.array(tableEnum).min(1), ...range }).parse(d))
  .handler(async ({ data, context }) => {
    const db = await admin(context);
    const result: Record<string, unknown[]> = {};
    for (const t of data.tables) {
      const rows: unknown[] = [];
      for (let offset = 0; offset < 50000; offset += 1000) {
        const { data: page, error } = await applyRange(db.from(t).select('*'), t, data.from, data.to).range(offset, offset + 999);
        if (error) throw new Error(`${t}: ${error.message}`);
        rows.push(...(page || []));
        if (!page || page.length < 1000) break;
      }
      result[t] = rows;
    }
    return result as Record<string, any[]>;
  });

export const importBackup = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ table: tableEnum, rows: z.array(z.record(z.string(), z.any())).max(2000) }).parse(d))
  .handler(async ({ data, context }) => {
    const db = await admin(context);
    if (!data.rows.length) return { imported: 0 };
    const { error } = await db.from(data.table).upsert(data.rows);
    if (error) throw new Error(`${data.table}: ${error.message}`);
    return { imported: data.rows.length };
  });

export const deleteBackupData = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ table: tableEnum, confirm: z.string(), ...range }).parse(d))
  .handler(async ({ data, context }) => {
    if (NO_DELETE.has(data.table)) throw new Error('This data is protected and cannot be deleted here.');
    if (data.confirm !== data.table) throw new Error('Type the data name exactly to confirm.');
    const db = await admin(context);
    let q = db.from(data.table).delete({ count: 'exact' });
    q = applyRange(q, data.table, data.from, data.to);
    if (!data.from && !data.to) q = q.not('id', 'is', null);
    const { error, count } = await q;
    if (error) throw new Error(error.message);
    return { deleted: count ?? 0 };
  });
