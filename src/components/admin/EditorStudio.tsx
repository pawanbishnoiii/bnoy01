import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Globe, Smartphone, Monitor, GitBranch, Sparkles, Search, Plus, Clock, Star } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';

type Kind = 'all' | 'web' | 'android' | 'windows';
type Release = { id: string; kind: Exclude<Kind, 'all'>; title: string; version: string; date: string; latest: boolean; meta?: string; projectId?: string };

export default function EditorStudio({ onGo, onEdit }: { onGo: (tab: string) => void; onEdit: (id: string) => void }) {
  const [kind, setKind] = useState<Kind>('all');
  const [q, setQ] = useState('');
  const { data: versions, isLoading: l1 } = useQuery({ queryKey: ['studio-versions'], queryFn: async () => (await supabase.from('project_versions').select('id,project_id,version,released_at,is_latest,projects(title)').order('released_at', { ascending: false }).limit(60)).data || [] });
  const { data: apps, isLoading: l2 } = useQuery({ queryKey: ['studio-apps'], queryFn: async () => (await supabase.from('apps').select('id,name,version,platform,architecture,is_latest,created_at').order('created_at', { ascending: false }).limit(60)).data || [] });
  const { data: projectCount = 0 } = useQuery({ queryKey: ['studio-pcount'], queryFn: async () => (await supabase.from('projects').select('id', { count: 'exact', head: true })).count || 0 });

  const releases = useMemo<Release[]>(() => [
    ...(versions || []).map((v: any) => ({ id: v.id, kind: 'web' as const, title: v.projects?.title || 'Project', version: v.version, date: v.released_at, latest: v.is_latest, projectId: v.project_id })),
    ...(apps || []).map((a: any) => ({ id: a.id, kind: (a.platform === 'windows' ? 'windows' : 'android') as Release['kind'], title: a.name, version: a.version || '1.0', date: (a.created_at || '').slice(0, 10), latest: !!a.is_latest, meta: a.platform === 'windows' ? a.architecture : undefined })),
  ].sort((a, b) => b.date.localeCompare(a.date)), [versions, apps]);

  const shown = releases.filter(r => (kind === 'all' || r.kind === kind) && r.title.toLowerCase().includes(q.toLowerCase()));
  const count = (k: Release['kind']) => releases.filter(r => r.kind === k).length;

  const modes = [
    { tab: 'add', icon: Globe, title: 'Web project', desc: 'New website or source-code product', stat: `${projectCount} projects`, grad: 'from-primary/20 to-primary/5' },
    { tab: 'apps', icon: Smartphone, title: 'Mobile app', desc: 'Upload an Android APK release', stat: `${count('android')} releases`, grad: 'from-accent/40 to-accent/5' },
    { tab: 'apps', icon: Monitor, title: 'Windows software', desc: 'Installer, architecture, requirements', stat: `${count('windows')} releases`, grad: 'from-secondary to-secondary/20' },
    { tab: 'projects', icon: GitBranch, title: 'Edit & versions', desc: 'Update projects and ship new versions', stat: `${count('web')} versions`, grad: 'from-muted to-muted/20' },
  ];
  const icon = { web: Globe, android: Smartphone, windows: Monitor };
  const loading = l1 || l2;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div><h1 className="font-display text-2xl font-bold flex items-center gap-2"><Sparkles className="h-6 w-6 text-primary" />Editor Studio</h1><p className="text-sm text-muted-foreground">Create, edit and version every product from one place.</p></div>
        <button onClick={() => onGo('add')} className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-card hover:opacity-90"><Plus className="h-4 w-4" />Add new project</button>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {modes.map((m, i) => (
          <motion.button key={m.title} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }} whileHover={{ y: -4 }}
            onClick={() => onGo(m.tab)} className={`group relative overflow-hidden rounded-2xl border border-border bg-gradient-to-br ${m.grad} p-5 text-left`}>
            <div className="absolute -right-6 -bottom-6 opacity-10 group-hover:opacity-20 transition-opacity"><m.icon className="h-28 w-28" /></div>
            <span className="inline-flex rounded-xl bg-card p-2.5 shadow-card"><m.icon className="h-6 w-6 text-primary" /></span>
            <p className="font-display font-bold mt-3">{m.title}</p><p className="text-xs text-muted-foreground mt-1">{m.desc}</p>
            <p className="mt-3 text-xs font-semibold text-primary">{m.stat} →</p>
          </motion.button>
        ))}
      </div>

      <section className="rounded-2xl border border-border bg-card p-4 sm:p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-display font-bold flex items-center gap-2"><Clock className="h-4 w-4" />Release timeline</h2>
          <div className="flex flex-wrap gap-1.5">
            {(['all', 'web', 'android', 'windows'] as Kind[]).map(k => <button key={k} onClick={() => setKind(k)} className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${kind === k ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>{k}</button>)}
          </div>
        </div>
        <div className="relative max-w-sm"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input className="pl-9" placeholder="Search releases…" value={q} onChange={e => setQ(e.target.value)} /></div>
        {loading ? <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-14 w-full rounded-xl" />)}</div> :
        <ol className="relative border-l border-border ml-3 space-y-3">
          {shown.map(r => { const I = icon[r.kind]; return (
            <li key={`${r.kind}-${r.id}`} className="ml-5">
              <span className="absolute -left-3 flex h-6 w-6 items-center justify-center rounded-full border border-border bg-card"><I className="h-3 w-3 text-primary" /></span>
              <button onClick={() => r.projectId ? onEdit(r.projectId) : onGo('apps')} className="w-full flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border/60 p-3 text-left text-sm hover:border-primary transition-colors">
                <span className="font-semibold">{r.title} <span className="ml-1 rounded-md bg-muted px-1.5 py-0.5 font-mono text-xs">v{r.version}</span>{r.latest && <Star className="inline h-3.5 w-3.5 ml-1 text-primary fill-primary" />}</span>
                <span className="text-xs text-muted-foreground capitalize">{r.kind}{r.meta ? ` · ${r.meta}` : ''} · {r.date}</span>
              </button>
            </li>); })}
          {shown.length === 0 && <p className="ml-5 text-sm text-muted-foreground">No releases found.</p>}
        </ol>}
      </section>
    </div>
  );
}
