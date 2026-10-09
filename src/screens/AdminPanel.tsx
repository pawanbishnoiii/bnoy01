import { useState, useEffect, lazy, Suspense } from 'react';
import { Navigate, useNavigate } from '@/lib/router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  LayoutDashboard, Package, PlusCircle, ShoppingBag, Users2, BarChart3,
  Pencil, Trash2, IndianRupee, TrendingUp, Eye, Settings2, Smartphone, Tags, Search, Globe2, Bell, ArrowLeft, ArrowRight, X, Lock as LockIcon,
  Sparkles,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/store/authStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import WorkspaceShell from '@/components/admin/WorkspaceShell';
import AdminMediaCloud from '@/components/admin/AdminMediaCloud';
import AdminApps from '@/components/admin/AdminApps';
import AdminCategories from '@/components/admin/AdminCategories';
import AdminGoogle from '@/components/admin/AdminGoogle';
import AdminNotifications from '@/components/admin/AdminNotifications';
import AdminVisitors from '@/components/admin/AdminVisitors';
import AdminTeam from '@/components/admin/AdminTeam';
import AdminEmails from '@/components/admin/AdminEmails';
import AdminUsersPro from '@/components/admin/AdminUsersPro';
import EditorStudio from '@/components/admin/EditorStudio';
import AdminTruecaller from '@/components/admin/AdminTruecaller';
import AdminLoginSecurity from '@/components/admin/AdminLoginSecurity';
import AdminAiDeploy from '@/components/admin/AdminAiDeploy';
import AiListingGenerator from '@/components/admin/AiListingGenerator';
import { aiProjectAssist } from '@/lib/ai-project.functions';
import { useServerFn } from '@tanstack/react-start';
import SystemStatusBlock from '@/components/ui/system-status-block';
import { TECH_SUGGESTIONS, techIcon } from '@/lib/techIcons';

const DescriptionEditor = lazy(() => import('@/components/admin/DescriptionEditor'));

const sidebarItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'projects', label: 'Projects', icon: Package },
  { id: 'add', label: 'Add Project', icon: PlusCircle },
  { id: 'editor', label: 'Editor Studio', icon: Sparkles },
  { id: 'media-cloud', label: 'Media Cloud', icon: Package },
  { id: 'apps', label: 'Apps', icon: Smartphone },
  { id: 'categories', label: 'Categories', icon: Tags },
  { id: 'orders', label: 'Orders', icon: ShoppingBag },
  { id: 'users', label: 'Users', icon: Users2 },
  { id: 'emails', label: 'Emails & Bookings', icon: Bell },
  { id: 'team', label: 'Creative Team', icon: Users2 },
  { id: 'truecaller', label: 'Truecaller', icon: Smartphone },
  { id: 'login-security', label: 'Login Security', icon: LockIcon },
  { id: 'visitors', label: 'Visitors', icon: Globe2 },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'google', label: 'Google', icon: Search },
  { id: 'ai-deploy', label: 'AI & Deploy', icon: Sparkles },
  { id: 'settings', label: 'Site Settings', icon: Settings2 },
];

const COLORS = ['#FF5722', '#FFC107', '#E64A19', '#FFD54F', '#FF8A65'];

export default function AdminPanel() {
  const { user, isAdmin, authReady } = useAuthStore();
  const [activeTab, setActiveTab] = useState('dashboard');
  useEffect(() => { const t = new URLSearchParams(window.location.search).get('tab'); if (t && sidebarItems.some(i => i.id === t)) setActiveTab(t); }, []);
  const [editingId, setEditingId] = useState<string | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Wait for auth bootstrap before deciding — avoids the "auto-logout" flash where
  // the redirect fires before useAuthBootstrap has loaded the session + admin role.
  if (!authReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3 text-muted-foreground">
          <div className="h-8 w-8 rounded-full border-2 border-fire border-t-transparent animate-spin" />
          <p className="text-sm">Loading admin…</p>
        </div>
      </div>
    );
  }
  if (!user || !isAdmin) return <Navigate to="/" replace />;

  const goAdd = (id: string | null = null) => { setEditingId(id); setActiveTab('add'); };

  return (
    <WorkspaceShell items={sidebarItems} active={activeTab} onSelect={(id) => { setActiveTab(id); setEditingId(null); const url = new URL(window.location.href); url.searchParams.set('tab', id); window.history.replaceState(null, '', url); }}>
          <motion.div key={activeTab + (editingId || '')} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            {activeTab === 'dashboard' && <AdminDashboard />}
            {activeTab === 'projects' && <AdminProjects onEdit={goAdd} onAdd={() => goAdd(null)} />}
            {activeTab === 'add' && <AdminAddProject editingId={editingId} onDone={() => { setEditingId(null); setActiveTab('projects'); }} />}
            {activeTab === 'apps' && <AdminApps />}
            {activeTab === 'media-cloud' && <AdminMediaCloud />}
            {activeTab === 'editor' && <EditorStudio onGo={(t) => { setEditingId(null); setActiveTab(t); }} onEdit={goAdd} />}
            {activeTab === 'categories' && <AdminCategories />}
            {activeTab === 'orders' && <AdminOrders />}
            {activeTab === 'users' && <AdminUsersPro />}
            {activeTab === 'emails' && <AdminEmails />}
            {activeTab === 'team' && <AdminTeam />}
            {activeTab === 'truecaller' && <AdminTruecaller />}
            {activeTab === 'login-security' && <AdminLoginSecurity />}
            {activeTab === 'visitors' && <AdminVisitors />}
            {activeTab === 'analytics' && <AdminAnalytics />}
            {activeTab === 'notifications' && <AdminNotifications />}
            {activeTab === 'google' && <AdminGoogle />}
            {activeTab === 'ai-deploy' && <AdminAiDeploy />}
            {activeTab === 'settings' && <AdminSettings />}
          </motion.div>
    </WorkspaceShell>
  );
}

function AdminDashboard() {
  const { data: projects } = useQuery({ queryKey: ['admin-projects'], queryFn: async () => { const { data } = await supabase.from('projects').select('*'); return data || []; } });
  const { data: purchases } = useQuery({ queryKey: ['admin-purchases'], queryFn: async () => { const { data } = await supabase.from('purchases').select('*, projects(title)'); return data || []; } });

  const totalRevenue = purchases?.reduce((sum: number, p: any) => sum + (p.amount || 0), 0) || 0;
  const revenueData = purchases?.reduce((acc: any[], p: any) => {
    const date = new Date(p.created_at).toLocaleDateString();
    const existing = acc.find((x) => x.date === date);
    if (existing) existing.revenue += p.amount || 0;
    else acc.push({ date, revenue: p.amount || 0 });
    return acc;
  }, []) || [];

  const cards = [
    { label: 'Total Revenue', value: `₹${totalRevenue.toLocaleString('en-IN')}`, icon: IndianRupee, color: 'from-primary to-accent' },
    { label: 'Total Sales', value: purchases?.length || 0, icon: TrendingUp, color: 'from-green-500 to-emerald-500' },
    { label: 'Total Projects', value: projects?.length || 0, icon: Package, color: 'from-purple-500 to-pink-500' },
    { label: 'Published', value: projects?.filter((p: any) => p.status === 'published').length || 0, icon: Eye, color: 'from-cyan to-blue-500' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3 border-b border-border pb-5"><div><p className="text-xs text-muted-foreground mb-2">STUDIO / OVERVIEW</p><h1 className="font-display text-3xl font-bold">Dashboard Overview</h1></div><Badge variant="outline">{projects?.filter((p: any) => p.status === 'draft').length || 0} drafts</Badge></div>
      <SystemStatusBlock />
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((c) => (
          <div key={c.label} className="bg-card rounded-lg border border-border p-5">
            <div className="inline-flex w-10 h-10 rounded-lg bg-primary/10 text-primary items-center justify-center mb-3">
              <c.icon className="h-5 w-5" />
            </div>
            <p className="text-sm text-muted-foreground">{c.label}</p>
            <p className="text-2xl font-display font-bold">{c.value}</p>
          </div>
        ))}
      </div>
      {revenueData.length > 0 && (
        <div className="bg-white rounded-xl border border-border shadow-card p-6">
          <h3 className="font-display font-semibold mb-4">Revenue Over Time</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={revenueData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(24, 60%, 90%)" />
              <XAxis dataKey="date" stroke="hsl(240, 8%, 40%)" fontSize={12} />
              <YAxis stroke="hsl(240, 8%, 40%)" fontSize={12} />
              <Tooltip contentStyle={{ background: 'white', border: '1px solid hsl(24, 60%, 90%)', borderRadius: '8px' }} />
              <Line type="monotone" dataKey="revenue" stroke="#FF5722" strokeWidth={2} dot={{ fill: '#FFC107' }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
      <div className="bg-white rounded-xl border border-border shadow-card p-6">
        <h3 className="font-display font-semibold mb-4">Recent Purchases</h3>
        <table className="w-full">
          <thead><tr className="border-b border-border">
            <th className="text-left p-3 text-sm">Project</th>
            <th className="text-left p-3 text-sm">Amount</th>
            <th className="text-left p-3 text-sm">Date</th>
          </tr></thead>
          <tbody>
            {purchases?.slice(0, 5).map((p: any) => (
              <tr key={p.id} className="border-b border-border/50">
                <td className="p-3 text-sm">{p.projects?.title || 'Unknown'}</td>
                <td className="p-3 text-sm">{p.amount === 0 ? 'Free' : `₹${p.amount}`}</td>
                <td className="p-3 text-sm text-muted-foreground">{new Date(p.created_at).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {(!purchases || purchases.length === 0) && <p className="text-center text-muted-foreground py-4">No purchases yet</p>}
      </div>
    </div>
  );
}

function AdminProjects({ onEdit, onAdd }: { onEdit: (id: string) => void; onAdd: () => void }) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [search, setSearch] = useState('');

  const { data: projects } = useQuery({ queryKey: ['admin-projects'], queryFn: async () => { const { data } = await supabase.from('projects').select('*').order('created_at', { ascending: false }); return data || []; } });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from('projects').delete().eq('id', id); if (error) throw error; },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin-projects'] }); toast({ title: 'Project deleted' }); },
  });

  const filtered = projects?.filter((p: any) => p.title.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold">Manage Projects</h1>
        <Button onClick={onAdd} className="gradient-fire-strong text-white"><PlusCircle className="h-4 w-4 mr-2" />Add New</Button>
      </div>
      <Input placeholder="Search projects..." value={search} onChange={(e) => setSearch(e.target.value)} className="bg-warm-bg border-border max-w-sm" />
      <div className="bg-white rounded-xl border border-border shadow-card overflow-x-auto">
        <table className="w-full">
          <thead><tr className="border-b border-border">
            <th className="text-left p-4 text-sm">Title</th>
            <th className="text-left p-4 text-sm">Price</th>
            <th className="text-left p-4 text-sm">Status</th>
            <th className="text-left p-4 text-sm">Featured</th>
            <th className="text-right p-4 text-sm">Actions</th>
          </tr></thead>
          <tbody>
            {filtered?.map((p: any) => (
              <tr key={p.id} className="border-b border-border/50">
                <td className="p-4 text-sm font-semibold">{p.title}</td>
                <td className="p-4 text-sm">{p.price === 0 ? 'Free' : `₹${p.price}`}{p.discount_price ? <span className="text-xs text-fire ml-1">(-₹{p.price - p.discount_price})</span> : null}</td>
                <td className="p-4"><Badge variant={p.status === 'published' ? 'default' : 'outline'} className={p.status === 'published' ? 'bg-green-500/20 text-green-700 border-0' : ''}>{p.status}</Badge></td>
                <td className="p-4 text-sm">{p.featured ? '⭐' : '—'}</td>
                <td className="p-4 text-right space-x-2">
                  <Button variant="ghost" size="sm" onClick={() => onEdit(p.id)}><Pencil className="h-4 w-4" /></Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild><Button variant="ghost" size="sm" className="text-destructive"><Trash2 className="h-4 w-4" /></Button></AlertDialogTrigger>
                    <AlertDialogContent className="bg-white border-border">
                      <AlertDialogHeader><AlertDialogTitle>Delete Project?</AlertDialogTitle><AlertDialogDescription>This action cannot be undone.</AlertDialogDescription></AlertDialogHeader>
                      <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => deleteMutation.mutate(p.id)} className="bg-destructive">Delete</AlertDialogAction></AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {(!filtered || filtered.length === 0) && <p className="text-center text-muted-foreground py-8">No projects found</p>}
      </div>
    </div>
  );
}

function TagInput({ label, value, onChange, placeholder, suggestions, withIcons }: { label: string; value: string[]; onChange: (v: string[]) => void; placeholder?: string; suggestions?: string[]; withIcons?: boolean }) {
  const [input, setInput] = useState('');
  const add = (raw?: string) => { const v = (raw ?? input).trim(); if (!v || value.includes(v)) return; onChange([...value, v]); setInput(''); };
  const filteredSug = (suggestions || []).filter(s => !value.includes(s) && (!input || s.toLowerCase().includes(input.toLowerCase()))).slice(0, 8);
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="flex flex-wrap gap-2 p-2 rounded-md bg-warm-bg border border-border min-h-[44px]">
        {value.map((t) => {
          const ic = withIcons ? techIcon(t) : undefined;
          return (
            <span key={t} className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-fire/10 text-fire text-xs font-semibold">
              {ic && <img src={ic} alt="" className="w-3.5 h-3.5" />}
              {t}<button type="button" onClick={() => onChange(value.filter((x) => x !== t))} className="hover:text-destructive">×</button>
            </span>
          );
        })}
        <input value={input} onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); add(); } }}
          onBlur={() => add()} placeholder={placeholder}
          className="flex-1 min-w-[140px] bg-transparent outline-none text-sm" />
      </div>
      {filteredSug.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {filteredSug.map(s => {
            const ic = withIcons ? techIcon(s) : undefined;
            return (
              <button key={s} type="button" onClick={() => add(s)} className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full border border-border bg-white text-xs text-ink/70 hover:text-fire hover:border-fire/30 transition">
                {ic && <img src={ic} alt="" className="w-3.5 h-3.5" />}+ {s}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function slugify(input: string) {
  return (input || '')
    .toLowerCase().trim()
    .replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
}

type ShotItem = {
  id: string;
  name: string;
  pct: number;
  status: 'queued' | 'uploading' | 'done' | 'error' | 'cancelled';
  error?: string;
  file?: File;
  url?: string;
  xhr?: XMLHttpRequest;
};

function AdminAddProject({ editingId, onDone }: { editingId: string | null; onDone: () => void }) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const isEdit = !!editingId;

  const { data: existing } = useQuery({
    queryKey: ['project-edit', editingId],
    queryFn: async () => editingId ? (await supabase.from('projects').select('*').eq('id', editingId).maybeSingle()).data : null,
    enabled: !!editingId,
  });

  const [form, setForm] = useState<any>({
    title: '', slug: '', short_desc: '', full_desc: '', price: 0, discount_price: 0, version: 'v1.0',
    category: [] as string[], tech_stack: [] as string[],
    thumbnail_url: '', screenshots: [] as string[], video_url: '', preview_url: '', preview_enabled: true,
    source_code_url: '', featured: false, status: 'draft',
    changelog: '[]', views_count: 0,
    lov_email: '', project_url: '', external_url_enabled: false,
    demo_admin_email: '', demo_admin_password: '', preview_watermark: '',
    project_type: 'website', seo_title: '', seo_description: '', seo_keywords: [] as string[], og_image_url: '', noindex: false,
  });
  const [sec, setSec] = useState<'versions' | 'info' | 'media' | 'publish'>('info');
  const [aiBusy, setAiBusy] = useState('');
  const aiAssist = useServerFn(aiProjectAssist);
  const runAi = async (kind: 'short' | 'full' | 'tech' | 'seo') => {
    setAiBusy(kind);
    try {
      const r = await aiAssist({ data: { kind, title: form.title, short_desc: form.short_desc, full_desc: form.full_desc, project_type: form.project_type } });
      setForm((f: any) => kind === 'short' ? { ...f, short_desc: (r.text || '').slice(0, 160) } : kind === 'full' ? { ...f, full_desc: r.text || f.full_desc } : kind === 'tech' ? { ...f, tech_stack: Array.from(new Set([...(f.tech_stack || []), ...(r.tech || [])])) } : { ...f, seo_title: r.seo_title || f.seo_title, seo_description: r.seo_description || f.seo_description, seo_keywords: r.keywords || f.seo_keywords });
      toast({ title: 'AI filled it in ✨' });
    } catch (e: any) { toast({ title: 'AI failed', description: e.message, variant: 'destructive' }); } finally { setAiBusy(''); }
  };
  const [bumpOpen, setBumpOpen] = useState(false);
  const [bumpForm, setBumpForm] = useState({ version: '', notes: '', date: new Date().toISOString().slice(0,10) });
  const [loading, setLoading] = useState(false);
  const [thumbProgress, setThumbProgress] = useState(0);
  const [shots, setShots] = useState<ShotItem[]>([]);
  const [zipName, setZipName] = useState<string | null>(null);
  const [slugStatus, setSlugStatus] = useState<'idle' | 'checking' | 'ok' | 'taken' | 'invalid'>('idle');

  const { data: catSuggestions } = useQuery({
    queryKey: ['cat-suggestions'],
    queryFn: async () => (await supabase.from('categories').select('name')).data?.map((c: any) => c.name) || [],
  });

  // Hydrate when editing
  useEffect(() => {
    if (existing) setForm({
      title: existing.title || '', slug: (existing as any).slug || '',
      short_desc: existing.short_desc || '', full_desc: existing.full_desc || '',
      price: existing.price || 0, discount_price: existing.discount_price || 0, version: existing.version || 'v1.0',
      category: existing.category || [], tech_stack: existing.tech_stack || [],
      thumbnail_url: existing.thumbnail_url || '', screenshots: existing.screenshots || [],
      video_url: existing.video_url || '', preview_url: existing.preview_url || '',
      preview_enabled: (existing as any).preview_enabled !== false,
      source_code_url: existing.source_code_url || '', featured: !!existing.featured, status: existing.status || 'draft',
      changelog: typeof (existing as any).changelog === 'string' ? (existing as any).changelog : JSON.stringify((existing as any).changelog || [], null, 2),
      views_count: (existing as any).views_count || 0,
      lov_email: (existing as any).lov_email || '', project_url: (existing as any).project_url || '',
      external_url_enabled: !!(existing as any).external_url_enabled,
      demo_admin_email: (existing as any).demo_admin_email || '', demo_admin_password: (existing as any).demo_admin_password || '',
      preview_watermark: (existing as any).preview_watermark || '',
      project_type: (existing as any).project_type || 'website', seo_title: (existing as any).seo_title || '', seo_description: (existing as any).seo_description || '', seo_keywords: (existing as any).seo_keywords || [], og_image_url: (existing as any).og_image_url || '', noindex: !!(existing as any).noindex,
    });
  }, [existing]);

  const projectId = editingId || 'new';

  // Live slug uniqueness + format validation (debounced)
  const previewSlug = slugify(form.slug || form.title);
  useEffect(() => {
    if (!previewSlug) { setSlugStatus('idle'); return; }
    if (!/^[a-z0-9-]+$/.test(previewSlug) || previewSlug.length < 3) { setSlugStatus('invalid'); return; }
    setSlugStatus('checking');
    const handle = setTimeout(async () => {
      const q = supabase.from('projects').select('id').eq('slug', previewSlug);
      const { data } = isEdit && editingId ? await q.neq('id', editingId).maybeSingle() : await q.maybeSingle();
      setSlugStatus(data ? 'taken' : 'ok');
    }, 350);
    return () => clearTimeout(handle);
  }, [previewSlug, isEdit, editingId]);

  // Upload using signed URL + XHR for true progress reporting.
  // Returns the xhr so callers can cancel the in-flight request.
  const uploadWithProgress = (
    bucket: string,
    path: string,
    file: File,
    onPct: (pct: number) => void,
    onXhr?: (xhr: XMLHttpRequest) => void,
  ) =>
    new Promise<string>(async (resolve, reject) => {
      const { data: signed, error: signErr } = await supabase.storage.from(bucket).createSignedUploadUrl(path);
      if (signErr || !signed) return reject(signErr || new Error('Could not get signed URL'));
      const xhr = new XMLHttpRequest();
      onXhr?.(xhr);
      xhr.open('PUT', signed.signedUrl);
      xhr.setRequestHeader('Content-Type', file.type || 'application/octet-stream');
      xhr.setRequestHeader('x-upsert', 'true');
      xhr.upload.onprogress = (e) => { if (e.lengthComputable) onPct(Math.round((e.loaded / e.total) * 100)); };
      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          const { data: pub } = supabase.storage.from(bucket).getPublicUrl(path);
          resolve(pub.publicUrl);
        } else reject(new Error(`Upload failed (${xhr.status})`));
      };
      xhr.onerror = () => reject(new Error('Network error'));
      xhr.onabort = () => reject(Object.assign(new Error('Cancelled'), { aborted: true }));
      xhr.send(file);
    });

  const uploadThumb = async (file: File) => {
    setThumbProgress(1);
    const ext = file.name.split('.').pop();
    const path = `${projectId}/thumb-${Date.now()}.${ext}`;
    try {
      // Public bucket so the image is directly accessible everywhere on the site.
      const url = await uploadWithProgress('project-images', path, file, setThumbProgress);
      setForm((f: any) => ({ ...f, thumbnail_url: url }));
      setThumbProgress(100);
      setTimeout(() => setThumbProgress(0), 1200);
    } catch (e: any) {
      toast({ title: 'Upload failed', description: e.message, variant: 'destructive' });
      setThumbProgress(0);
    }
  };

  const runShotUpload = async (item: ShotItem) => {
    if (!item.file) return;
    setShots((s) => s.map((x) => (x.id === item.id ? { ...x, status: 'uploading', pct: 1, error: undefined } : x)));
    const path = `${projectId}/screenshots/${Date.now()}-${item.file.name}`;
    try {
      const url = await uploadWithProgress(
        'project-images', path, item.file,
        (pct) => setShots((s) => s.map((x) => (x.id === item.id ? { ...x, pct } : x))),
        (xhr) => setShots((s) => s.map((x) => (x.id === item.id ? { ...x, xhr } : x))),
      );
      setShots((s) => s.map((x) => (x.id === item.id ? { ...x, status: 'done', pct: 100, url, xhr: undefined } : x)));
      setForm((f: any) => ({ ...f, screenshots: [...f.screenshots, url] }));
    } catch (e: any) {
      if (e?.aborted) {
        setShots((s) => s.map((x) => (x.id === item.id ? { ...x, status: 'cancelled', xhr: undefined } : x)));
      } else {
        setShots((s) => s.map((x) => (x.id === item.id ? { ...x, status: 'error', error: e.message || 'Upload failed', xhr: undefined } : x)));
      }
    }
  };

  const uploadScreenshots = async (files: FileList) => {
    const items: ShotItem[] = Array.from(files).map((file) => ({
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      name: file.name, pct: 0, status: 'queued', file,
    }));
    setShots((prev) => [...prev, ...items]);
    for (const it of items) await runShotUpload(it);
  };

  const cancelShot = (id: string) => {
    setShots((s) => {
      const item = s.find((x) => x.id === id);
      item?.xhr?.abort();
      return s.map((x) => (x.id === id ? { ...x, status: 'cancelled' } : x));
    });
  };
  const retryShot = (id: string) => {
    const item = shots.find((x) => x.id === id);
    if (item) runShotUpload(item);
  };
  const removeShot = (id: string) => setShots((s) => s.filter((x) => x.id !== id));



  const uploadZip = async (file: File) => {
    if (!file.name.endsWith('.zip')) { toast({ title: 'Only .zip files allowed', variant: 'destructive' }); return; }
    const path = `${projectId}/source.zip`;
    const { error } = await supabase.storage.from('source-code').upload(path, file, { upsert: true });
    if (error) { toast({ title: 'Upload failed', description: error.message, variant: 'destructive' }); return; }
    setZipName(`${file.name} (${Math.round(file.size / 1024)} KB)`);
    toast({ title: '✅ Source ZIP uploaded' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      let parsedChangelog: any = [];
      try { parsedChangelog = form.changelog ? JSON.parse(form.changelog) : []; } catch { throw new Error('Changelog must be valid JSON. Fix it before saving.'); }
      if (!Array.isArray(parsedChangelog)) throw new Error('Changelog must be an array of releases.');
      if (form.short_desc.length > 160) throw new Error('Short description must be 160 characters or fewer.');
      if (form.price < 0 || form.discount_price < 0) throw new Error('Prices cannot be negative.');
      const slugAuto = slugify(form.slug || form.title);
      if (slugAuto && (slugStatus === 'taken' || slugStatus === 'invalid')) {
        throw new Error(slugStatus === 'taken' ? 'That slug is already in use — pick a different one.' : 'Slug must be at least 3 characters and only contain lowercase letters, numbers, hyphens.');
      }
      const payload = {
        title: form.title, slug: slugAuto || null,
        short_desc: form.short_desc, full_desc: form.full_desc,
        price: form.price, discount_price: form.discount_price || null, version: form.version,
        category: form.category, tech_stack: form.tech_stack,
        thumbnail_url: form.thumbnail_url || null, screenshots: form.screenshots,
        video_url: form.video_url || null, preview_url: form.preview_url || null, preview_enabled: !!form.preview_enabled,
        source_code_url: form.source_code_url || null,
        featured: form.featured, status: form.status,
        changelog: parsedChangelog, views_count: parseInt(form.views_count) || 0,
        lov_email: form.lov_email || null, project_url: form.project_url || null,
        external_url_enabled: !!form.external_url_enabled,
        demo_admin_email: form.demo_admin_email || null, demo_admin_password: form.demo_admin_password || null,
        preview_watermark: form.preview_watermark || null,
        project_type: form.project_type, seo_title: form.seo_title || null, seo_description: form.seo_description || null, seo_keywords: form.seo_keywords || [], og_image_url: form.og_image_url || null, noindex: !!form.noindex,
      };
      const { error } = isEdit
        ? await supabase.from('projects').update(payload).eq('id', editingId || '')
        : await supabase.from('projects').insert(payload);
      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ['admin-projects'] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      toast({ title: isEdit ? 'Project updated!' : 'Project created!' });
      onDone();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally { setLoading(false); }
  };

  const shortLen = form.short_desc.length;

  return (
    <div className="space-y-6 max-w-3xl">
      <h1 className="font-display text-2xl font-bold">{isEdit ? 'Edit Project' : 'Add New Project'}</h1>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="sticky top-20 z-10 -mx-1 flex gap-1 overflow-x-auto rounded-2xl border border-border bg-background/90 p-1 backdrop-blur">
          {([['versions','1 · Versions'],['info','2 · Info'],['media','3 · Media'],['publish','4 · Publish & SEO']] as const).map(([k,l]) => <button type="button" key={k} onClick={() => setSec(k)} className={`flex-1 whitespace-nowrap rounded-xl px-3 py-2 text-sm font-semibold transition ${sec === k ? 'bg-primary text-primary-foreground shadow' : 'text-muted-foreground hover:text-foreground'}`}>{l}</button>)}
        </div>
        <div hidden={sec !== 'versions'} className="space-y-6">
        <div className="space-y-2"><Label>Project type</Label><div className="grid grid-cols-2 md:grid-cols-4 gap-2">{[['website','🌐 Website'],['app','📱 App'],['windows','🪟 Windows'],['automation','⚙️ Automation']].map(([v,l]) => <button type="button" key={v} onClick={() => setForm({ ...form, project_type: v })} className={`rounded-xl border p-3 text-sm font-semibold transition ${form.project_type === v ? 'border-primary bg-primary/10 text-primary' : 'border-border hover:border-primary/40'}`}>{l}</button>)}</div></div>
        {/* Changelog + version-bump shortcut */}
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <Label>Changelog (JSON array)</Label>
            <Button type="button" variant="outline" size="sm" onClick={() => setBumpOpen(o => !o)}>
              {bumpOpen ? 'Close' : '＋ Add new version'}
            </Button>
          </div>
          {bumpOpen && (
            <div className="rounded-xl border border-fire/20 bg-fire/5 p-4 grid md:grid-cols-3 gap-3">
              <Input placeholder="v1.2" value={bumpForm.version} onChange={e => setBumpForm({ ...bumpForm, version: e.target.value })} className="bg-white border-border" />
              <Input type="date" value={bumpForm.date} onChange={e => setBumpForm({ ...bumpForm, date: e.target.value })} className="bg-white border-border" />
              <div />
              <Textarea placeholder="What's new in this version…" value={bumpForm.notes} onChange={e => setBumpForm({ ...bumpForm, notes: e.target.value })} rows={3} className="md:col-span-3 bg-white border-border" />
              <Button type="button" className="gradient-fire-strong text-white md:col-span-3" onClick={() => {
                if (!bumpForm.version || !bumpForm.notes) { toast({ title: 'Version and notes required', variant: 'destructive' }); return; }
                let arr: any[] = [];
                try { arr = form.changelog ? JSON.parse(form.changelog) : []; } catch { arr = []; }
                arr = [{ version: bumpForm.version, date: bumpForm.date, notes: bumpForm.notes }, ...arr.filter((x: any) => x.version !== bumpForm.version)];
                setForm({ ...form, changelog: JSON.stringify(arr, null, 2), version: bumpForm.version });
                setBumpForm({ version: '', notes: '', date: new Date().toISOString().slice(0,10) });
                setBumpOpen(false);
                toast({ title: `Version ${bumpForm.version} added — also tip: upload fresh screenshots below.` });
              }}>Save version & sync</Button>
            </div>
          )}
          <Textarea value={form.changelog} onChange={(e) => setForm({ ...form, changelog: e.target.value })} rows={6} className="bg-warm-bg border-border font-mono text-xs"
            placeholder={`[\n  { "version": "v1.1", "date": "2026-05-01", "notes": "Added X..." }\n]`} />
        </div>

        </div>
        <div hidden={sec !== 'info'} className="space-y-6">
        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2"><Label>Title *</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required className="bg-warm-bg border-border" /></div>
          <div className="space-y-2">
            <Label>URL slug <span className="text-muted-foreground font-normal">(used as /p/your-slug)</span></Label>
            <Input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} placeholder="auto from title" className={`bg-warm-bg font-mono text-sm ${slugStatus === 'taken' || slugStatus === 'invalid' ? 'border-destructive' : slugStatus === 'ok' ? 'border-green-500' : 'border-border'}`} />
            {previewSlug && (
              <div className="text-[11px] flex items-center gap-2 flex-wrap">
                <span className="text-muted-foreground">Preview:</span>
                <code className="px-1.5 py-0.5 rounded bg-muted text-ink/80">/p/{previewSlug}</code>
                {slugStatus === 'checking' && <span className="text-muted-foreground">Checking…</span>}
                {slugStatus === 'ok' && <span className="text-green-600 font-semibold">✓ Available</span>}
                {slugStatus === 'taken' && <span className="text-destructive font-semibold">⚠ Already in use</span>}
                {slugStatus === 'invalid' && <span className="text-destructive font-semibold">⚠ Must be ≥3 chars · lowercase letters, numbers, hyphens</span>}
              </div>
            )}
          </div>
        </div>

        <AiListingGenerator defaultName={form.title} onApply={(r) => setForm((f: any) => ({ ...f, short_desc: r.short_desc, full_desc: r.full_desc, tech_stack: Array.from(new Set([...(f.tech_stack || []), ...r.tags])) }))} />

        <div className="space-y-2 relative">
          <div className="flex items-center justify-between"><Label>Short Description *</Label><Button type="button" size="sm" variant="outline" disabled={!!aiBusy} onClick={() => runAi('short')}><Sparkles className="h-3.5 w-3.5 mr-1" />{aiBusy === 'short' ? 'Writing…' : 'Write with AI'}</Button></div>
          <Textarea value={form.short_desc} onChange={(e) => setForm({ ...form, short_desc: e.target.value })} required className="bg-warm-bg border-border" rows={2} />
          <span className={`absolute right-2 bottom-2 text-xs ${shortLen > 160 ? 'text-destructive' : 'text-muted-foreground'}`}>{shortLen}/160</span>
        </div>

        <div className="space-y-2"><div className="flex items-center justify-between"><Label>Full Description</Label><Button type="button" size="sm" variant="outline" disabled={!!aiBusy} onClick={() => runAi('full')}><Sparkles className="h-3.5 w-3.5 mr-1" />{aiBusy === 'full' ? 'Writing…' : 'Write with AI'}</Button></div><Suspense fallback={<p className="text-muted-foreground">Loading editor…</p>}><DescriptionEditor value={form.full_desc} onChange={(value) => setForm((f: any) => ({ ...f, full_desc: value }))} /></Suspense></div>

        <TagInput label="Categories" value={form.category} onChange={(v) => setForm({ ...form, category: v })} placeholder="Type and press Enter" suggestions={catSuggestions || []} />
        {/* Admin-only links shown on the Project page */}
        <div className="grid md:grid-cols-2 gap-4 rounded-xl border border-amber-200 bg-amber-50/40 p-4">
          <div className="md:col-span-2">
            <p className="text-[10px] font-bold uppercase tracking-widest text-amber-700">Admin-only links · visible only to admins on the Project page</p>
          </div>
          <div className="space-y-2">
            <Label>Lovable Email</Label>
            <Input value={form.lov_email} onChange={(e) => setForm({ ...form, lov_email: e.target.value })} placeholder="lov-account@example.com" className="bg-white border-border" />
          </div>
          <div className="space-y-2">
            <Label>Project URL</Label>
            <Input value={form.project_url} onChange={(e) => setForm({ ...form, project_url: e.target.value })} placeholder="https://lovable.dev/projects/…" className="bg-white border-border" />
          </div>
          <div className="md:col-span-2 flex items-center gap-3 pt-1">
            <Switch checked={!!form.external_url_enabled} onCheckedChange={(v) => setForm({ ...form, external_url_enabled: v })} className="data-[state=checked]:bg-fire" />
            <Label className="text-xs text-muted-foreground font-normal">
              Show <b>"Go to project link"</b> button to buyers (only if they've purchased) {form.external_url_enabled ? <span className="text-green-700 font-semibold">· visible</span> : <span className="text-amber-700 font-semibold">· hidden (admin-only)</span>}
            </Label>
          </div>
        </div>

        {/* Demo admin login (shown to purchasers + admins) */}
        <div className="grid md:grid-cols-2 gap-4 rounded-xl border border-fire/20 bg-fire/5 p-4">
          <div className="md:col-span-2">
            <p className="text-[10px] font-bold uppercase tracking-widest text-fire">Demo admin login · shown to buyers on the Project page</p>
            <p className="text-xs text-muted-foreground mt-1">Optional credentials buyers can use to sign into the demo's admin panel.</p>
          </div>
          <div className="space-y-2">
            <Label>Demo admin email</Label>
            <Input value={form.demo_admin_email} onChange={(e) => setForm({ ...form, demo_admin_email: e.target.value })} placeholder="admin@demo.com" className="bg-white border-border" />
          </div>
          <div className="space-y-2">
            <Label>Demo admin password</Label>
            <Input value={form.demo_admin_password} onChange={(e) => setForm({ ...form, demo_admin_password: e.target.value })} placeholder="demo1234" className="bg-white border-border font-mono" />
          </div>
        </div>

        </div>
        <div hidden={sec !== 'media'} className="space-y-6">
        {/* Thumbnail upload */}
        <div className="space-y-2">
          <Label>Thumbnail Image</Label>
          {form.thumbnail_url ? (
            <div className="relative inline-block">
              <img src={form.thumbnail_url} alt="thumb" className="w-48 h-32 object-cover rounded-lg border border-border" />
              <button type="button" onClick={() => setForm({ ...form, thumbnail_url: '' })} className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-destructive text-white text-xs">×</button>
            </div>
          ) : (
            <label className="block border-2 border-dashed border-fire/30 rounded-xl p-8 text-center cursor-pointer hover:border-fire/60 transition-colors">
              <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && uploadThumb(e.target.files[0])} />
              <p className="text-sm text-muted-foreground">📷 Click to upload thumbnail</p>
              {thumbProgress > 0 && <div className="mt-3 h-2 bg-border rounded-full overflow-hidden"><div className="h-full gradient-fire-strong transition-all" style={{ width: `${thumbProgress}%` }} /></div>}
            </label>
          )}
          <Input value={form.thumbnail_url} onChange={(e) => setForm({ ...form, thumbnail_url: e.target.value })} placeholder="Or paste image URL" className="bg-warm-bg border-border" />
        </div>

        {/* Screenshots */}
        <div className="space-y-2">
          <Label>Screenshots</Label>
          <label className="block border-2 border-dashed border-border rounded-xl p-4 text-center cursor-pointer hover:border-fire/40">
            <input type="file" multiple accept="image/*" className="hidden" onChange={(e) => e.target.files && uploadScreenshots(e.target.files)} />
            <p className="text-sm text-muted-foreground">Click to upload one or more screenshots</p>
          </label>
          {shots.length > 0 && (
            <div className="space-y-2">
              {shots.map((p) => (
                <div key={p.id} className="rounded-lg border border-border bg-warm-bg/40 p-2.5">
                  <div className="flex items-center justify-between gap-2 text-xs mb-1.5">
                    <span className="truncate text-ink/80 font-medium">{p.name}</span>
                    <div className="flex items-center gap-2 shrink-0">
                      {p.status === 'uploading' && <span className="text-fire font-bold tabular-nums">{p.pct}%</span>}
                      {p.status === 'done' && <span className="text-green-600 font-bold">✅ Done</span>}
                      {p.status === 'error' && <span className="text-destructive font-bold">⚠ Error</span>}
                      {p.status === 'cancelled' && <span className="text-muted-foreground font-bold">Cancelled</span>}
                      {p.status === 'queued' && <span className="text-muted-foreground">Queued…</span>}
                      {p.status === 'uploading' && (
                        <button type="button" onClick={() => cancelShot(p.id)} className="px-2 py-0.5 rounded bg-destructive/10 text-destructive hover:bg-destructive/20 text-[11px] font-semibold">Cancel</button>
                      )}
                      {(p.status === 'error' || p.status === 'cancelled') && (
                        <>
                          <button type="button" onClick={() => retryShot(p.id)} className="px-2 py-0.5 rounded bg-fire/10 text-fire hover:bg-fire/20 text-[11px] font-semibold">Retry</button>
                          <button type="button" onClick={() => removeShot(p.id)} className="px-2 py-0.5 rounded bg-muted text-muted-foreground hover:bg-muted/70 text-[11px]">Dismiss</button>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="h-1.5 bg-border rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all ${p.status === 'error' ? 'bg-destructive' : p.status === 'cancelled' ? 'bg-muted-foreground/50' : 'gradient-fire-strong'}`}
                      style={{ width: `${p.pct}%` }}
                    />
                  </div>
                  {p.error && <p className="text-[11px] text-destructive mt-1">{p.error}</p>}
                </div>
              ))}
            </div>
          )}
          {form.screenshots.length > 0 && (
            <div className="grid grid-cols-4 gap-2 mt-2">
              {form.screenshots.map((s: string, i: number) => (
                <div key={s} className="relative">
                  <img src={s} alt="" className="w-20 h-20 object-cover rounded border border-border" />
                  <div className="flex gap-1 mt-1">
                    <Button type="button" variant="outline" size="icon" className="h-6 w-6" aria-label={`Move screenshot ${i + 1} left`} disabled={i === 0} onClick={() => setForm((f: any) => { const screenshots = [...f.screenshots]; [screenshots[i - 1], screenshots[i]] = [screenshots[i], screenshots[i - 1]]; return { ...f, screenshots }; })}><ArrowLeft className="h-3 w-3" /></Button>
                    <Button type="button" variant="outline" size="icon" className="h-6 w-6" aria-label={`Move screenshot ${i + 1} right`} disabled={i === form.screenshots.length - 1} onClick={() => setForm((f: any) => { const screenshots = [...f.screenshots]; [screenshots[i], screenshots[i + 1]] = [screenshots[i + 1], screenshots[i]]; return { ...f, screenshots }; })}><ArrowRight className="h-3 w-3" /></Button>
                    <Button type="button" variant="ghost" size="icon" className="h-6 w-6 text-destructive" aria-label={`Remove screenshot ${i + 1}`} onClick={() => setForm({ ...form, screenshots: form.screenshots.filter((_: any, idx: number) => idx !== i) })}><X className="h-3 w-3" /></Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-2"><Label>Video URL</Label><Input value={form.video_url} onChange={(e) => setForm({ ...form, video_url: e.target.value })} placeholder="YouTube or MP4 URL" className="bg-warm-bg border-border" /></div>
        <div className="space-y-2">
          <Label>Live Preview URL</Label>
          <Input value={form.preview_url} onChange={(e) => setForm({ ...form, preview_url: e.target.value })} placeholder="https://…" className="bg-warm-bg border-border" />
          <div className="flex items-center gap-3 pt-1">
            <Switch checked={!!form.preview_enabled} onCheckedChange={(v) => setForm({ ...form, preview_enabled: v })} className="data-[state=checked]:bg-fire" />
            <Label className="text-xs text-muted-foreground font-normal">Show "Live Preview" button to public {!form.preview_enabled && <span className="text-amber-600 font-semibold">· hidden (admins only)</span>}</Label>
          </div>
          <div className="pt-2">
            <Label className="text-xs">Preview Watermark <span className="text-muted-foreground font-normal">(shown on top of the preview iframe to protect source URL)</span></Label>
            <Input value={form.preview_watermark} onChange={(e) => setForm({ ...form, preview_watermark: e.target.value })} placeholder="e.g. DevMarket Demo · Not for redistribution" className="bg-warm-bg border-border mt-1" />
          </div>
        </div>

        {/* Source code */}
        <div className="space-y-2">
          <Label>Source Code (.zip) — uploads to private bucket</Label>
          <label className="block border-2 border-dashed border-border rounded-xl p-4 text-center cursor-pointer hover:border-fire/40">
            <input type="file" accept=".zip" className="hidden" onChange={(e) => e.target.files?.[0] && uploadZip(e.target.files[0])} />
            <p className="text-sm text-muted-foreground">{zipName ? `✅ ${zipName}` : 'Click to upload source.zip'}</p>
          </label>
          <Input value={form.source_code_url} onChange={(e) => setForm({ ...form, source_code_url: e.target.value })} placeholder="Or paste external download link" className="bg-warm-bg border-border" />
        </div>

        <div className="flex items-center gap-3">
          <Switch checked={form.featured} onCheckedChange={(v) => setForm({ ...form, featured: v })} className="data-[state=checked]:bg-fire" />
          <Label>Featured Project</Label>
        </div>

        {/* Live preview card */}
        <div className="rounded-xl border border-border bg-warm-bg/40 p-4">
          <p className="text-xs uppercase tracking-wide text-muted-foreground mb-3">Live preview</p>
          <div className="bg-white rounded-xl overflow-hidden shadow-card max-w-xs">
            {form.thumbnail_url && <img src={form.thumbnail_url} alt="" className="aspect-video object-cover w-full" />}
            <div className="p-4">
              <h4 className="font-display font-bold text-ink">{form.title || 'Untitled project'}</h4>
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{form.short_desc || 'Short description preview…'}</p>
              <div className="flex flex-wrap gap-1 mt-2">{form.tech_stack.slice(0, 4).map((t: string) => <span key={t} className="text-[10px] px-2 py-0.5 rounded-full bg-fire/10 text-fire">{t}</span>)}</div>
              <div className="mt-3 flex items-center gap-2">
                <span className="font-display font-bold text-fire">{form.price === 0 ? 'Free' : `₹${form.discount_price || form.price}`}</span>
                {form.discount_price && form.discount_price < form.price && <span className="text-xs line-through text-muted-foreground">₹{form.price}</span>}
              </div>
            </div>
          </div>
        </div>

        </div>
        <div hidden={sec !== 'publish'} className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label>Price (₹)</Label>
            <div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">₹</span>
              <Input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: parseInt(e.target.value) || 0 })} className="bg-warm-bg border-border pl-7" />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Discount Price</Label>
            <div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">₹</span>
              <Input type="number" value={form.discount_price} onChange={(e) => setForm({ ...form, discount_price: parseInt(e.target.value) || 0 })} className="bg-warm-bg border-border pl-7" />
            </div>
          </div>
          <div className="space-y-2"><Label>Version</Label><Input value={form.version} onChange={(e) => setForm({ ...form, version: e.target.value })} placeholder="v1.0" className="bg-warm-bg border-border" /></div>
          <div className="space-y-2">
            <Label>Status</Label>
            <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
              <SelectTrigger className="bg-warm-bg border-border"><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="draft">Draft</SelectItem><SelectItem value="published">Published</SelectItem></SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2"><div className="flex justify-end"><Button type="button" size="sm" variant="outline" disabled={!!aiBusy} onClick={() => runAi('tech')}><Sparkles className="h-3.5 w-3.5 mr-1" />{aiBusy === 'tech' ? 'Detecting…' : 'Fetch tech with AI'}</Button></div>
        <TagInput label="Tech Stack" value={form.tech_stack} onChange={(v) => setForm({ ...form, tech_stack: v })} placeholder="React, TypeScript…" suggestions={TECH_SUGGESTIONS} withIcons />

        </div>
        <div className="rounded-xl border border-border p-4 space-y-3">
          <div className="flex items-center justify-between"><p className="font-semibold">Search engine (SEO)</p><Button type="button" size="sm" variant="outline" disabled={!!aiBusy} onClick={() => runAi('seo')}><Sparkles className="h-3.5 w-3.5 mr-1" />{aiBusy === 'seo' ? 'Writing…' : 'Generate SEO with AI'}</Button></div>
          <div className="space-y-1"><Label>SEO title <span className="text-xs text-muted-foreground">{(form.seo_title || '').length}/60</span></Label><Input value={form.seo_title} onChange={(e) => setForm({ ...form, seo_title: e.target.value })} placeholder={form.title} /></div>
          <div className="space-y-1"><Label>SEO description <span className="text-xs text-muted-foreground">{(form.seo_description || '').length}/155</span></Label><Textarea rows={2} value={form.seo_description} onChange={(e) => setForm({ ...form, seo_description: e.target.value })} placeholder={form.short_desc} /></div>
          <TagInput label="Keywords" value={form.seo_keywords} onChange={(v) => setForm({ ...form, seo_keywords: v })} placeholder="Type and press Enter" suggestions={[]} />
          <div className="space-y-1"><Label>Share image URL</Label><Input value={form.og_image_url} onChange={(e) => setForm({ ...form, og_image_url: e.target.value })} placeholder="Defaults to thumbnail" /></div>
          <label className="flex items-center gap-3 text-sm"><Switch checked={!!form.noindex} onCheckedChange={(v) => setForm({ ...form, noindex: v })} />Hide from Google (noindex)</label>
          <div className="rounded-lg bg-muted/50 p-3"><p className="text-[11px] text-muted-foreground">Google preview</p><p className="text-primary font-medium truncate">{form.seo_title || form.title || 'Project title'}</p><p className="text-xs text-green-700">bnoy01.lovable.app/p/{form.slug || 'your-slug'}</p><p className="text-xs text-muted-foreground line-clamp-2">{form.seo_description || form.short_desc}</p></div>
        </div>
        <div className="space-y-2 max-w-xs">
          <Label>Views count (manual override)</Label>
          <Input type="number" value={form.views_count} onChange={(e) => setForm({ ...form, views_count: e.target.value })} className="bg-warm-bg border-border" />
        </div>


        </div>
        <div className="flex gap-3">
          <Button type="submit" disabled={loading} className="gradient-fire-strong text-white">{loading ? 'Saving…' : isEdit ? 'Update Project' : 'Create Project'}</Button>
          <Button type="button" variant="outline" onClick={onDone}>Cancel</Button>
        </div>
      </form>
    </div>
  );
}

function AdminOrders() {
  const { data: purchases } = useQuery({ queryKey: ['admin-purchases'], queryFn: async () => { const { data } = await supabase.from('purchases').select('*, projects(title), profiles(email)'); return data || []; } });

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-bold">Orders</h1>
      <div className="bg-white rounded-xl border border-border shadow-card overflow-x-auto">
        <table className="w-full">
          <thead><tr className="border-b border-border">
            <th className="text-left p-4 text-sm">User</th>
            <th className="text-left p-4 text-sm">Project</th>
            <th className="text-left p-4 text-sm">Amount</th>
            <th className="text-left p-4 text-sm">Payment ID</th>
            <th className="text-left p-4 text-sm">Date</th>
          </tr></thead>
          <tbody>
            {purchases?.map((p: any) => (
              <tr key={p.id} className="border-b border-border/50">
                <td className="p-4 text-sm">{p.profiles?.email || '—'}</td>
                <td className="p-4 text-sm">{p.projects?.title || '—'}</td>
                <td className="p-4 text-sm">{p.amount === 0 ? 'Free' : `₹${p.amount}`}</td>
                <td className="p-4 text-sm text-muted-foreground">{p.razorpay_payment_id || '—'}</td>
                <td className="p-4 text-sm text-muted-foreground">{new Date(p.created_at).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {(!purchases || purchases.length === 0) && <p className="text-center text-muted-foreground py-8">No orders yet</p>}
      </div>
    </div>
  );
}

function AdminUsers() {
  const { data: profiles } = useQuery({ queryKey: ['admin-profiles'], queryFn: async () => { const { data } = await supabase.from('profiles').select('*').order('created_at', { ascending: false }); return data || []; } });

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-bold">Users</h1>
      <div className="bg-white rounded-xl border border-border shadow-card overflow-x-auto">
        <table className="w-full">
          <thead><tr className="border-b border-border">
            <th className="text-left p-4 text-sm">Name</th>
            <th className="text-left p-4 text-sm">Email</th>
            <th className="text-left p-4 text-sm">Joined</th>
          </tr></thead>
          <tbody>
            {profiles?.map((p: any) => (
              <tr key={p.id} className="border-b border-border/50">
                <td className="p-4 text-sm">{p.name || '—'}</td>
                <td className="p-4 text-sm">{p.email}</td>
                <td className="p-4 text-sm text-muted-foreground">{new Date(p.created_at).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {(!profiles || profiles.length === 0) && <p className="text-center text-muted-foreground py-8">No users yet</p>}
      </div>
    </div>
  );
}

function AdminAnalytics() {
  const { data: purchases } = useQuery({ queryKey: ['admin-purchases'], queryFn: async () => { const { data } = await supabase.from('purchases').select('*, projects(title, category)'); return data || []; } });

  const topProjects = purchases?.reduce((acc: any, p: any) => {
    const title = p.projects?.title || 'Unknown';
    acc[title] = (acc[title] || 0) + 1;
    return acc;
  }, {});
  const topData = Object.entries(topProjects || {}).map(([name, count]) => ({ name, sales: count })).sort((a: any, b: any) => b.sales - a.sales).slice(0, 5);

  const categoryData = purchases?.reduce((acc: any, p: any) => {
    const cats = p.projects?.category || [];
    cats.forEach((c: string) => { acc[c] = (acc[c] || 0) + 1; });
    return acc;
  }, {});
  const pieData = Object.entries(categoryData || {}).map(([name, value]) => ({ name, value }));

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-bold">Analytics</h1>
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-border shadow-card p-6">
          <h3 className="font-display font-semibold mb-4">Top Selling Projects</h3>
          {topData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={topData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(24, 60%, 90%)" />
                <XAxis dataKey="name" stroke="hsl(240, 8%, 40%)" fontSize={11} />
                <YAxis stroke="hsl(240, 8%, 40%)" fontSize={12} />
                <Tooltip contentStyle={{ background: 'white', border: '1px solid hsl(24, 60%, 90%)', borderRadius: '8px' }} />
                <Bar dataKey="sales" fill="#FF5722" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <p className="text-muted-foreground text-center py-12">No data yet</p>}
        </div>
        <div className="bg-white rounded-xl border border-border shadow-card p-6">
          <h3 className="font-display font-semibold mb-4">Sales by Category</h3>
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>
                  {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ background: 'white', border: '1px solid hsl(24, 60%, 90%)', borderRadius: '8px' }} />
              </PieChart>
            </ResponsiveContainer>
          ) : <p className="text-muted-foreground text-center py-12">No data yet</p>}
        </div>
      </div>
    </div>
  );
}

function AdminSettings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: settings } = useQuery({
    queryKey: ['site-settings'],
    queryFn: async () => (await supabase.from('site_settings').select('*').limit(1).maybeSingle()).data,
  });
  const [form, setForm] = useState<any>({});
  const [uploading, setUploading] = useState<string | null>(null);
  if (settings && !form.id) setTimeout(() => setForm(settings), 0);

  const save = async () => {
    const { error } = await supabase.from('site_settings').update({
      whatsapp_number: form.whatsapp_number, support_email: form.support_email,
      phone: form.phone, address: form.address, refund_policy: form.refund_policy,
      social_github: form.social_github, social_twitter: form.social_twitter,
      social_linkedin: form.social_linkedin, social_instagram: form.social_instagram,
      social_youtube: form.social_youtube,
      hero_video_url: form.hero_video_url, brand_name: form.brand_name, brand_tagline: form.brand_tagline,
      logo_url: form.logo_url, banner_url: form.banner_url,
      hero_lottie_url: form.hero_lottie_url, hero_bg_url: form.hero_bg_url, hero_badge: form.hero_badge,
      hide_watermarks: !!form.hide_watermarks,
    }).eq('id', settings!.id);
    if (error) toast({ title: 'Error', description: error.message, variant: 'destructive' });
    else { toast({ title: 'Saved!' }); queryClient.invalidateQueries({ queryKey: ['site-settings'] }); }
  };
  const f = (k: string) => ({ value: form[k] || '', onChange: (e: any) => setForm({ ...form, [k]: e.target.value }) });

  const uploadTo = async (key: string, file: File) => {
    if (!file) return;
    setUploading(key);
    try {
      const path = `branding/${key}-${Date.now()}-${file.name.replace(/\s+/g, '-')}`;
      const { error } = await supabase.storage.from('project-assets').upload(path, file, { upsert: true });
      if (error) throw error;
      const { data } = supabase.storage.from('project-assets').getPublicUrl(path);
      setForm((prev: any) => ({ ...prev, [key]: data.publicUrl }));
      toast({ title: 'Uploaded', description: 'Click Save Settings to apply.' });
    } catch (e: any) {
      toast({ title: 'Upload failed', description: e.message, variant: 'destructive' });
    } finally { setUploading(null); }
  };

  const FileField = ({ k, label, accept = 'image/*' }: { k: string; label: string; accept?: string }) => (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="flex flex-col sm:flex-row gap-2">
        <Input {...f(k)} placeholder="https://… or upload" className="flex-1" />
        <label className="inline-flex items-center justify-center gap-2 px-3 py-2 rounded-md border border-border bg-white text-sm font-medium cursor-pointer hover:bg-warm-bg shrink-0">
          {uploading === k ? 'Uploading…' : 'Upload'}
          <input type="file" accept={accept} className="hidden" onChange={(e) => e.target.files?.[0] && uploadTo(k, e.target.files[0])} />
        </label>
      </div>
      {form[k] && <img src={form[k]} alt="" className="h-12 rounded border border-border object-contain bg-warm-bg/40 p-1" onError={(e) => ((e.currentTarget as HTMLImageElement).style.display = 'none')} />}
    </div>
  );

  return (
    <div className="space-y-6 max-w-3xl">
      <h1 className="font-display text-2xl font-bold">Site Settings</h1>

      <div className="bg-white rounded-xl border border-border shadow-card p-6 space-y-4">
        <h3 className="font-display font-bold">Branding</h3>
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="space-y-2"><Label>Brand name</Label><Input {...f('brand_name')} placeholder="Bnoy Studios" /></div>
          <div className="space-y-2"><Label>Brand tagline</Label><Input {...f('brand_tagline')} placeholder="Premium web & mobile projects" /></div>
          <div className="space-y-2 sm:col-span-2"><Label>Hero badge text</Label><Input {...f('hero_badge')} placeholder="New · 50+ Premium Projects" /></div>
          <FileField k="logo_url" label="Logo (Navbar + Footer)" />
          <FileField k="banner_url" label="Banner / OG image" />
        </div>

        <h3 className="font-display font-bold pt-4">Hero Assets</h3>
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="space-y-2 sm:col-span-2"><Label>Hero background video URL (mp4)</Label><Input {...f('hero_video_url')} placeholder="https://…/hero.mp4" /></div>
          <FileField k="hero_bg_url" label="Hero background image" />
          <div className="space-y-2"><Label>Hero Lottie JSON URL</Label><Input {...f('hero_lottie_url')} placeholder="https://…/animation.json or .lottie" /></div>
        </div>

        <h3 className="font-display font-bold pt-4">Watermarks</h3>
        <div className="flex items-center justify-between rounded-xl border border-border bg-warm-bg/50 p-4">
          <div>
            <p className="font-semibold text-sm text-ink">Master watermark switch</p>
            <p className="text-xs text-muted-foreground">Hide all preview watermarks site-wide.</p>
          </div>
          <Switch checked={!!form.hide_watermarks} onCheckedChange={(v) => setForm({ ...form, hide_watermarks: v })} />
        </div>

        <h3 className="font-display font-bold pt-4">Contact</h3>
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="space-y-2"><Label>WhatsApp number</Label><Input {...f('whatsapp_number')} placeholder="+919999999999" /></div>
          <div className="space-y-2"><Label>Support email</Label><Input {...f('support_email')} /></div>
          <div className="space-y-2"><Label>Phone</Label><Input {...f('phone')} /></div>
          <div className="space-y-2"><Label>Address</Label><Input {...f('address')} /></div>
        </div>

        <h3 className="font-display font-bold pt-4">Social Media URLs</h3>
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="space-y-2"><Label>GitHub</Label><Input {...f('social_github')} /></div>
          <div className="space-y-2"><Label>Twitter</Label><Input {...f('social_twitter')} /></div>
          <div className="space-y-2"><Label>LinkedIn</Label><Input {...f('social_linkedin')} /></div>
          <div className="space-y-2"><Label>Instagram</Label><Input {...f('social_instagram')} /></div>
          <div className="space-y-2 sm:col-span-2"><Label>YouTube</Label><Input {...f('social_youtube')} /></div>
        </div>
        <div className="space-y-2"><Label>Refund Policy</Label><Textarea rows={6} {...f('refund_policy')} /></div>
        <Button onClick={save} className="gradient-fire-strong text-white">Save Settings</Button>
      </div>
    </div>
  );
}
