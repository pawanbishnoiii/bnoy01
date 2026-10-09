import { useQuery } from '@tanstack/react-query';
import { Globe, Smartphone, Monitor, GitBranch, Sparkles } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

export default function EditorStudio({ onGo, onEdit }: { onGo: (tab: string) => void; onEdit: (id: string) => void }) {
  const { data: versions = [] } = useQuery({ queryKey: ['studio-versions'], queryFn: async () => (await supabase.from('project_versions').select('id,project_id,version,released_at,is_latest,projects(title)').order('released_at', { ascending: false }).limit(20)).data || [] });
  const { data: apps = [] } = useQuery({ queryKey: ['studio-apps'], queryFn: async () => (await supabase.from('apps').select('id,name,version,platform,architecture,is_latest').order('created_at', { ascending: false }).limit(20)).data || [] });
  const modes = [
    { tab: 'add', icon: Globe, title: 'Web project', desc: 'Create a new website or source-code product.' },
    { tab: 'apps', icon: Smartphone, title: 'Mobile app', desc: 'Upload a new Android app and its APK.' },
    { tab: 'apps', icon: Monitor, title: 'Windows software', desc: 'Publish installers with architecture and requirements.' },
    { tab: 'projects', icon: GitBranch, title: 'Edit & versions', desc: 'Edit existing projects and their releases.' },
  ];
  return (
    <div className="space-y-6">
      <div><h1 className="font-display text-2xl font-bold flex items-center gap-2"><Sparkles className="h-6 w-6 text-primary" />Editor Studio</h1><p className="text-sm text-muted-foreground">Choose what you want to create or edit.</p></div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {modes.map((m) => (
          <button key={m.title} onClick={() => onGo(m.tab)} className="rounded-2xl border border-border bg-card p-5 text-left hover:border-primary hover:-translate-y-0.5 transition-all">
            <m.icon className="h-7 w-7 text-primary" /><p className="font-display font-bold mt-3">{m.title}</p><p className="text-xs text-muted-foreground mt-1">{m.desc}</p>
          </button>
        ))}
      </div>
      <div className="grid lg:grid-cols-2 gap-4">
        <section className="rounded-2xl border border-border p-4"><h2 className="font-bold mb-2">Project releases</h2>
          {versions.map((v: any) => <button key={v.id} onClick={() => onEdit(v.project_id)} className="w-full flex justify-between text-sm py-2 border-b border-border/60 text-left"><span>{v.projects?.title || 'Project'} · <b>{v.version}</b>{v.is_latest && ' (latest)'}</span><span className="text-muted-foreground">{v.released_at}</span></button>)}
          {versions.length === 0 && <p className="text-sm text-muted-foreground">No releases yet.</p>}
        </section>
        <section className="rounded-2xl border border-border p-4"><h2 className="font-bold mb-2">App & Windows releases</h2>
          {apps.map((a: any) => <div key={a.id} className="flex justify-between text-sm py-2 border-b border-border/60"><span>{a.name} · <b>{a.version}</b>{a.is_latest && ' (latest)'}</span><span className="text-muted-foreground capitalize">{a.platform}{a.platform === 'windows' ? ` · ${a.architecture}` : ''}</span></div>)}
          {apps.length === 0 && <p className="text-sm text-muted-foreground">No apps yet.</p>}
        </section>
      </div>
    </div>
  );
}
