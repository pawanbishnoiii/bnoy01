import { useNavigate } from '@/lib/router';
import { useState, useRef, useMemo } from 'react';
import { motion, useInView, AnimatePresence } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import ProjectCard from '@/components/ProjectCard';
import PreviewModal from '@/components/PreviewModal';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuthStore } from '@/store/authStore';
import { useToast } from '@/hooks/use-toast';
import { celebrate } from '@/lib/celebrate';
import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';

const BUILT_IN = ['All', 'Free', 'Paid', 'React', 'Next.js', 'App', 'SaaS', 'E-Commerce', 'Portfolio', 'Dashboard'];

interface FeaturedProductsProps {
  limit?: number;
  showFilters?: boolean;
}

export default function FeaturedProducts({ limit, showFilters = true }: FeaturedProductsProps) {
  const navigate = useNavigate();
  const [category, setCategory] = useState('All');
  const [search, setSearch] = useState('');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-50px' });
  const { user, setShowAuthModal } = useAuthStore();
  const { toast } = useToast();

  const { data: projects, isLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('projects').select('*').eq('status', 'published')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  // Admin-managed categories table
  const { data: dbCats } = useQuery({
    queryKey: ['categories-list'],
    queryFn: async () => (await supabase.from('categories').select('name').order('name')).data?.map((c: any) => c.name) || [],
  });

  // Merge built-in + admin-defined + categories actually used by projects (deduped, ordered)
  const categories = useMemo(() => {
    const usedCats = new Set<string>();
    (projects || []).forEach((p: any) => {
      (p.category || []).forEach((c: string) => usedCats.add(c));
      (p.tech_stack || []).forEach((c: string) => usedCats.add(c));
    });
    const extras = [...(dbCats || []), ...Array.from(usedCats)].filter(c => !BUILT_IN.includes(c));
    return [...BUILT_IN, ...Array.from(new Set(extras))];
  }, [projects, dbCats]);

  const matchesCat = (p: any, cat: string) => {
    if (cat === 'All') return true;
    if (cat === 'Free') return Number(p.price) === 0;
    if (cat === 'Paid') return Number(p.price) > 0;
    return p.category?.includes(cat) || p.tech_stack?.includes(cat);
  };
  const term = search.trim().toLowerCase();
  const matchesText = (p: any) => !term || [p.title, p.short_desc, ...(p.category || []), ...(p.tech_stack || [])].filter(Boolean).join(' ').toLowerCase().includes(term);
  const searched = (projects || []).filter(matchesText);
  const counts = useMemo(() => Object.fromEntries(categories.map(c => [c, searched.filter(p => matchesCat(p, c)).length])), [categories, searched]);
  const visibleCats = categories.filter(c => c === 'All' || c === category || counts[c] > 0);
  const filtered = searched.filter(p => matchesCat(p, category));

  const displayed = limit ? filtered?.slice(0, limit) : filtered;

  const handleBuy = async (project: any) => { navigate(`/checkout/${project.id}`); };

  return (
    <section ref={ref} className="py-20 bg-white">
      <div className="container mx-auto px-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={inView ? { opacity: 1, y: 0 } : {}} className="text-center mb-10">
          <h2 className="font-display text-3xl md:text-5xl font-extrabold text-ink">
            Featured <span className="gradient-text">projects</span>
          </h2>
          <p className="text-muted-foreground mt-3">Handcrafted, production-ready web projects.</p>
        </motion.div>

        {showFilters && (
          <>
          <div className="mx-auto mb-5 max-w-xl">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name or technology…" aria-label="Search projects" className="h-12 rounded-full pl-11 pr-11 shadow-card" />
              {search && <button type="button" aria-label="Clear search" onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1.5 text-muted-foreground hover:bg-muted"><X className="h-4 w-4" /></button>}
            </div>
            <p className="mt-2 text-center text-xs text-muted-foreground">{filtered.length} project{filtered.length === 1 ? '' : 's'} found</p>
          </div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.1 }}
            className="-mx-4 mb-10 flex gap-2 overflow-x-auto px-4 pb-1 no-scrollbar sm:mx-0 sm:flex-wrap sm:justify-center sm:px-0"
          >
            {visibleCats.map((cat) => {
              const active = category === cat;
              return (
                <Button
                  key={cat}
                  variant={active ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setCategory(cat)}
                  className={`relative shrink-0 rounded-full transition-all ${active ? 'gradient-fire-strong text-primary-foreground border-0 shadow-card' : 'border-border bg-background text-foreground hover:text-primary hover:border-primary/40'}`}
                >
                  {cat}<span className={`ml-1.5 rounded-full px-1.5 text-[10px] ${active ? 'bg-background/25' : 'bg-muted'}`}>{counts[cat] ?? 0}</span>
                </Button>
              );
            })}
          </motion.div>
          </>
        )}

        {isLoading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="rounded-2xl overflow-hidden border border-border">
                <Skeleton className="aspect-video" />
                <div className="p-5 space-y-3">
                  <Skeleton className="h-5 w-3/4" /><Skeleton className="h-4 w-full" /><Skeleton className="h-8 w-full" />
                </div>
              </div>
            ))}
          </div>
        ) : displayed && displayed.length > 0 ? (
          <AnimatePresence mode="popLayout">
            <motion.div key={category + term} className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              {displayed.map((project, i) => (
                <ProjectCard key={project.id} project={project as any} index={i} onPreview={setPreviewUrl} onBuy={handleBuy} />
              ))}
            </motion.div>
          </AnimatePresence>
        ) : (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-20">
            <p className="text-muted-foreground text-lg">No projects match{term ? <> “<span className="font-bold text-primary">{search}</span>”</> : null} in <span className="font-bold text-primary">{category}</span>.</p>
            <Button variant="outline" className="mt-4" onClick={() => { setCategory('All'); setSearch(''); }}>Show all projects</Button>
          </motion.div>
        )}
      </div>

      <PreviewModal url={previewUrl} onClose={() => setPreviewUrl(null)} />
    </section>
  );
}
