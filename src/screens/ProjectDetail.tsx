import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from '@/lib/router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Eye, ShoppingCart, Download, Lock, ShieldCheck, Code2, Star, Heart,
  MessageCircle, Send, History, Mail, Link as LinkIcon, KeyRound, Copy, Share2,
  ChevronLeft, ChevronRight, ChevronDown, Maximize2,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/store/authStore';
import { useToast } from '@/hooks/use-toast';
import { useRazorpay } from '@/hooks/useRazorpay';
import { useSwipe } from '@/hooks/useSwipe';
import { celebrateCart, celebratePurchase } from '@/lib/celebrate';
import { techIcon } from '@/lib/techIcons';
import Navbar from '@/components/Navbar';
import AuthModal from '@/components/AuthModal';
import PreviewModal from '@/components/PreviewModal';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import SafeDescription from '@/components/SafeDescription';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { rankRecommendations } from '@/lib/recommendations';

function toEmbed(url: string): string {
  if (!url) return url;
  const yt = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([\w-]{11})/);
  if (yt) return `https://www.youtube.com/embed/${yt[1]}`;
  const vimeo = url.match(/vimeo\.com\/(\d+)/);
  if (vimeo) return `https://player.vimeo.com/video/${vimeo[1]}`;
  return url;
}

interface ChangelogEntry { version: string; date?: string; notes: string; }

export default function ProjectDetail() {
  const params = useParams();
  const navigate = useNavigate();
  const idOrSlug = params.id || params.slug;
  const isUuid = !!idOrSlug && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrSlug);
  const { user, isAdmin, setShowAuthModal } = useAuthStore();
  const { toast } = useToast();
  const { openPayment } = useRazorpay();
  const qc = useQueryClient();
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [activeImg, setActiveImg] = useState(0);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [selectedVersion, setSelectedVersion] = useState<string>('');
  const [commentText, setCommentText] = useState('');
  const [rating, setRating] = useState(5);
  const [stickyVisible, setStickyVisible] = useState(false);

  const { data: baseProject, isLoading } = useQuery({
    queryKey: ['project', idOrSlug],
    queryFn: async () => {
      if (!idOrSlug) return null;
      const q = supabase.from('projects').select('*');
      const { data, error } = isUuid
        ? await q.eq('id', idOrSlug).single()
        : await q.eq('slug', idOrSlug).single();
      if (error) throw error;
      return data;
    },
    enabled: !!idOrSlug,
  });
  const { data: releases = [] } = useQuery({
    queryKey: ['project-versions', baseProject?.id],
    queryFn: async () => {
      if (!baseProject?.id) return [];
      const { data, error } = await supabase.from('project_versions').select('*').eq('project_id', baseProject.id).order('is_latest', { ascending: false }).order('released_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!baseProject?.id,
  });
  const activeRelease = releases.find(release => release.version.replace(/^v/, '') === selectedVersion.replace(/^v/, ''));
  const project = baseProject && activeRelease ? { ...baseProject,
    version: activeRelease.version,
    short_desc: activeRelease.short_desc ?? baseProject.short_desc,
    full_desc: activeRelease.full_desc ?? baseProject.full_desc,
    thumbnail_url: activeRelease.thumbnail_url ?? baseProject.thumbnail_url,
    screenshots: activeRelease.screenshots.length ? activeRelease.screenshots : baseProject.screenshots,
    video_url: activeRelease.video_url ?? baseProject.video_url,
    preview_url: activeRelease.preview_url ?? baseProject.preview_url,
    source_code_url: activeRelease.source_code_url ?? baseProject.source_code_url,
    price: activeRelease.price ?? baseProject.price,
    discount_price: activeRelease.discount_price ?? baseProject.discount_price,
  } : baseProject;
  const id = project?.id;

  useEffect(() => { if (id) supabase.rpc('increment_project_views', { _project_id: id }); }, [id]);

  // Show sticky mobile CTA after the user has scrolled past the hero area.
  useEffect(() => {
    const onScroll = () => setStickyVisible(window.scrollY > 320);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const { data: purchase, refetch: refetchPurchase } = useQuery({
    queryKey: ['purchase', id, user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await supabase.from('purchases').select('*').eq('user_id', user.id).eq('project_id', id!).maybeSingle();
      return data;
    },
    enabled: !!user && !!id,
  });

  const { data: related } = useQuery({
    queryKey: ['related', project?.id],
    queryFn: async () => {
      if (!project) return [];
      const { data, error } = await supabase.from('projects').select('*').eq('status', 'published').neq('id', project.id).order('created_at',{ ascending:false }).limit(200);
      if (error) throw error;
      return rankRecommendations(project, data || [], 8);
    },
    enabled: !!project,
  });

  const { data: likeData } = useQuery({
    queryKey: ['project-like', id, user?.id],
    queryFn: async () => {
      if (!user) return { liked: false };
      const { data } = await supabase.from('project_likes').select('id').eq('project_id', id!).eq('user_id', user.id).maybeSingle();
      return { liked: !!data };
    },
    enabled: !!id,
  });

  const { data: comments } = useQuery({
    queryKey: ['project-comments', id],
    queryFn: async () => {
      const { data } = await supabase.from('project_comments')
        .select('*, profiles(name, avatar_url, email)')
        .eq('project_id', id!).order('created_at', { ascending: false });
      return data || [];
    },
    enabled: !!id,
  });

  const effectivePrice = project && project.discount_price != null && project.discount_price >= 0 && project.discount_price < project.price ? project.discount_price : project?.price;
  const isFree = effectivePrice === 0;
  const purchased = !!purchase;

  const changelog: ChangelogEntry[] = (() => {
    const raw = (project as any)?.changelog;
    let arr: ChangelogEntry[] = [];
    if (Array.isArray(raw)) arr = raw;
    else if (typeof raw === 'string' && raw.trim()) {
      try { arr = JSON.parse(raw); } catch { arr = [{ version: project?.version || 'v1.0', notes: raw }]; }
    }
    if (!Array.isArray(arr)) arr = [];
    if (baseProject && !arr.find(e => e.version === (baseProject.version || 'v1.0'))) {
      arr = [{ version: baseProject.version || 'v1.0', date: baseProject.created_at.slice(0,10), notes: 'Initial release.' }, ...arr];
    }
    const fromReleases = releases.map(r => ({ version: r.version, date: r.released_at, notes: r.changelog || r.notes || '', screenshots: r.screenshots }));
    return [...fromReleases, ...arr.filter(c => !fromReleases.some(r => r.version === c.version))];
  })();

  useEffect(() => {
    if (changelog.length && !changelog.some(c => c.version === selectedVersion)) setSelectedVersion(changelog[0].version);
  }, [idOrSlug, changelog.length, selectedVersion]);

  const activeChange = changelog.find(c => c.version === selectedVersion) || changelog[0];
  const versionScreenshots = (activeChange as any)?.screenshots as string[] | undefined;
  const baseImages = project ? [project.thumbnail_url, ...(project.screenshots || [])].filter(Boolean) : [];
  const images = versionScreenshots && versionScreenshots.length > 0
    ? [project?.thumbnail_url, ...versionScreenshots].filter(Boolean) as string[]
    : baseImages;

  useEffect(() => { setActiveImg(0); }, [selectedVersion]);

  const galleryNext = () => setActiveImg((i) => (i + 1) % Math.max(1, images.length));
  const galleryPrev = () => setActiveImg((i) => (i - 1 + Math.max(1, images.length)) % Math.max(1, images.length));
  const swipe = useSwipe({ onSwipeLeft: galleryNext, onSwipeRight: galleryPrev });

  const handleBuy = async () => {
    if (!project) return;
    navigate(`/checkout/${project.id}${selectedVersion ? `?version=${encodeURIComponent(selectedVersion)}` : ''}`);
  };

  const handleDownload = async () => {
    if (!project) return;
    setDownloading(true);
    try {
      if (project.source_code_url) { window.open(project.source_code_url, '_blank', 'noopener'); return; }
      const path = `${project.id}/source.zip`;
      const { data, error } = await supabase.storage.from('source-code').createSignedUrl(path, 60);
      if (error) throw error;
      window.open(data.signedUrl, '_blank', 'noopener');
    } catch (e: any) {
      toast({ title: 'Download unavailable', description: e.message || 'Source code not yet uploaded.', variant: 'destructive' });
    } finally { setDownloading(false); }
  };

  const toggleLike = async () => {
    if (!user) { setShowAuthModal(true, 'Sign in to like this project.'); return; }
    if (likeData?.liked) await supabase.from('project_likes').delete().eq('project_id', id!).eq('user_id', user.id);
    else await supabase.from('project_likes').insert({ project_id: id!, user_id: user.id });
    qc.invalidateQueries({ queryKey: ['project-like', id, user.id] });
    qc.invalidateQueries({ queryKey: ['project', id] });
  };

  const submitComment = async () => {
    if (!user) { setShowAuthModal(true, 'Sign in to leave a review.'); return; }
    if (!commentText.trim()) return;
    const { error } = await supabase.from('project_comments').insert({ project_id: id!, user_id: user.id, content: commentText.trim(), rating });
    if (error) { toast({ title: 'Error', description: error.message, variant: 'destructive' }); return; }
    setCommentText('');
    qc.invalidateQueries({ queryKey: ['project-comments', id] });
    toast({ title: 'Review posted ✨' });
  };

  const sharePage = async () => {
    const url = window.location.href;
    const shareData = { title: project?.title || 'Bnoy Studios', text: project?.short_desc || '', url };
    if (navigator.share) { try { await navigator.share(shareData); return; } catch {} }
    try { await navigator.clipboard.writeText(url); toast({ title: 'Link copied' }); }
    catch { toast({ title: 'Share unavailable', description: url, variant: 'destructive' }); }
  };

  if (isLoading) return (
    <div className="min-h-screen bg-background"><Navbar /><AuthModal />
      <div className="container mx-auto px-4 pt-28">
        <Skeleton className="h-96 w-full rounded-2xl mb-8" />
        <Skeleton className="h-8 w-1/2 mb-4" />
      </div>
    </div>
  );

  if (!project) return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Navbar /><AuthModal />
      <div className="text-center">
        <h2 className="font-display text-2xl font-bold mb-4">Project not found</h2>
        <Link to="/marketplace"><Button>Back to marketplace</Button></Link>
      </div>
    </div>
  );

  const avgRating = comments?.length
    ? (comments.filter(c => c.rating).reduce((s, c: any) => s + (c.rating || 0), 0) / Math.max(1, comments.filter(c => c.rating).length))
    : 4.9;

  const ratingStars = (n: number, size = 'h-3.5 w-3.5') => (
    <span className="inline-flex items-center gap-0.5">
      {[1,2,3,4,5].map((i) => <Star key={i} className={`${size} ${i <= Math.round(n) ? 'text-sun fill-sun' : 'text-border'}`} />)}
    </span>
  );

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.3 }}
      className="min-h-screen bg-background w-full overflow-x-hidden">
      <Navbar /><AuthModal />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 pt-24 md:pt-28 pb-28 md:pb-20 max-w-7xl w-full">
        <div className="flex items-center justify-between mb-5 md:mb-8">
          <Link to="/marketplace" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-fire">
            <ArrowLeft className="h-4 w-4" /> Back
          </Link>
          <Select value={selectedVersion || changelog[0]?.version || 'v1.0'} onValueChange={setSelectedVersion}>
            <SelectTrigger aria-label="Select project version" className="mx-3 w-48 h-11 rounded-lg border-primary/30 bg-primary/10 text-primary font-semibold shadow-card"><History className="h-4 w-4 shrink-0" /><SelectValue /></SelectTrigger>
            <SelectContent>{changelog.map((c, i) => <SelectItem key={c.version} value={c.version}>{c.version}{i === 0 ? ' · Latest' : ''}</SelectItem>)}</SelectContent>
          </Select>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="sm" onClick={toggleLike} aria-label="Like" className={likeData?.liked ? 'text-fire' : ''}>
              <Heart className={`h-4 w-4 ${likeData?.liked ? 'fill-fire' : ''}`} />
              <span className="ml-1 text-xs">{(project as any).likes_count || 0}</span>
            </Button>
            <Button variant="ghost" size="sm" onClick={sharePage} aria-label="Share"><Share2 className="h-4 w-4" /></Button>
          </div>
        </div>

        {/* MOBILE HERO HEADER */}
        <div className="md:hidden mb-5">
          <h1 className="font-display text-[clamp(1.6rem,6vw,2.2rem)] font-extrabold text-ink leading-tight">{project.title}</h1>
          <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
            {ratingStars(avgRating)}
            <span className="font-semibold text-ink">{avgRating.toFixed(1)}</span>
            <span className="inline-flex items-center gap-1"><Eye className="h-3.5 w-3.5" />{(project as any).views_count || 0}</span>
            {project.version && <Badge variant="outline" className="border-fire/30 text-fire bg-fire/5 ml-auto">{project.version}</Badge>}
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6 md:gap-10">
          <div className="lg:col-span-2 space-y-8 min-w-0 w-full">
            {/* GALLERY with swipe + arrows + counter — locked aspect, never overflows */}
            <div className="relative w-full max-w-full rounded-lg overflow-hidden border border-border shadow-card bg-muted" {...swipe}>
              <div className="relative w-full aspect-[16/10] bg-muted overflow-hidden">
                <AnimatePresence mode="wait">
                  <motion.img key={activeImg}
                    initial={{ opacity: 0, scale: 1.03, filter: 'blur(8px)' }}
                    animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
                    exit={{ opacity: 0, filter: 'blur(6px)' }}
                    transition={{ duration: 0.45, ease: [0.2, 0.8, 0.2, 1] }}
                    src={images[activeImg] || '/placeholder.svg'} alt={`${project.title} screenshot ${activeImg + 1}`}
                    loading="lazy" decoding="async"
                    className="absolute inset-0 w-full h-full object-contain select-none" draggable={false} />
                </AnimatePresence>
              </div>
              <Button variant="secondary" size="icon" aria-label="Expand gallery" title="Expand gallery" className="absolute right-3 top-3 z-10" onClick={() => setGalleryOpen(true)}><Maximize2 className="h-4 w-4" /></Button>
              {images.length > 1 && (
                <>
                  <button onClick={galleryPrev} aria-label="Previous image"
                    className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/40 backdrop-blur text-white grid place-items-center hover:bg-black/60 transition z-10">
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <button onClick={galleryNext} aria-label="Next image"
                    className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/40 backdrop-blur text-white grid place-items-center hover:bg-black/60 transition z-10">
                    <ChevronRight className="h-5 w-5" />
                  </button>
                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/50 backdrop-blur text-white text-[11px] font-bold z-10">
                    {activeImg + 1} / {images.length}
                  </div>
                </>
              )}
            </div>

            {images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-2 -mx-2 px-2 snap-x snap-mandatory max-w-full">
                {images.map((src, i) => (
                  <button key={i} onClick={() => setActiveImg(i)} aria-label={`View image ${i + 1}`}
                    className={`flex-shrink-0 snap-start w-20 sm:w-24 md:w-28 aspect-video rounded-lg overflow-hidden border-2 transition ${activeImg === i ? 'border-fire scale-[1.02]' : 'border-border opacity-70 hover:opacity-100'}`}>
                    <img src={src!} alt="" loading="lazy" decoding="async" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}

            {project.video_url && (
              <div className="aspect-video rounded-2xl overflow-hidden border border-border bg-black">
                <iframe src={toEmbed(project.video_url)} className="w-full h-full" allowFullScreen
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" title="Project Video" />
              </div>
            )}

            {/* DESKTOP TITLE BLOCK */}
            <div className="hidden md:block">
              <h1 className="font-display text-3xl lg:text-4xl font-extrabold text-ink leading-tight">{project.title}</h1>
              <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
                {ratingStars(avgRating, 'h-4 w-4')}
                <span className="font-semibold text-ink">{avgRating.toFixed(1)}</span>
                <span className="inline-flex items-center gap-1"><Eye className="h-4 w-4" />{(project as any).views_count || 0}</span>
                {project.version && <Badge variant="outline" className="border-fire/30 text-fire bg-fire/5">{project.version}</Badge>}
              </div>
            </div>

            {/* ACCORDIONS — premium info layout */}
            <Accordion type="multiple" defaultValue={['about', 'stack']} className="rounded-2xl border border-border bg-white shadow-card divide-y divide-border overflow-hidden">
              <AccordionItem value="about" className="border-0">
                <AccordionTrigger className="px-5 py-4 hover:no-underline">
                  <span className="font-display font-bold text-base text-ink">About this project</span>
                </AccordionTrigger>
                <AccordionContent className="px-5 pb-5">
                  <SafeDescription value={project.full_desc || project.short_desc} />
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="stack" className="border-0">
                <AccordionTrigger className="px-5 py-4 hover:no-underline">
                  <span className="font-display font-bold text-base text-ink flex items-center gap-2"><Code2 className="h-4 w-4 text-fire" />Tech stack</span>
                </AccordionTrigger>
                <AccordionContent className="px-5 pb-5">
                  <div className="flex flex-wrap gap-2">
                    {project.tech_stack?.map((tag: string) => {
                      const icon = techIcon(tag);
                      return (
                        <div key={tag} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-border bg-warm-bg/40 text-sm">
                          {icon && <img src={icon} alt={tag} className="w-4 h-4" loading="lazy" onError={e => ((e.currentTarget as HTMLImageElement).style.display = 'none')} />}
                          <span className="font-semibold text-ink">{tag}</span>
                        </div>
                      );
                    })}
                  </div>
                  {project.category?.length > 0 && (
                    <div className="mt-4">
                      <p className="text-[11px] uppercase tracking-widest font-bold text-muted-foreground mb-2">Categories</p>
                      <div className="flex flex-wrap gap-2">
                        {project.category.map((cat: string) => (
                          <Badge key={cat} className="bg-fire/10 text-fire border-0 hover:bg-fire/20">{cat}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="included" className="border-0">
                <AccordionTrigger className="px-5 py-4 hover:no-underline">
                  <span className="font-display font-bold text-base text-ink">What's included</span>
                </AccordionTrigger>
                <AccordionContent className="px-5 pb-5">
                  <ul className="text-sm text-muted-foreground space-y-2">
                    <li className="flex gap-2"><ShieldCheck className="h-4 w-4 text-green-600 mt-0.5" /> Full source code, commented & production-ready</li>
                    <li className="flex gap-2"><ShieldCheck className="h-4 w-4 text-green-600 mt-0.5" /> Setup & deployment instructions</li>
                    <li className="flex gap-2"><ShieldCheck className="h-4 w-4 text-green-600 mt-0.5" /> 30-day support for setup questions</li>
                    <li className="flex gap-2"><ShieldCheck className="h-4 w-4 text-green-600 mt-0.5" /> Free version updates included</li>
                  </ul>
                </AccordionContent>
              </AccordionItem>

              {(purchased || isAdmin) && (
                <AccordionItem value="creds" className="border-0">
                  <AccordionTrigger className="px-5 py-4 hover:no-underline">
                    <span className="font-display font-bold text-base text-ink flex items-center gap-2"><KeyRound className="h-4 w-4 text-fire" />Demo admin login</span>
                  </AccordionTrigger>
                  <AccordionContent className="px-5 pb-5">
                    <div className="grid sm:grid-cols-2 gap-2">
                      {(project as any).demo_admin_email && (
                        <CredRow label="Email" value={(project as any).demo_admin_email} onCopy={(v) => { navigator.clipboard.writeText(v); toast({ title: 'Email copied' }); }} />
                      )}
                      {(project as any).demo_admin_password && (
                        <CredRow label="Password" value={(project as any).demo_admin_password} onCopy={(v) => { navigator.clipboard.writeText(v); toast({ title: 'Password copied' }); }} />
                      )}
                      {project.preview_url && (project as any).preview_enabled !== false && (
                        <CredRow label="Admin URL" value={`${project.preview_url.replace(/\/$/, '')}/admin`} onCopy={(v) => { navigator.clipboard.writeText(v); toast({ title: 'Admin link copied' }); }} />
                      )}
                      <CredRow label="Project URL" value={`${window.location.origin}/p/${project.slug || project.id}`} onCopy={(v) => { navigator.clipboard.writeText(v); toast({ title: 'Project link copied' }); }} />
                    </div>
                    {!(project as any).demo_admin_email && !(project as any).demo_admin_password && (
                      <p className="text-xs text-muted-foreground mt-3">No demo admin credentials are configured for this project.</p>
                    )}
                  </AccordionContent>
                </AccordionItem>
              )}

              {changelog.length > 0 && (
                <AccordionItem value="changelog" className="border-0">
                  <AccordionTrigger className="px-5 py-4 hover:no-underline">
                    <span className="font-display font-bold text-base text-ink flex items-center gap-2"><History className="h-4 w-4 text-fire" />Changelog</span>
                  </AccordionTrigger>
                  <AccordionContent className="px-5 pb-5 space-y-3">
                    <Select value={selectedVersion} onValueChange={setSelectedVersion}>
                      <SelectTrigger aria-label="Changelog version" className="w-48 h-11 border-primary/30 bg-primary/10 text-primary font-semibold"><History className="h-4 w-4" /><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {changelog.map(c => <SelectItem key={c.version} value={c.version}>{c.version}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    {(!user || !purchased) ? (
                      <div className="text-sm text-muted-foreground bg-warm-bg/60 rounded-lg p-4 flex items-center gap-2">
                        <Lock className="h-4 w-4 text-fire" /> Sign in &amp; purchase to view full version history.
                      </div>
                    ) : activeChange ? (
                      <div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                          <Badge variant="outline" className="border-fire/30 text-fire bg-fire/5">{activeChange.version}</Badge>
                          {activeChange.date && <span>· {activeChange.date}</span>}
                        </div>
                        <pre className="whitespace-pre-wrap text-sm text-ink/80 font-sans leading-relaxed">{activeChange.notes}</pre>
                      </div>
                    ) : null}
                  </AccordionContent>
                </AccordionItem>
              )}

              <AccordionItem value="reviews" className="border-0">
                <AccordionTrigger className="px-5 py-4 hover:no-underline">
                  <span className="font-display font-bold text-base text-ink flex items-center gap-2"><MessageCircle className="h-4 w-4 text-fire" />Reviews ({comments?.length || 0})</span>
                </AccordionTrigger>
                <AccordionContent className="px-5 pb-5">
                  {user ? (
                    <div className="mb-5 space-y-2">
                      <div className="flex items-center gap-1">
                        {[1,2,3,4,5].map(i => (
                          <button key={i} onClick={() => setRating(i)} aria-label={`${i} star`}>
                            <Star className={`h-5 w-5 ${i <= rating ? 'text-sun fill-sun' : 'text-border'}`} />
                          </button>
                        ))}
                      </div>
                      <Textarea value={commentText} onChange={e => setCommentText(e.target.value)} placeholder="Share what you think…" className="bg-warm-bg border-border" rows={3} />
                      <Button onClick={submitComment} className="gradient-fire-strong text-white">
                        <Send className="h-4 w-4 mr-2" /> Post review
                      </Button>
                    </div>
                  ) : (
                    <button onClick={() => setShowAuthModal(true, 'Sign in to leave a review.')} className="w-full text-sm text-muted-foreground bg-warm-bg/60 rounded-lg p-3 hover:bg-warm-bg transition mb-4">
                      Sign in to leave a review
                    </button>
                  )}

                  <div className="space-y-4">
                    {(comments || []).map((c: any) => (
                      <div key={c.id} className="border-t border-border pt-4 first:border-0 first:pt-0">
                        <div className="flex items-center gap-3 mb-2">
                          <img src={c.profiles?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${c.user_id}`}
                            alt="" className="w-9 h-9 rounded-full border border-border bg-warm-bg" />
                          <div>
                            <p className="text-sm font-semibold text-ink">{c.profiles?.name || c.profiles?.email?.split('@')[0] || 'User'}</p>
                            <div className="flex items-center gap-1">
                              {ratingStars(c.rating || 0, 'h-3 w-3')}
                              <span className="text-[11px] text-muted-foreground ml-1">{new Date(c.created_at).toLocaleDateString()}</span>
                            </div>
                          </div>
                        </div>
                        <p className="text-sm text-ink/80 leading-relaxed">{c.content}</p>
                      </div>
                    ))}
                    {(!comments || comments.length === 0) && (
                      <p className="text-sm text-muted-foreground text-center py-4">Be the first to review this project.</p>
                    )}
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>

            {/* Related projects — horizontal snap carousel */}
            {related && related.length > 0 && (
              <div>
                <div className="flex items-end justify-between mb-3">
                  <h3 className="font-display font-bold text-lg text-ink">You might also like</h3>
                  <Link to="/marketplace" className="text-xs font-bold uppercase tracking-widest text-fire hover:underline">See all</Link>
                </div>
                <div className="flex gap-4 overflow-x-auto pb-4 -mx-2 px-2 snap-x snap-mandatory">
                  {related.map((p: any) => (
                    <Link key={p.id} to={p.slug ? `/p/${p.slug}` : `/project/${p.id}`}
                      className="flex-shrink-0 w-[240px] snap-start rounded-2xl border border-border bg-white shadow-card overflow-hidden hover:border-fire/40 hover:shadow-card-hover transition">
                      <div className="aspect-video bg-warm-bg overflow-hidden">
                        <img src={p.thumbnail_url || '/placeholder.svg'} alt={p.title} className="w-full h-full object-cover" loading="lazy" />
                      </div>
                      <div className="p-3">
                        <p className="font-semibold text-sm text-ink truncate">{p.title}</p>
                        <p className="text-xs text-fire font-bold mt-1">{p.price === 0 ? 'FREE' : `₹${p.price.toLocaleString('en-IN')}`}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* DESKTOP STICKY SIDEBAR */}
          <div className="space-y-6 hidden lg:block">
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
              className="bg-card rounded-lg p-6 sticky top-28 border border-border shadow-card">
              <p className="text-muted-foreground text-sm mb-4">{project.short_desc}</p>

              {purchased && (
                <div className="mb-4 px-3 py-2 rounded-lg bg-green-50 border border-green-200 text-green-700 text-xs font-semibold flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4" /> You own this project
                </div>
              )}

              <div className={`text-3xl font-display font-extrabold mb-6 ${isFree ? 'text-green-600' : 'text-fire'}`}>
                {isFree ? 'FREE' : `₹${(effectivePrice || 0).toLocaleString('en-IN')}`}
                {project.discount_price && project.discount_price < project.price && (
                  <span className="text-sm text-muted-foreground line-through ml-2">₹{project.price.toLocaleString('en-IN')}</span>
                )}
              </div>

              <div className="space-y-3 mb-6">
                {project.preview_url && ((project as any).preview_enabled !== false || isAdmin) && (
                  <Button variant="outline" className="w-full border-border" onClick={() => setPreviewUrl(project.preview_url)}>
                    <Eye className="h-4 w-4 mr-2" /> Live preview {(project as any).preview_enabled === false && <span className="ml-2 text-[10px] uppercase tracking-wider text-amber-600">(admin)</span>}
                  </Button>
                )}
                {!user ? (
                  <Button className="w-full gradient-fire-strong text-white hover:opacity-95 glow-fire"
                    onClick={handleBuy}>
                    <Lock className="h-4 w-4 mr-2" /> Sign in to {isFree ? 'download' : 'buy'}
                  </Button>
                ) : purchased ? (
                  <Button onClick={handleDownload} disabled={downloading} className="w-full bg-green-600 text-white hover:bg-green-700">
                    <Download className="h-4 w-4 mr-2" />{downloading ? 'Preparing…' : 'Download source code'}
                  </Button>
                ) : (
                  <Button className="w-full gradient-fire-strong text-white hover:opacity-95 glow-fire" onClick={handleBuy}>
                    <ShoppingCart className="h-4 w-4 mr-2" />{isFree ? 'Get free' : 'Buy now'}
                  </Button>
                )}
              </div>

              <div className="flex flex-wrap gap-2 text-xs text-muted-foreground border-t border-border pt-4">
                <span className="inline-flex items-center gap-1"><ShieldCheck className="h-3.5 w-3.5 text-green-600" />Secure</span>
                <span className="inline-flex items-center gap-1">Demo checkout</span>
                <span className="inline-flex items-center gap-1"><Download className="h-3.5 w-3.5 text-fire" />Instant download</span>
              </div>
              <p className="text-xs text-muted-foreground mt-3">✨ 30-day support included</p>
            </motion.div>

            {isAdmin && ((project as any).lov_email || (project as any).project_url) && (
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 shadow-sm">
                <p className="text-[10px] font-bold uppercase tracking-widest text-amber-700 mb-3">Admin only · internal links</p>
                <div className="space-y-2">
                  {(project as any).lov_email && (
                    <a href={`mailto:${(project as any).lov_email}`} className="flex items-center gap-2 text-sm text-ink hover:text-fire break-all">
                      <Mail className="h-4 w-4 text-fire shrink-0" /> {(project as any).lov_email}
                    </a>
                  )}
                  {(project as any).project_url && (
                    <a href={(project as any).project_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-ink hover:text-fire break-all">
                      <LinkIcon className="h-4 w-4 text-fire shrink-0" /> {(project as any).project_url}
                    </a>
                  )}
                  <p className="text-[10px] text-amber-700/80 pt-1">
                    Public "Go to project" button: {(project as any).external_url_enabled ? '✅ visible to buyers' : '🚫 hidden (admin-only)'}
                  </p>
                </div>
              </div>
            )}

            {(project as any).project_url && (project as any).external_url_enabled && purchased && (
              <a href={(project as any).project_url} target="_blank" rel="noopener noreferrer"
                className="block w-full text-center rounded-xl border border-fire/30 bg-fire/5 hover:bg-fire/10 text-fire font-semibold text-sm px-4 py-3 transition">
                ↗ Go to project link
              </a>
            )}
          </div>
        </div>
      </div>

      {/* MOBILE sticky CTA bar */}
      <AnimatePresence>
        {stickyVisible && (
          <motion.div
            initial={{ y: 80, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 80, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 320, damping: 30 }}
            className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-xl border-t border-border shadow-card-hover px-4 py-3"
            style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 0.75rem)' }}
          >
            <div className="flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-[11px] uppercase tracking-widest font-bold text-muted-foreground truncate">{project.title}</p>
                <p className={`font-display font-extrabold text-lg leading-none ${isFree ? 'text-green-600' : 'text-fire'}`}>
                  {isFree ? 'FREE' : `₹${(effectivePrice || 0).toLocaleString('en-IN')}`}
                </p>
              </div>
              {project.preview_url && ((project as any).preview_enabled !== false || isAdmin) && (
                <Button variant="outline" size="sm" className="rounded-full" onClick={() => setPreviewUrl(project.preview_url)} aria-label="Preview">
                  <Eye className="h-4 w-4" />
                </Button>
              )}
              {!user ? (
                <Button className="gradient-fire-strong text-white rounded-full px-5 min-h-11"
                  onClick={handleBuy}>
                  <Lock className="h-4 w-4 mr-1.5" /> Sign in
                </Button>
              ) : purchased ? (
                <Button onClick={handleDownload} disabled={downloading} className="bg-green-600 text-white hover:bg-green-700 rounded-full px-5 min-h-11">
                  <Download className="h-4 w-4 mr-1.5" /> {downloading ? '…' : 'Download'}
                </Button>
              ) : (
                <Button onClick={handleBuy} className="gradient-fire-strong text-white rounded-full px-5 min-h-11">
                  <ShoppingCart className="h-4 w-4 mr-1.5" /> {isFree ? 'Get free' : 'Buy now'}
                </Button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <Dialog open={galleryOpen} onOpenChange={setGalleryOpen}>
        <DialogContent className="max-w-5xl w-[calc(100%-32px)] p-4 bg-background">
          <DialogTitle className="pr-10">{project.title} · {activeImg + 1}/{images.length}</DialogTitle>
          <img src={images[activeImg] || '/placeholder.svg'} alt={`${project.title} enlarged screenshot`} className="w-full max-h-[70vh] object-contain" />
          <div className="flex items-center justify-between"><Button variant="outline" disabled={images.length < 2} onClick={galleryPrev}><ChevronLeft className="h-4 w-4" />Previous</Button><Button variant="outline" disabled={images.length < 2} onClick={galleryNext}>Next<ChevronRight className="h-4 w-4" /></Button></div>
        </DialogContent>
      </Dialog>
      <PreviewModal url={previewUrl} onClose={() => setPreviewUrl(null)}
        watermark={(project as any).preview_watermark || 'Bnoy Studios Preview'} title={project.title} />
      <Footer />
    </motion.div>
  );
}

function CredRow({ label, value, onCopy }: { label: string; value: string; onCopy: (v: string) => void }) {
  return (
    <div className="flex items-center gap-2 bg-warm-bg/60 border border-border rounded-lg px-3 py-2 min-w-0 max-w-full">
      <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground w-16 shrink-0">{label}</span>
      <code className="text-sm text-ink font-mono truncate flex-1 min-w-0">{value}</code>
      <button onClick={() => onCopy(value)} className="p-1.5 rounded hover:bg-fire/10 text-fire shrink-0 grid place-items-center" aria-label={`Copy ${label}`}>
        <Copy className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
