import { useEffect, useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { GitBranch, Plus, Star, Trash2, Save, Rocket, History, Globe, Smartphone, Monitor } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

type Target = { key: string; kind: 'project' | 'app'; id: string; label: string; platform?: string };
type Ver = { id: string; version: string; changelog: string; date: string; latest: boolean };

const bump = (v: string, part: 0 | 1 | 2) => {
  const n = (v || '1.0.0').replace(/^v/, '').split('.').map(x => parseInt(x) || 0);
  while (n.length < 3) n.push(0);
  n[part]++; for (let i = part + 1; i < 3; i++) n[i] = 0;
  return n.join('.');
};

export default function VersionHub() {
  const qc = useQueryClient();
  const { data: targets = [] } = useQuery({
    queryKey: ['vh-targets'],
    queryFn: async () => {
      const [{ data: p }, { data: a }] = await Promise.all([
        supabase.from('projects').select('id,title').order('created_at', { ascending: false }),
        supabase.from('apps').select('id,name,platform').order('created_at', { ascending: false }),
      ]);
      const apps = new Map<string, Target>();
      (a || []).forEach(x => { const k = `app:${x.name}:${x.platform}`; if (!apps.has(k)) apps.set(k, { key: k, kind: 'app', id: x.name, label: x.name, platform: x.platform || 'android' }); });
      return [...(p || []).map(x => ({ key: `project:${x.id}`, kind: 'project' as const, id: x.id, label: x.title })), ...apps.values()];
    },
  });
  const [sel, setSel] = useState('');
  useEffect(() => { if (!sel && targets[0]) setSel(targets[0].key); }, [targets, sel]);
  const target = targets.find(t => t.key === sel);

  const { data: versions = [], refetch } = useQuery({
    queryKey: ['vh-versions', sel],
    enabled: !!target,
    queryFn: async (): Promise<Ver[]> => {
      if (!target) return [];
      if (target.kind === 'project') {
        const { data } = await supabase.from('project_versions').select('id,version,changelog,released_at,is_latest').eq('project_id', target.id).order('released_at', { ascending: false });
        return (data || []).map(v => ({ id: v.id, version: v.version, changelog: v.changelog || '', date: v.released_at, latest: v.is_latest }));
      }
      const { data } = await supabase.from('apps').select('id,version,changelog,created_at,is_latest').eq('name', target.id).eq('platform', target.platform!).order('created_at', { ascending: false });
      return (data || []).map(v => ({ id: v.id, version: v.version || '1.0.0', changelog: v.changelog || '', date: (v.created_at || '').slice(0, 10), latest: !!v.is_latest }));
    },
  });

  const [active, setActive] = useState<string>('');
  const current = versions.find(v => v.id === active) || versions[0];
  const [notes, setNotes] = useState('');
  useEffect(() => setNotes(current?.changelog || ''), [current?.id]);
  const latest = versions.find(v => v.latest) || versions[0];
  const [draft, setDraft] = useState({ open: false, version: '', changelog: '', makeLatest: true });
  const [busy, setBusy] = useState(false);

  const done = (msg: string) => { toast.success(msg); refetch(); qc.invalidateQueries({ queryKey: ['studio-versions'] }); qc.invalidateQueries({ queryKey: ['studio-apps'] }); };
  const table = target?.kind === 'project' ? 'project_versions' : 'apps';

  const clearLatest = async () => {
    if (!target) return;
    if (target.kind === 'project') await supabase.from('project_versions').update({ is_latest: false }).eq('project_id', target.id);
    else await supabase.from('apps').update({ is_latest: false }).eq('name', target.id).eq('platform', target.platform!);
  };

  const create = async () => {
    if (!target || !/^\d+\.\d+(\.\d+)?$/.test(draft.version.replace(/^v/, ''))) return toast.error('Use a version like 1.2.0');
    if (versions.some(v => v.version.replace(/^v/, '') === draft.version.replace(/^v/, ''))) return toast.error('That version already exists');
    setBusy(true);
    try {
      const version = draft.version.replace(/^v/, '');
      if (target.kind === 'project') {
        const { data: base, error: baseError } = latest
          ? await supabase.from('project_versions').select('*').eq('id', latest.id).single()
          : await supabase.from('projects').select('short_desc,full_desc,price,discount_price,thumbnail_url,screenshots,video_url,preview_url,source_code_url,external_url_enabled,seo_title,seo_description').eq('id', target.id).single();
        if (baseError || !base) throw baseError || new Error('Base release not found');
        const { id: _id, created_at: _created, updated_at: _updated, project_id: _projectId, is_latest: _latest, released_at: _released, ...snapshot } = base as any;
        const { data: created, error } = await supabase.from('project_versions').insert({ ...snapshot, project_id: target.id, version, changelog: draft.changelog, notes: draft.changelog, is_latest: false, released_at: new Date().toISOString().slice(0, 10) }).select('id').single();
        if (error || !created) throw error || new Error('Version could not be created');
        if (draft.makeLatest) { await clearLatest(); const { error: latestError } = await supabase.from('project_versions').update({ is_latest: true }).eq('id', created.id); if (latestError) throw latestError; }
        if (draft.makeLatest) await supabase.from('projects').update({ version }).eq('id', target.id);
      } else {
        const { data: base } = await supabase.from('apps').select('*').eq('id', latest!.id).single();
        if (!base) throw new Error('Base release not found');
        const { id: _id, created_at: _c, download_count: _d, ...rest } = base;
        const { data: created, error } = await supabase.from('apps').insert({ ...rest, version, changelog: draft.changelog, is_latest: false }).select('id').single();
        if (error || !created) throw error || new Error('Version could not be created');
        if (draft.makeLatest) { await clearLatest(); const { error: latestError } = await supabase.from('apps').update({ is_latest: true }).eq('id', created.id); if (latestError) throw latestError; }
      }
      setDraft({ open: false, version: '', changelog: '', makeLatest: true });
      done(`v${version} created`);
    } catch (e) { toast.error(e instanceof Error ? e.message : 'Could not create version'); }
    finally { setBusy(false); }
  };

  const makeLatest = async (v: Ver) => { await clearLatest(); const { error } = await supabase.from(table).update({ is_latest: true }).eq('id', v.id); if (error) return toast.error(error.message); if (target?.kind === 'project') await supabase.from('projects').update({ version: v.version }).eq('id', target.id); done(`v${v.version} is now live`); };
  const saveNotes = async () => { if (!current) return; const { error } = await supabase.from(table).update({ changelog: notes }).eq('id', current.id); error ? toast.error(error.message) : done('Release notes saved'); };
  const remove = async (v: Ver) => { if (v.latest) return toast.error('Make another version latest first'); if (!confirm(`Delete v${v.version}?`)) return; const { error } = await supabase.from(table).delete().eq('id', v.id); error ? toast.error(error.message) : done('Version deleted'); };

  const Icon = target?.kind === 'project' ? Globe : target?.platform === 'windows' ? Monitor : Smartphone;
  const sorted = useMemo(() => versions, [versions]);

  return (
    <section className="relative overflow-hidden rounded-2xl border border-primary/30 bg-card p-5 sm:p-6">
      <div className="relative flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-primary"><GitBranch className="h-4 w-4" />Version control</p>
          <h2 className="mt-1 font-display text-2xl font-bold">Releases & versions</h2>
          <p className="text-sm text-muted-foreground">Pick a product, ship a new version, or manage an older one.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Select value={sel} onValueChange={v => { setSel(v); setActive(''); }}>
            <SelectTrigger className="w-64"><SelectValue placeholder="Choose a product" /></SelectTrigger>
            <SelectContent>{targets.map(t => <SelectItem key={t.key} value={t.key}>{t.label}{t.kind === 'app' ? ` · ${t.platform}` : ''}</SelectItem>)}</SelectContent>
          </Select>
          <Button disabled={!target} onClick={() => setDraft({ open: true, version: bump(latest?.version || '0.9.0', 2), changelog: '', makeLatest: true })}><Plus className="mr-2 h-4 w-4" />New version</Button>
        </div>
      </div>

      {target && <div className="relative mt-5 flex flex-wrap items-center gap-3 rounded-xl bg-muted/50 p-4">
        <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/15"><Icon className="h-5 w-5 text-primary" /></span>
        <div className="min-w-0 flex-1"><p className="truncate font-semibold">{target.label}</p><p className="text-xs text-muted-foreground">{versions.length} versions · live: {latest ? `v${latest.version}` : 'none'}</p></div>
        {latest && <span className="flex items-center gap-1 rounded-full bg-primary px-3 py-1 text-xs font-bold text-primary-foreground"><Rocket className="h-3.5 w-3.5" />v{latest.version} live</span>}
      </div>}

      <AnimatePresence>{draft.open && <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="relative mt-4 overflow-hidden rounded-xl border border-border p-4">
        <p className="mb-3 font-semibold">New version for {target?.label}</p>
        <div className="flex flex-wrap items-center gap-2">
          <Input className="w-36 font-mono" value={draft.version} onChange={e => setDraft(d => ({ ...d, version: e.target.value }))} placeholder="1.2.0" />
          {(['Patch', 'Minor', 'Major'] as const).map((l, i) => <Button key={l} type="button" size="sm" variant="outline" onClick={() => setDraft(d => ({ ...d, version: bump(latest?.version || '1.0.0', (2 - i) as 0 | 1 | 2) }))}>{l}</Button>)}
          <label className="ml-auto flex items-center gap-2 text-sm"><input type="checkbox" checked={draft.makeLatest} onChange={e => setDraft(d => ({ ...d, makeLatest: e.target.checked }))} />Make it live</label>
        </div>
        <Textarea className="mt-3" rows={4} placeholder="What changed in this version?" value={draft.changelog} onChange={e => setDraft(d => ({ ...d, changelog: e.target.value }))} />
        <div className="mt-3 flex justify-end gap-2"><Button variant="ghost" onClick={() => setDraft(d => ({ ...d, open: false }))}>Cancel</Button><Button disabled={busy} onClick={create}><Rocket className="mr-2 h-4 w-4" />Publish version</Button></div>
      </motion.div>}</AnimatePresence>

      <div className="relative mt-5 grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)]">
        <div>
          <p className="mb-2 flex items-center gap-2 text-sm font-semibold"><History className="h-4 w-4" />Version history</p>
          <div className="flex gap-2 overflow-x-auto pb-2 lg:flex-col lg:overflow-visible">
            {sorted.map(v => <motion.button layout key={v.id} onClick={() => setActive(v.id)} className={`flex min-w-40 items-center justify-between gap-2 rounded-xl border p-3 text-left text-sm transition-colors ${current?.id === v.id ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}`}>
              <span><span className="font-mono font-bold">v{v.version}</span><span className="block text-xs text-muted-foreground">{v.date}</span></span>
              {v.latest ? <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-bold text-primary">LIVE</span> : <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">OLD</span>}
            </motion.button>)}
            {target && !versions.length && <p className="text-sm text-muted-foreground">No versions yet — create the first one.</p>}
          </div>
        </div>
        {current && <div className="rounded-xl border border-border p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="font-display text-lg font-bold">v{current.version} {current.latest && <Star className="inline h-4 w-4 fill-primary text-primary" />}</p>
            <div className="flex gap-2">
              {!current.latest && <Button size="sm" variant="outline" onClick={() => makeLatest(current)}><Rocket className="mr-2 h-4 w-4" />Make live</Button>}
              <Button size="sm" variant="ghost" aria-label="Delete version" onClick={() => remove(current)}><Trash2 className="h-4 w-4" /></Button>
            </div>
          </div>
          <Textarea className="mt-3" rows={6} value={notes} onChange={e => setNotes(e.target.value)} placeholder="Release notes" />
          <div className="mt-3 flex justify-end"><Button size="sm" onClick={saveNotes} disabled={notes === current.changelog}><Save className="mr-2 h-4 w-4" />Save notes</Button></div>
        </div>}
      </div>
    </section>
  );
}
