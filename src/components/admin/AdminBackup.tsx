import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useServerFn } from '@tanstack/react-start';
import { zipSync, unzipSync, strToU8, strFromU8 } from 'fflate';
import { Archive, Download, Upload, Trash2, Search, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { BACKUP_TABLES, backupCounts, exportBackup, importBackup, deleteBackupData } from '@/lib/backup.functions';

type T = (typeof BACKUP_TABLES)[number];
const label = (t: string) => t.replace(/_/g, ' ');

export default function AdminBackup() {
  const counts = useServerFn(backupCounts);
  const exp = useServerFn(exportBackup);
  const imp = useServerFn(importBackup);
  const del = useServerFn(deleteBackupData);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [q, setQ] = useState('');
  const [sel, setSel] = useState<Set<T>>(new Set(['projects', 'project_versions', 'apps', 'bookings', 'team_members', 'site_settings']));
  const [busy, setBusy] = useState('');
  const [delTable, setDelTable] = useState<T | ''>('');
  const [confirm, setConfirm] = useState('');
  const range = { from: from || undefined, to: to || undefined };
  const { data: n = {}, refetch, isFetching } = useQuery({ queryKey: ['backup-counts', from, to], queryFn: () => counts({ data: range }) });
  const shown = BACKUP_TABLES.filter((t) => t.includes(q.toLowerCase().replace(/ /g, '_')));
  const toggle = (t: T) => setSel((s) => { const x = new Set(s); x.has(t) ? x.delete(t) : x.add(t); return x; });

  const doExport = async () => {
    if (!sel.size) return toast.error('Choose at least one data type.');
    setBusy('export');
    try {
      const data = await exp({ data: { tables: [...sel], ...range } });
      const files: Record<string, Uint8Array> = { 'manifest.json': strToU8(JSON.stringify({ app: 'Bnoy Studios', created: new Date().toISOString(), from, to, tables: Object.fromEntries(Object.entries(data).map(([k, v]) => [k, v.length])) }, null, 2)) };
      for (const [t, rows] of Object.entries(data)) files[`${t}.json`] = strToU8(JSON.stringify(rows, null, 2));
      const blob = new Blob([zipSync(files, { level: 6 })], { type: 'application/zip' });
      const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `bnoy-backup-${new Date().toISOString().slice(0, 10)}.zip`; a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 2000);
      toast.success('Backup downloaded');
    } catch (e) { toast.error(e instanceof Error ? e.message : 'Export failed'); } finally { setBusy(''); }
  };

  const doImport = async (file: File) => {
    setBusy('import');
    try {
      const entries = unzipSync(new Uint8Array(await file.arrayBuffer()));
      let total = 0;
      for (const [name, bytes] of Object.entries(entries)) {
        const t = name.replace(/\.json$/, '') as T;
        if (!(BACKUP_TABLES as readonly string[]).includes(t)) continue;
        const rows = JSON.parse(strFromU8(bytes));
        if (!Array.isArray(rows)) continue;
        for (let i = 0; i < rows.length; i += 500) total += (await imp({ data: { table: t, rows: rows.slice(i, i + 500) } })).imported;
      }
      toast.success(`Imported ${total} records`); refetch();
    } catch (e) { toast.error(e instanceof Error ? e.message : 'Import failed. Use a backup ZIP from this page.'); } finally { setBusy(''); }
  };

  const doDelete = async () => {
    if (!delTable) return;
    setBusy('delete');
    try { const r = await del({ data: { table: delTable, confirm, ...range } }); toast.success(`Deleted ${r.deleted} records`); setConfirm(''); refetch(); }
    catch (e) { toast.error(e instanceof Error ? e.message : 'Delete failed'); } finally { setBusy(''); }
  };

  return <div className="max-w-5xl space-y-6">
    <div><h1 className="flex items-center gap-2 font-display text-2xl font-bold"><Archive className="h-6 w-6 text-primary" />Backup & Restore</h1><p className="text-sm text-muted-foreground">Download your data as a ZIP, restore it later, or clean up old records.</p></div>

    <section className="rounded-2xl border border-border bg-card p-5 space-y-4">
      <div className="grid gap-3 sm:grid-cols-[1fr_auto_auto]">
        <div className="relative"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input className="pl-9" placeholder="Filter data types…" value={q} onChange={(e) => setQ(e.target.value)} /></div>
        <div className="flex items-center gap-2"><Label htmlFor="bk-from" className="text-xs">From</Label><Input id="bk-from" type="date" value={from} onChange={(e) => setFrom(e.target.value)} /></div>
        <div className="flex items-center gap-2"><Label htmlFor="bk-to" className="text-xs">To</Label><Input id="bk-to" type="date" value={to} onChange={(e) => setTo(e.target.value)} /></div>
      </div>
      <div className="flex flex-wrap gap-2 text-xs">
        <Button size="sm" variant="outline" onClick={() => setSel(new Set(BACKUP_TABLES))}>Select all</Button>
        <Button size="sm" variant="ghost" onClick={() => setSel(new Set())}>Clear</Button>
        {isFetching && <span className="flex items-center gap-1 text-muted-foreground"><Loader2 className="h-3 w-3 animate-spin" />Counting…</span>}
      </div>
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {shown.map((t) => <label key={t} className={`flex cursor-pointer items-center justify-between gap-2 rounded-xl border p-3 text-sm capitalize ${sel.has(t) ? 'border-primary bg-primary/5' : 'border-border'}`}>
          <span className="flex items-center gap-2"><input type="checkbox" checked={sel.has(t)} onChange={() => toggle(t)} />{label(t)}</span>
          <span className="rounded-full bg-muted px-2 py-0.5 font-mono text-xs">{n[t] ?? '–'}</span>
        </label>)}
      </div>
      <div className="flex flex-wrap gap-2">
        <Button onClick={doExport} disabled={!!busy}>{busy === 'export' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}Export ZIP ({sel.size})</Button>
        <label className="inline-flex cursor-pointer items-center rounded-md border border-border px-4 py-2 text-sm font-medium hover:bg-muted">
          {busy === 'import' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}Import ZIP
          <input type="file" accept=".zip,application/zip" className="hidden" disabled={!!busy} onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ''; if (f && window.confirm('Import will add or overwrite matching records. Continue?')) doImport(f); }} />
        </label>
      </div>
      <p className="text-xs text-muted-foreground">Date filters apply to export, counts and delete. Import adds new records and updates existing ones with the same ID.</p>
    </section>

    <section className="rounded-2xl border border-destructive/30 bg-destructive/5 p-5 space-y-3">
      <h2 className="flex items-center gap-2 font-semibold text-destructive"><Trash2 className="h-4 w-4" />Delete data</h2>
      <p className="text-sm text-muted-foreground">Export a backup first. Deletes records of one type{from || to ? ' within the chosen dates' : ' (all dates)'}. Users, roles and site settings are protected.</p>
      <div className="grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
        <select value={delTable} onChange={(e) => { setDelTable(e.target.value as T); setConfirm(''); }} className="h-10 rounded-md border border-border bg-background px-3 text-sm capitalize">
          <option value="">Choose data type…</option>
          {BACKUP_TABLES.filter((t) => !['profiles', 'user_roles', 'site_settings', 'email_theme', 'truecaller_settings', 'auth_settings'].includes(t)).map((t) => <option key={t} value={t}>{label(t)} ({n[t] ?? 0})</option>)}
        </select>
        <Input placeholder={delTable ? `Type "${delTable}" to confirm` : 'Confirm'} value={confirm} onChange={(e) => setConfirm(e.target.value)} disabled={!delTable} />
        <Button variant="destructive" disabled={!delTable || confirm !== delTable || !!busy} onClick={doDelete}>{busy === 'delete' ? 'Deleting…' : 'Delete'}</Button>
      </div>
    </section>
  </div>;
}
