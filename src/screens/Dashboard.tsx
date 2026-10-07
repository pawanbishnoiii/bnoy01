import { useEffect, useState } from 'react';
import { Navigate, Link, useSearchParams } from '@/lib/router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { ShoppingBag, CreditCard, Settings2, Heart, Download, Sparkles, IndianRupee, Trash2, Pencil, Camera, Bot } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/store/authStore';
import Navbar from '@/components/Navbar';
import AuthModal from '@/components/AuthModal';
import Footer from '@/components/Footer';
import ProjectCard from '@/components/ProjectCard';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import AIHelper from '@/components/AIHelper';

const NAME_MAX = 60;

export default function Dashboard() {
  const { user } = useAuthStore();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [uploading, setUploading] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [nameDraft, setNameDraft] = useState('');
  const [nameError, setNameError] = useState<string | null>(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = searchParams.get('tab') || 'purchases';

  if (!user) return <Navigate to="/" replace />;

  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ['profile', user.id],
    queryFn: async () => (await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle()).data,
  });

  // Auto-import Google/email metadata once if profile is empty.
  useEffect(() => {
    if (!profile) return;
    const meta = (user.user_metadata || {}) as any;
    const gAvatar = meta.avatar_url || meta.picture;
    const gName = meta.full_name || meta.name;
    const patch: any = {};
    if (!profile.avatar_url && gAvatar) patch.avatar_url = gAvatar;
    if (!profile.name && gName) patch.name = gName;
    if (Object.keys(patch).length) {
      supabase.from('profiles').update(patch).eq('id', user.id).then(() => qc.invalidateQueries({ queryKey: ['profile'] }));
    }
  }, [profile, user, qc]);

  const { data: purchases, isLoading: purchasesLoading } = useQuery({
    queryKey: ['my-purchases', user.id],
    queryFn: async () => {
      const { data, error } = await supabase.from('purchases').select('*, projects(*)').eq('user_id', user.id).order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: wishlist, isLoading: wishlistLoading } = useQuery({
    queryKey: ['my-wishlist', user.id],
    queryFn: async () => (await supabase.from('wishlists').select('*, projects(*)').eq('user_id', user.id)).data,
  });

  const { data: recommendations } = useQuery({
    queryKey: ['recommendations', user.id, purchases?.length],
    queryFn: async () => {
      const purchasedIds = (purchases || []).map((p: any) => p.project_id);
      let q = supabase.from('projects').select('*').eq('status', 'published').order('featured', { ascending: false }).order('created_at', { ascending: false }).limit(6);
      if (purchasedIds.length) q = q.not('id', 'in', `(${purchasedIds.join(',')})`);
      return (await q).data || [];
    },
    enabled: !!purchases,
  });

  const removeWishMut = useMutation({
    mutationFn: async (id: string) => { await supabase.from('wishlists').delete().eq('id', id); },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['my-wishlist'] }); toast({ title: 'Removed from wishlist' }); },
  });

  const totalSpent = purchases?.reduce((s: number, p: any) => s + (p.amount || 0), 0) || 0;
  const memberSince = user.created_at ? new Date(user.created_at).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }) : '—';
  const initials = (profile?.name || user.email || 'U').split(' ').map((s: string) => s[0]).slice(0, 2).join('').toUpperCase();

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    if (file.size > 4 * 1024 * 1024) {
      toast({ title: 'File too large', description: 'Please use an image under 4 MB.', variant: 'destructive' });
      return;
    }
    setUploading(true);
    try {
      const ext = (file.name.split('.').pop() || 'png').toLowerCase();
      const path = `${user.id}/avatar.${ext}`;
      const { error } = await supabase.storage.from('avatars').upload(path, file, { upsert: true, cacheControl: '3600' });
      if (error) throw error;
      const { data: pub } = supabase.storage.from('avatars').getPublicUrl(path);
      const url = `${pub.publicUrl}?t=${Date.now()}`;
      await supabase.from('profiles').update({ avatar_url: url }).eq('id', user.id);
      qc.invalidateQueries({ queryKey: ['profile'] });
      toast({ title: 'Avatar updated!' });
    } catch (e: any) {
      toast({ title: 'Upload failed', description: e.message, variant: 'destructive' });
    } finally { setUploading(false); }
  };

  const handleDownload = async (project: any) => {
    if (project?.source_code_url) { window.open(project.source_code_url, '_blank', 'noopener'); return; }
    try {
      const path = `${project.id}/source.zip`;
      const { data, error } = await supabase.storage.from('source-code').createSignedUrl(path, 60);
      if (error) throw error;
      window.open(data.signedUrl, '_blank', 'noopener');
    } catch (e: any) {
      toast({ title: 'Download unavailable', description: e.message || 'Source not yet uploaded.', variant: 'destructive' });
    }
  };

  const openEdit = () => {
    setNameDraft(profile?.name || (user.user_metadata as any)?.full_name || '');
    setNameError(null);
    setEditOpen(true);
  };

  const submitEdit = async () => {
    const trimmed = nameDraft.trim();
    if (!trimmed) { setNameError('Name cannot be empty.'); return; }
    if (trimmed.length > NAME_MAX) { setNameError(`Max ${NAME_MAX} characters.`); return; }
    setSavingProfile(true);
    const { error } = await supabase.from('profiles').update({ name: trimmed }).eq('id', user.id);
    setSavingProfile(false);
    if (error) { toast({ title: 'Could not save', description: error.message, variant: 'destructive' }); return; }
    toast({ title: 'Profile updated ✨', description: 'Your changes have been saved.' });
    qc.invalidateQueries({ queryKey: ['profile'] });
    setEditOpen(false);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.3 }} className="min-h-screen bg-background">
      <Navbar /><AuthModal />
      <div className="container mx-auto px-4 pt-24 md:pt-28 pb-24">
        {/* Profile header */}
        <motion.section
          initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-3xl border border-border shadow-card-hover mb-8"
        >
          <div className="relative h-28 sm:h-36 bg-gradient-to-br from-fire via-fire/80 to-sun">
            <div className="absolute inset-0 opacity-30"
              style={{
                backgroundImage: 'radial-gradient(circle at 20% 30%, rgba(255,255,255,.5) 0, transparent 40%), radial-gradient(circle at 80% 70%, rgba(255,255,255,.4) 0, transparent 35%)',
              }} />
            <div className="absolute inset-0"
              style={{
                backgroundImage: 'linear-gradient(rgba(255,255,255,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.08) 1px, transparent 1px)',
                backgroundSize: '32px 32px',
                maskImage: 'radial-gradient(circle at center, black 30%, transparent 75%)',
              }} />
          </div>

          <div className="bg-white px-4 sm:px-6 pb-6 pt-0">
            <div className="flex flex-col sm:flex-row sm:items-end gap-4 sm:gap-6 -mt-12 sm:-mt-14">
              <label className="relative group cursor-pointer self-start" title="Change picture">
                <Avatar className="h-24 w-24 sm:h-28 sm:w-28 ring-4 ring-white shadow-card-hover">
                  <AvatarImage src={profile?.avatar_url || ''} />
                  <AvatarFallback className="gradient-fire-strong text-white font-extrabold text-3xl">{initials}</AvatarFallback>
                </Avatar>
                <span className="absolute inset-0 rounded-full bg-black/45 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white text-[10px] font-bold uppercase tracking-widest">
                  {uploading ? '…' : <span className="inline-flex items-center gap-1"><Camera className="h-3.5 w-3.5" /> Change</span>}
                </span>
                <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} disabled={uploading} />
              </label>

              <div className="flex-1 min-w-0">
                {profileLoading ? (
                  <>
                    <Skeleton className="h-7 w-48 mb-2" />
                    <Skeleton className="h-4 w-64" />
                  </>
                ) : (
                  <>
                    <div className="flex items-center gap-2 min-w-0">
                      <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-ink truncate">{profile?.name || user.email?.split('@')[0]}</h1>
                      <button onClick={openEdit} className="shrink-0 p-1.5 rounded-full hover:bg-warm-bg text-muted-foreground hover:text-fire transition" aria-label="Edit profile">
                        <Pencil className="h-4 w-4" />
                      </button>
                    </div>
                    <p className="text-sm text-muted-foreground truncate">{user.email}</p>
                    <p className="text-[11px] text-muted-foreground mt-1 inline-flex items-center gap-1.5">
                      <Sparkles className="h-3 w-3 text-fire" /> Member since {memberSince}
                    </p>
                  </>
                )}
              </div>

              <div className="grid grid-cols-3 gap-2 sm:flex sm:gap-2 sm:flex-none">
                {purchasesLoading ? (
                  <>
                    <MiniStatSkeleton /><MiniStatSkeleton /><MiniStatSkeleton />
                  </>
                ) : (
                  <>
                    <MiniStat label="Buys" value={purchases?.length || 0} />
                    <MiniStat label="Spent" value={`₹${totalSpent.toLocaleString('en-IN')}`} />
                    <MiniStat label="Wish" value={wishlist?.length || 0} />
                  </>
                )}
              </div>
            </div>
          </div>
        </motion.section>

        <Tabs value={tab} onValueChange={(v) => setSearchParams({ tab: v })} className="space-y-6">
          <TabsList className="bg-warm-bg border border-border flex flex-nowrap h-auto gap-1 p-1 rounded-xl w-full justify-start overflow-x-auto">
            <TabsTrigger value="purchases" className="data-[state=active]:gradient-fire-strong data-[state=active]:text-white"><Download className="h-4 w-4 mr-2" />Purchases</TabsTrigger>
            <TabsTrigger value="payments" className="data-[state=active]:gradient-fire-strong data-[state=active]:text-white"><CreditCard className="h-4 w-4 mr-2" />Payments</TabsTrigger>
            <TabsTrigger value="wishlist" className="data-[state=active]:gradient-fire-strong data-[state=active]:text-white"><Heart className="h-4 w-4 mr-2" />Wishlist</TabsTrigger>
            <TabsTrigger value="recommendations" className="data-[state=active]:gradient-fire-strong data-[state=active]:text-white"><Sparkles className="h-4 w-4 mr-2" />For you</TabsTrigger>
            <TabsTrigger value="assistant" className="data-[state=active]:gradient-fire-strong data-[state=active]:text-white"><Bot className="h-4 w-4 mr-2" />Assistant</TabsTrigger>
            <TabsTrigger value="settings" className="data-[state=active]:gradient-fire-strong data-[state=active]:text-white"><Settings2 className="h-4 w-4 mr-2" />Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="purchases">
            <div className="space-y-3">
              {purchasesLoading ? (
                <>
                  {[1,2,3].map(i => <PurchaseRowSkeleton key={i} />)}
                </>
              ) : (!purchases || purchases.length === 0) ? (
                <EmptyState text="You haven't purchased any projects yet." cta="Browse marketplace" link="/marketplace" />
              ) : (
                purchases.map((p: any) => (
                  <div key={p.id} className="bg-white rounded-xl p-4 border border-border shadow-card flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4 min-w-0">
                      <img src={p.projects?.thumbnail_url || '/placeholder.svg'} alt="" loading="lazy" className="w-20 h-14 rounded-lg object-cover shrink-0" />
                      <div className="min-w-0">
                        <h3 className="font-display font-bold text-ink truncate">{p.projects?.title}</h3>
                        <p className="text-xs text-muted-foreground">{new Date(p.created_at).toLocaleDateString()} · {p.amount === 0 ? 'Free' : `₹${p.amount}`}</p>
                      </div>
                    </div>
                    <Button size="sm" onClick={() => handleDownload(p.projects)} className="bg-green-600 text-white hover:bg-green-700 shrink-0">
                      <Download className="h-4 w-4 mr-1" /> <span className="hidden sm:inline">Download</span>
                    </Button>
                  </div>
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="payments">
            <div className="bg-white rounded-xl overflow-x-auto border border-border shadow-card">
              {purchasesLoading ? (
                <div className="p-4 space-y-3">
                  {[1,2,3,4].map(i => <Skeleton key={i} className="h-10 w-full" />)}
                </div>
              ) : (!purchases || purchases.length === 0) ? (
                <EmptyState text="No payment history yet." cta="Browse marketplace" link="/marketplace" />
              ) : (
                <table className="w-full text-sm">
                  <thead><tr className="border-b border-border bg-warm-bg">
                    <th className="text-left p-4">Date</th><th className="text-left p-4">Project</th>
                    <th className="text-left p-4">Amount</th><th className="text-left p-4">Status</th>
                  </tr></thead>
                  <tbody>
                    {purchases.map((p: any, idx: number) => (
                      <tr key={p.id} className={idx % 2 ? 'bg-warm-bg/40' : ''}>
                        <td className="p-4 text-muted-foreground whitespace-nowrap">{new Date(p.created_at).toLocaleDateString()}</td>
                        <td className="p-4 text-ink">{p.projects?.title}</td>
                        <td className="p-4 text-fire font-bold whitespace-nowrap">{p.amount === 0 ? 'Free' : `₹${p.amount}`}</td>
                        <td className="p-4"><span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-700">Success</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </TabsContent>

          <TabsContent value="wishlist">
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {wishlistLoading ? (
                [1,2,3].map(i => <Skeleton key={i} className="h-72 rounded-2xl" />)
              ) : !wishlist || wishlist.length === 0 ? (
                <div className="col-span-full"><EmptyState text="Your wishlist is empty." cta="Discover projects" link="/marketplace" /></div>
              ) : (
                wishlist.map((w: any) => (
                  <div key={w.id} className="relative">
                    <ProjectCard project={w.projects} />
                    <button onClick={() => removeWishMut.mutate(w.id)}
                      className="absolute top-3 left-3 z-10 w-8 h-8 rounded-full bg-white/90 flex items-center justify-center text-destructive hover:bg-white" aria-label="Remove from wishlist">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="recommendations">
            <h2 className="font-display text-xl font-bold text-ink mb-4">Recommended for you</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {recommendations?.map((p: any, i) => (
                <div key={p.id} className="relative">
                  <span className="absolute top-3 left-3 z-10 px-2 py-1 rounded-full bg-fire text-white text-[10px] font-bold uppercase">Recommended</span>
                  <ProjectCard project={p} index={i} />
                </div>
              ))}
              {(!recommendations || recommendations.length === 0) && <p className="col-span-full text-center py-8 text-muted-foreground">No recommendations yet.</p>}
            </div>
          </TabsContent>

          <TabsContent value="assistant">
            <div className="max-w-2xl"><AIHelper /></div>
          </TabsContent>

          <TabsContent value="settings">
            <div className="grid md:grid-cols-3 gap-6 mb-6">
              {purchasesLoading ? (
                <><Skeleton className="h-28 rounded-xl" /><Skeleton className="h-28 rounded-xl" /><Skeleton className="h-28 rounded-xl" /></>
              ) : (
                <>
                  <StatCard icon={ShoppingBag} label="Total Purchases" value={purchases?.length || 0} />
                  <StatCard icon={IndianRupee} label="Total Spent" value={`₹${totalSpent.toLocaleString('en-IN')}`} />
                  <StatCard icon={Sparkles} label="Member Since" value={memberSince} />
                </>
              )}
            </div>
            <div className="bg-white rounded-xl p-6 max-w-lg space-y-5 border border-border shadow-card">
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16 ring-2 ring-fire/40">
                  <AvatarImage src={profile?.avatar_url || ''} />
                  <AvatarFallback className="gradient-fire-strong text-white font-bold">{initials}</AvatarFallback>
                </Avatar>
                <label className="cursor-pointer">
                  <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} disabled={uploading} />
                  <span className="text-sm text-fire hover:underline font-medium">{uploading ? 'Uploading…' : 'Change picture'}</span>
                </label>
              </div>
              <div className="space-y-2"><Label>Email</Label><Input value={user.email || ''} disabled /></div>
              <div className="space-y-2">
                <Label>Display name</Label>
                <Input value={profile?.name || ''} readOnly placeholder="—" />
              </div>
              <Button onClick={openEdit} className="gradient-fire-strong text-white">
                <Pencil className="h-4 w-4 mr-2" /> Edit profile
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Edit profile modal — validation, loading state, toast feedback */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit profile</DialogTitle>
            <DialogDescription>Update your display name. Email cannot be changed here.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Display name</Label>
              <Input
                id="edit-name"
                autoFocus
                value={nameDraft}
                maxLength={NAME_MAX}
                onChange={(e) => { setNameDraft(e.target.value); if (nameError) setNameError(null); }}
                onKeyDown={(e) => { if (e.key === 'Enter') submitEdit(); }}
                placeholder="Your name"
                aria-invalid={!!nameError}
              />
              <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                <span className={nameError ? 'text-destructive font-semibold' : ''}>{nameError || 'Shown across your dashboard and reviews.'}</span>
                <span>{nameDraft.length}/{NAME_MAX}</span>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input value={user.email || ''} disabled />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)} disabled={savingProfile}>Cancel</Button>
            <Button onClick={submitEdit} disabled={savingProfile} className="gradient-fire-strong text-white">
              {savingProfile ? 'Saving…' : 'Save changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Footer />
    </motion.div>
  );
}

function MiniStat({ label, value }: { label: string; value: any }) {
  return (
    <div className="px-3 py-2 rounded-xl bg-gradient-to-br from-white to-warm-bg/60 border border-border text-center min-w-[72px] shadow-card">
      <div className="text-[10px] uppercase text-muted-foreground tracking-widest font-bold">{label}</div>
      <div className="font-display font-extrabold text-ink text-sm sm:text-base mt-0.5">{value}</div>
    </div>
  );
}
function MiniStatSkeleton() {
  return (
    <div className="px-3 py-2 rounded-xl bg-white border border-border min-w-[72px]">
      <Skeleton className="h-2.5 w-10 mx-auto" />
      <Skeleton className="h-4 w-12 mx-auto mt-1.5" />
    </div>
  );
}
function PurchaseRowSkeleton() {
  return (
    <div className="bg-white rounded-xl p-4 border border-border flex items-center gap-4">
      <Skeleton className="w-20 h-14 rounded-lg shrink-0" />
      <div className="flex-1 space-y-2 min-w-0">
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-3 w-1/3" />
      </div>
      <Skeleton className="h-9 w-24 rounded-md shrink-0" />
    </div>
  );
}
function StatCard({ icon: Icon, label, value }: any) {
  return (
    <div className="bg-gradient-to-br from-orange-50 to-white border border-border rounded-xl p-5 shadow-card">
      <div className="w-10 h-10 rounded-lg gradient-fire-strong text-white flex items-center justify-center mb-3"><Icon className="h-5 w-5" /></div>
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="font-display text-2xl font-bold text-ink">{value}</p>
    </div>
  );
}
function EmptyState({ text, cta, link }: { text: string; cta: string; link: string }) {
  return (
    <div className="text-center py-12">
      <svg width="120" height="120" viewBox="0 0 200 200" className="mx-auto opacity-60">
        <rect x="40" y="60" width="120" height="100" rx="12" fill="#FFE0B2" />
        <rect x="55" y="80" width="90" height="8" rx="4" fill="#FFB74D" />
        <rect x="55" y="100" width="60" height="8" rx="4" fill="#FFB74D" />
        <circle cx="100" cy="50" r="14" fill="#FF5722" />
      </svg>
      <p className="text-muted-foreground mb-4 mt-2">{text}</p>
      <Link to={link}><Button className="gradient-fire-strong text-white">{cta}</Button></Link>
    </div>
  );
}
