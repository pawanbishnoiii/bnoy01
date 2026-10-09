import { useMemo, useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Cloud, Folder, FolderPlus, Grid3x3, List, Star, Trash2, Link2, Upload, FileText, Film, Image as ImageIcon, Search, ChevronRight, Download } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';

type MediaFile = { id: string; name: string; path: string; folder: string; mime: string | null; size: number; starred: boolean; created_at: string };
const BUCKET = 'media-cloud';
const fmt = (b: number) => b > 1e9 ? `${(b / 1e9).toFixed(1)} GB` : b > 1e6 ? `${(b / 1e6).toFixed(1)} MB` : `${Math.max(1, Math.round(b / 1e3))} KB`;
const iconFor = (m: string | null) => m?.startsWith('image/') ? ImageIcon : m?.startsWith('video/') ? Film : FileText;

export default function AdminMediaCloud() {
  const qc = useQueryClient();
  const input = useRef<HTMLInputElement>(null);
  const [folder, setFolder] = useState('/');
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [q, setQ] = useState(''); const [filter, setFilter] = useState<'all' | 'image' | 'video' | 'doc' | 'starred'>('all');
  const [uploads, setUploads] = useState<{ name: string; done: boolean }[]>([]);
  const [drag, setDrag] = useState(false);

  const { data: files = [], isLoading } = useQuery({
    queryKey: ['media-files'],
    queryFn: async () => (await supabase.from('media_files').select('*').order('created_at', { ascending: false }).limit(2000)).data as MediaFile[] || [],
  });
  const { data: thumbs = {} } = useQuery({
    queryKey: ['media-thumbs', files.map((f) => f.id).join()],
    enabled: files.length > 0,
    queryFn: async () => {
      const imgs = files.filter((f) => f.mime?.startsWith('image/') || f.mime?.startsWith('video/'));
      if (!imgs.length) return {};
      const { data } = await supabase.storage.from(BUCKET).createSignedUrls(imgs.map((f) => f.path), 3600);
      return Object.fromEntries((data || []).map((d, i) => [imgs[i].path, d.signedUrl]));
    },
  });

  const folders = useMemo(() => Array.from(new Set(files.map((f) => f.folder))).filter((f) => f !== '/' && f.startsWith(folder) && f.slice(folder.length).split('/').filter(Boolean).length === 1), [files, folder]);
  const shown = files.filter((f) => (q ? f.name.toLowerCase().includes(q.toLowerCase()) : f.folder === folder))
    .filter((f) => filter === 'all' || (filter === 'starred' ? f.starred : filter === 'image' ? f.mime?.startsWith('image/') : filter === 'video' ? f.mime?.startsWith('video/') : !f.mime?.startsWith('image/') && !f.mime?.startsWith('video/')));
  const used = files.reduce((a, f) => a + Number(f.size), 0);

  const upload = async (list: FileList | File[]) => {
    const arr = Array.from(list);
    setUploads(arr.map((f) => ({ name: f.name, done: false })));
    const { data: { user } } = await supabase.auth.getUser();
    for (const [i, f] of arr.entries()) {
      const path = `${folder.replace(/^\//, '')}${crypto.randomUUID()}-${f.name.replace(/[^\w.-]+/g, '_')}`;
      const { error } = await supabase.storage.from(BUCKET).upload(path, f, { contentType: f.type });
      if (error) { toast.error(`${f.name}: ${error.message}`); continue; }
      await supabase.from('media_files').insert({ name: f.name, path, folder, mime: f.type || null, size: f.size, uploaded_by: user?.id });
      setUploads((u) => u.map((x, j) => j === i ? { ...x, done: true } : x));
    }
    toast.success('Upload finished'); setTimeout(() => setUploads([]), 1500);
    qc.invalidateQueries({ queryKey: ['media-files'] });
  };
  const newFolder = () => { const n = prompt('Folder name'); if (!n) return; const f = `${folder}${n.replace(/[^\w -]+/g, '').trim()}/`; setFolder(f); toast.message('Folder ready — upload files into it'); };
  const copyLink = async (f: MediaFile) => {
    const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(f.path, 60 * 60 * 24 * 7);
    if (error) return toast.error(error.message);
    await navigator.clipboard.writeText(data.signedUrl); toast.success('7-day link copied');
  };
  const star = async (f: MediaFile) => { await supabase.from('media_files').update({ starred: !f.starred }).eq('id', f.id); qc.invalidateQueries({ queryKey: ['media-files'] }); };
  const remove = async (f: MediaFile) => {
    if (!confirm(`Delete ${f.name}?`)) return;
    await supabase.storage.from(BUCKET).remove([f.path]); await supabase.from('media_files').delete().eq('id', f.id);
    qc.invalidateQueries({ queryKey: ['media-files'] });
  };
  const crumbs = folder.split('/').filter(Boolean);

  return (
    <div className="space-y-5" onDragOver={(e) => { e.preventDefault(); setDrag(true); }} onDragLeave={() => setDrag(false)} onDrop={(e) => { e.preventDefault(); setDrag(false); if (e.dataTransfer.files.length) upload(e.dataTransfer.files); }}>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div><h1 className="font-display text-2xl font-bold flex items-center gap-2"><Cloud className="h-6 w-6 text-primary" />Media Cloud</h1><p className="text-sm text-muted-foreground">{files.length} files · {fmt(used)} used · drag files anywhere to upload</p></div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={newFolder}><FolderPlus className="h-4 w-4 mr-1" />New folder</Button>
          <Button onClick={() => input.current?.click()}><Upload className="h-4 w-4 mr-1" />Upload</Button>
          <input ref={input} type="file" multiple hidden onChange={(e) => e.target.files && upload(e.target.files)} />
        </div>
      </div>
      <div className="h-2 rounded-full bg-muted overflow-hidden"><div className="h-full bg-primary" style={{ width: `${Math.min(100, (used / 1e9) * 100)}%` }} /></div>
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-48"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search all files" className="pl-9" /></div>
        {(['all', 'image', 'video', 'doc', 'starred'] as const).map((k) => <Button key={k} size="sm" variant={filter === k ? 'default' : 'outline'} onClick={() => setFilter(k)} className="capitalize">{k}</Button>)}
        <Button size="icon" variant="ghost" aria-label="Grid view" onClick={() => setView('grid')}><Grid3x3 className="h-4 w-4" /></Button>
        <Button size="icon" variant="ghost" aria-label="List view" onClick={() => setView('list')}><List className="h-4 w-4" /></Button>
      </div>
      {!q && <div className="flex items-center gap-1 text-sm"><button onClick={() => setFolder('/')} className="font-semibold hover:text-primary">My Drive</button>{crumbs.map((c, i) => <span key={i} className="flex items-center gap-1"><ChevronRight className="h-3 w-3" /><button className="hover:text-primary" onClick={() => setFolder('/' + crumbs.slice(0, i + 1).join('/') + '/')}>{c}</button></span>)}</div>}
      {uploads.length > 0 && <div className="rounded-xl border border-border p-3 space-y-1 text-sm">{uploads.map((u, i) => <div key={i} className="flex justify-between"><span className="truncate">{u.name}</span><span className={u.done ? 'text-primary' : 'text-muted-foreground'}>{u.done ? 'Done' : 'Uploading…'}</span></div>)}</div>}
      {drag && <div className="rounded-2xl border-2 border-dashed border-primary bg-primary/5 p-10 text-center font-semibold text-primary">Drop to upload into {folder}</div>}
      {!q && folders.length > 0 && <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">{folders.map((f) => <button key={f} onClick={() => setFolder(f)} className="flex items-center gap-2 rounded-xl border border-border p-3 text-sm font-medium hover:border-primary"><Folder className="h-5 w-5 text-primary" />{f.slice(folder.length).replace('/', '')}</button>)}</div>}
      {isLoading ? <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">{Array.from({ length: 12 }).map((_, i) => <Skeleton key={i} className="aspect-square rounded-xl" />)}</div>
        : shown.length === 0 ? <div className="rounded-2xl border border-dashed border-border p-12 text-center text-muted-foreground">No files here yet. Drag files in or press Upload.</div>
        : view === 'grid' ? <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">{shown.map((f) => { const I = iconFor(f.mime); const t = thumbs[f.path]; return (
          <div key={f.id} className="group relative rounded-xl border border-border overflow-hidden bg-card">
            <div className="aspect-square bg-muted grid place-items-center">{t && f.mime?.startsWith('image/') ? <img src={t} alt={f.name} loading="lazy" className="h-full w-full object-cover" /> : t && f.mime?.startsWith('video/') ? <video src={t} muted className="h-full w-full object-cover" /> : <I className="h-10 w-10 text-muted-foreground" />}</div>
            <div className="p-2"><p className="truncate text-xs font-medium">{f.name}</p><p className="text-[10px] text-muted-foreground">{fmt(Number(f.size))}</p></div>
            <div className="absolute top-1 right-1 flex gap-1 opacity-0 group-hover:opacity-100 transition">
              <Button size="icon" variant="secondary" className="h-7 w-7" aria-label="Star" onClick={() => star(f)}><Star className={`h-3.5 w-3.5 ${f.starred ? 'fill-current text-primary' : ''}`} /></Button>
              <Button size="icon" variant="secondary" className="h-7 w-7" aria-label="Copy link" onClick={() => copyLink(f)}><Link2 className="h-3.5 w-3.5" /></Button>
              <Button size="icon" variant="secondary" className="h-7 w-7 text-destructive" aria-label="Delete" onClick={() => remove(f)}><Trash2 className="h-3.5 w-3.5" /></Button>
            </div>
            {f.starred && <Star className="absolute top-2 left-2 h-4 w-4 fill-current text-primary" />}
          </div>); })}</div>
        : <div className="rounded-2xl border border-border divide-y divide-border">{shown.map((f) => { const I = iconFor(f.mime); return (
          <div key={f.id} className="flex items-center gap-3 p-3 text-sm"><I className="h-5 w-5 text-muted-foreground" /><span className="flex-1 truncate">{f.name}</span><span className="text-xs text-muted-foreground w-20">{fmt(Number(f.size))}</span><span className="text-xs text-muted-foreground w-28 hidden sm:block">{new Date(f.created_at).toLocaleDateString()}</span>
            <Button size="icon" variant="ghost" aria-label="Star" onClick={() => star(f)}><Star className={`h-4 w-4 ${f.starred ? 'fill-current text-primary' : ''}`} /></Button>
            <Button size="icon" variant="ghost" aria-label="Copy link" onClick={() => copyLink(f)}><Link2 className="h-4 w-4" /></Button>
            <Button size="icon" variant="ghost" aria-label="Download" onClick={async () => { const { data } = await supabase.storage.from(BUCKET).createSignedUrl(f.path, 300, { download: f.name }); if (data) window.open(data.signedUrl); }}><Download className="h-4 w-4" /></Button>
            <Button size="icon" variant="ghost" aria-label="Delete" className="text-destructive" onClick={() => remove(f)}><Trash2 className="h-4 w-4" /></Button></div>); })}</div>}
    </div>
  );
}
