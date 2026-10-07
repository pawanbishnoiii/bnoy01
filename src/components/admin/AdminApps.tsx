import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Pencil, Trash2, PlusCircle, Smartphone } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

const PLATFORMS = ['android', 'ios', 'windows', 'mac', 'linux'];

export default function AdminApps() {
  const [view, setView] = useState<'list' | 'form'>('list');
  const [editingId, setEditingId] = useState<string | null>(null);
  const qc = useQueryClient();
  const { toast } = useToast();

  const { data: apps = [] } = useQuery({
    queryKey: ['admin-apps'],
    queryFn: async () => (await supabase.from('apps').select('*').order('created_at', { ascending: false })).data || [],
  });

  const del = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from('apps').delete().eq('id', id); if (error) throw error; },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-apps'] }); toast({ title: 'App deleted' }); },
  });

  if (view === 'form') {
    return <AppForm editingId={editingId} onDone={() => { setView('list'); setEditingId(null); qc.invalidateQueries({ queryKey: ['admin-apps'] }); }} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold flex items-center gap-2"><Smartphone className="h-6 w-6 text-fire" />Apps</h1>
        <Button onClick={() => { setEditingId(null); setView('form'); }} className="gradient-fire-strong text-white">
          <PlusCircle className="h-4 w-4 mr-2" /> Add New App
        </Button>
      </div>
      <div className="bg-white rounded-xl border border-border shadow-card overflow-x-auto">
        <table className="w-full">
          <thead><tr className="border-b border-border">
            <th className="text-left p-4 text-sm">App Name</th>
            <th className="text-left p-4 text-sm">Platform</th>
            <th className="text-left p-4 text-sm">Version</th>
            <th className="text-left p-4 text-sm">Price</th>
            <th className="text-left p-4 text-sm">Downloads</th>
            <th className="text-left p-4 text-sm">Status</th>
            <th className="text-right p-4 text-sm">Actions</th>
          </tr></thead>
          <tbody>
            {apps.map((a: any) => (
              <tr key={a.id} className="border-b border-border/50">
                <td className="p-4 text-sm font-semibold">{a.name}</td>
                <td className="p-4 text-sm capitalize">{a.platform}</td>
                <td className="p-4 text-sm">v{a.version}</td>
                <td className="p-4 text-sm">{a.price === 0 ? 'Free' : `₹${a.price}`}</td>
                <td className="p-4 text-sm">{a.download_count || 0}</td>
                <td className="p-4"><Badge className={a.status === 'published' ? 'bg-green-500/20 text-green-700 border-0' : ''} variant={a.status === 'published' ? 'default' : 'outline'}>{a.status}</Badge></td>
                <td className="p-4 text-right space-x-2">
                  <Button variant="ghost" size="sm" onClick={() => { setEditingId(a.id); setView('form'); }}><Pencil className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="sm" className="text-destructive" onClick={() => del.mutate(a.id)}><Trash2 className="h-4 w-4" /></Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {apps.length === 0 && <p className="text-center text-muted-foreground py-12">No apps yet. Click "Add New App" to upload one.</p>}
      </div>
    </div>
  );
}

function AppForm({ editingId, onDone }: { editingId: string | null; onDone: () => void }) {
  const { toast } = useToast();
  const isEdit = !!editingId;
  const [appId] = useState(editingId || crypto.randomUUID());
  const [loading, setLoading] = useState(false);
  const [iconProgress, setIconProgress] = useState(0);
  const [apkProgress, setApkProgress] = useState(0);

  const [form, setForm] = useState<any>({
    name: '', description: '', version: '1.0.0', platform: 'android', price: 0,
    icon_url: '', screenshots_urls: [] as string[], apk_url: '', file_size: '',
    changelog: '', is_latest: true, status: 'draft',
  });

  const { data: existing } = useQuery({
    queryKey: ['app-edit', editingId],
    queryFn: async () => editingId ? (await supabase.from('apps').select('*').eq('id', editingId).maybeSingle()).data : null,
    enabled: !!editingId,
  });

  useEffect(() => {
    if (existing) setForm({
      name: existing.name || '', description: existing.description || '', version: existing.version || '1.0.0',
      platform: existing.platform || 'android', price: existing.price || 0,
      icon_url: existing.icon_url || '', screenshots_urls: existing.screenshots_urls || [],
      apk_url: existing.apk_url || '', file_size: existing.file_size || '',
      changelog: existing.changelog || '', is_latest: !!existing.is_latest, status: existing.status || 'draft',
    });
  }, [existing]);

  const uploadIcon = async (file: File) => {
    setIconProgress(20);
    const ext = file.name.split('.').pop();
    const path = `${appId}/icon.${ext}`;
    const { error } = await supabase.storage.from('app-assets').upload(path, file, { upsert: true });
    if (error) { toast({ title: 'Icon upload failed', description: error.message, variant: 'destructive' }); setIconProgress(0); return; }
    const { data } = supabase.storage.from('app-assets').getPublicUrl(path);
    setForm((f: any) => ({ ...f, icon_url: data.publicUrl }));
    setIconProgress(100); setTimeout(() => setIconProgress(0), 600);
  };

  const uploadShots = async (files: FileList) => {
    const urls: string[] = [];
    for (const [i, file] of Array.from(files).entries()) {
      const path = `${appId}/screenshots/${Date.now()}-${i}-${file.name}`;
      const { error } = await supabase.storage.from('app-assets').upload(path, file, { upsert: true });
      if (!error) {
        const { data } = supabase.storage.from('app-assets').getPublicUrl(path);
        urls.push(data.publicUrl);
      }
    }
    setForm((f: any) => ({ ...f, screenshots_urls: [...f.screenshots_urls, ...urls] }));
  };

  const uploadApk = async (file: File) => {
    if (file.size > 500 * 1024 * 1024) { toast({ title: 'File too large (max 500MB)', variant: 'destructive' }); return; }
    setApkProgress(5);
    // Simulate progress while supabase JS uploads (no native progress events)
    const sizeMb = file.size / (1024 * 1024);
    const step = Math.max(2, Math.min(8, Math.round(60 / Math.max(1, sizeMb / 5))));
    const interval = setInterval(() => setApkProgress(p => (p < 90 ? p + step : p)), 400);
    const ext = file.name.split('.').pop();
    const path = `${appId}/app.${ext}`;
    const { error } = await supabase.storage.from('app-files').upload(path, file, { upsert: true });
    clearInterval(interval);
    if (error) { toast({ title: 'Upload failed', description: error.message, variant: 'destructive' }); setApkProgress(0); return; }
    setForm((f: any) => ({ ...f, apk_url: path, file_size: `${sizeMb.toFixed(1)} MB` }));
    setApkProgress(100); setTimeout(() => setApkProgress(0), 1200);
    toast({ title: `✅ ${file.name} uploaded` });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = { ...form, price: Number(form.price) || 0 };
      const { error } = isEdit
        ? await supabase.from('apps').update(payload).eq('id', editingId!)
        : await supabase.from('apps').insert({ id: appId, ...payload });
      if (error) throw error;
      toast({ title: isEdit ? 'App updated!' : 'App uploaded!' });
      onDone();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally { setLoading(false); }
  };

  const descLen = form.description.length;

  return (
    <div className="space-y-6 max-w-3xl">
      <h1 className="font-display text-2xl font-bold">{isEdit ? 'Edit App' : 'Upload New App'}</h1>
      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-border shadow-card p-6 space-y-5">
        <div className="space-y-2"><Label>App Name *</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required className="bg-warm-bg border-border" /></div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div className="space-y-2"><Label>Version *</Label><Input value={form.version} onChange={(e) => setForm({ ...form, version: e.target.value })} placeholder="1.0.0" required className="bg-warm-bg border-border" /></div>
          <div className="space-y-2">
            <Label>Platform</Label>
            <Select value={form.platform} onValueChange={(v) => setForm({ ...form, platform: v })}>
              <SelectTrigger className="bg-warm-bg border-border"><SelectValue /></SelectTrigger>
              <SelectContent>{PLATFORMS.map((p) => <SelectItem key={p} value={p} className="capitalize">{p}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Price (₹, 0=free)</Label>
            <div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">₹</span>
              <Input type="number" min={0} value={form.price} onChange={(e) => setForm({ ...form, price: parseInt(e.target.value) || 0 })} className="bg-warm-bg border-border pl-7" />
            </div>
          </div>
        </div>

        <div className="space-y-2 relative">
          <Label>Short Description (max 200)</Label>
          <Textarea value={form.description} maxLength={200} onChange={(e) => setForm({ ...form, description: e.target.value })} className="bg-warm-bg border-border" rows={3} />
          <span className={`absolute right-2 bottom-2 text-xs ${descLen > 200 ? 'text-destructive' : 'text-muted-foreground'}`}>{descLen}/200</span>
        </div>

        <div className="space-y-2"><Label>Changelog / What's New</Label><Textarea value={form.changelog} onChange={(e) => setForm({ ...form, changelog: e.target.value })} className="bg-warm-bg border-border" rows={4} /></div>

        {/* Icon */}
        <div className="space-y-2">
          <Label>App Icon</Label>
          {form.icon_url ? (
            <div className="relative inline-block">
              <img src={form.icon_url} alt="icon" className="w-20 h-20 object-cover rounded-2xl border border-border" />
              <button type="button" onClick={() => setForm({ ...form, icon_url: '' })} className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-destructive text-white text-xs">×</button>
            </div>
          ) : (
            <label className="block border-2 border-dashed border-fire/30 rounded-xl p-6 text-center cursor-pointer hover:border-fire/60">
              <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && uploadIcon(e.target.files[0])} />
              <p className="text-sm text-muted-foreground">📱 Upload app icon</p>
              {iconProgress > 0 && <div className="mt-3 h-2 bg-border rounded-full overflow-hidden"><div className="h-full gradient-fire-strong" style={{ width: `${iconProgress}%` }} /></div>}
            </label>
          )}
        </div>

        {/* Screenshots */}
        <div className="space-y-2">
          <Label>Screenshots</Label>
          <label className="block border-2 border-dashed border-border rounded-xl p-4 text-center cursor-pointer hover:border-fire/40">
            <input type="file" multiple accept="image/*" className="hidden" onChange={(e) => e.target.files && uploadShots(e.target.files)} />
            <p className="text-sm text-muted-foreground">Upload one or more screenshots</p>
          </label>
          {form.screenshots_urls.length > 0 && (
            <div className="grid grid-cols-4 gap-2 mt-2">
              {form.screenshots_urls.map((s: string, i: number) => (
                <div key={i} className="relative">
                  <img src={s} alt="" className="w-full h-20 object-cover rounded border border-border" />
                  <button type="button" onClick={() => setForm({ ...form, screenshots_urls: form.screenshots_urls.filter((_: any, idx: number) => idx !== i) })} className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-destructive text-white text-xs">×</button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* APK */}
        <div className="space-y-2">
          <Label>App File (.apk / .exe / .dmg / .deb / .AppImage / .ipa) — max 500MB</Label>
          <label className="block border-2 border-dashed border-border rounded-xl p-4 text-center cursor-pointer hover:border-fire/40">
            <input type="file" accept=".apk,.exe,.dmg,.deb,.AppImage,.ipa" className="hidden" onChange={(e) => e.target.files?.[0] && uploadApk(e.target.files[0])} />
            <p className="text-sm text-muted-foreground">{form.apk_url ? `✅ Uploaded (${form.file_size})` : '📦 Click to upload app binary (.apk / .exe / .dmg…)'}</p>
            {apkProgress > 0 && (
              <div className="mt-3 space-y-1">
                <div className="h-2 bg-border rounded-full overflow-hidden">
                  <div className="h-full gradient-fire-strong transition-all" style={{ width: `${apkProgress}%` }} />
                </div>
                <p className="text-xs text-fire font-semibold">{apkProgress < 100 ? `Uploading… ${apkProgress}%` : '✅ Uploaded!'}</p>
              </div>
            )}
          </label>
          <Input value={form.apk_url} onChange={(e) => setForm({ ...form, apk_url: e.target.value })} placeholder="Or paste external URL" className="bg-warm-bg border-border" />
        </div>

        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            <Switch checked={form.is_latest} onCheckedChange={(v) => setForm({ ...form, is_latest: v })} className="data-[state=checked]:bg-fire" />
            <Label>Latest Version</Label>
          </div>
          <div className="space-y-1">
            <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
              <SelectTrigger className="bg-warm-bg border-border w-40"><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="draft">Draft</SelectItem><SelectItem value="published">Published</SelectItem></SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex gap-3">
          <Button type="submit" disabled={loading} className="gradient-fire-strong text-white">{loading ? 'Saving…' : isEdit ? 'Update App' : 'Upload App'}</Button>
          <Button type="button" variant="outline" onClick={onDone}>Cancel</Button>
        </div>
      </form>
    </div>
  );
}
