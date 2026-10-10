import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Globe, Smartphone, Monitor, GitBranch, Sparkles, Search, Plus, Clock, Star } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import webImage from '@/assets/studio-web.png';
import appImage from '@/assets/studio-app.png';
import windowsImage from '@/assets/studio-windows.png';
import automationImage from '@/assets/studio-automation.png';
import versionControlImage from '@/assets/studio-version-control.webp';
import VersionHub from './VersionHub';

type Kind = 'all' | 'web' | 'android' | 'windows';
type Release = { id: string; kind: Exclude<Kind, 'all'>; title: string; version: string; date: string; latest: boolean; meta?: string; projectId?: string };

export default function EditorStudio({ onGo, onEdit, onCreate }: { onGo: (tab: string) => void; onEdit: (id: string) => void; onCreate: (type: string) => void }) {
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
    { type: 'website', image: webImage, icon: Globe, title: 'Web project', stat: `${projectCount} projects` },
    { type: 'app', image: appImage, icon: Smartphone, title: 'Mobile app', stat: `${count('android')} releases` },
    { type: 'windows', image: windowsImage, icon: Monitor, title: 'Windows software', stat: `${count('windows')} releases` },
    { type: 'automation', image: automationImage, icon: GitBranch, title: 'Automation', stat: 'New workflow' },
  ];
  const icon = { web: Globe, android: Smartphone, windows: Monitor };
  const loading = l1 || l2;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div><h1 className="font-display text-2xl font-bold flex items-center gap-2"><Sparkles className="h-6 w-6 text-primary" />Editor Studio</h1><p className="text-sm text-muted-foreground">Create, edit and version every product from one place.</p></div>
        <img src={versionControlImage} alt="" width={960} height={600} className="hidden h-24 w-44 object-contain lg:block" />
        <Button variant="outline" onClick={() => onGo('projects')}><GitBranch className="mr-2 h-4 w-4" />Manage projects</Button>
      </div>

      <VersionHub />

      <h2 className="font-display text-lg font-bold">Start something new</h2>
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {modes.map((m, i) => (
          <motion.div key={m.title} initial={false} whileHover={{ y: -4 }} className="overflow-hidden rounded-lg border border-border bg-card p-5">
            <img src={m.image} alt="" loading="lazy" width={384} height={512} className="mx-auto h-36 w-full object-contain" />
            <p className="mt-3 flex items-center gap-2 font-display font-bold"><m.icon className="h-4 w-4 text-primary" />{m.title}</p>
            <p className="mt-2 text-xs text-muted-foreground">{m.stat}</p>
            <Button className="mt-4 w-full" variant="outline" aria-label={`Create ${m.title.toLowerCase()}`} onClick={() => onCreate(m.type)}><Plus className="mr-2 h-4 w-4" />Create</Button>
          </motion.div>
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
