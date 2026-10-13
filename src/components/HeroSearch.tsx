import { useMemo, useState, useRef, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, TrendingUp, ArrowUpRight } from 'lucide-react';
import { useNavigate } from '@/lib/router';
import { supabase } from '@/integrations/supabase/client';

const TRENDING = ['SaaS', 'E-Commerce', 'Dashboard', 'Portfolio', 'React', 'App'];

export default function HeroSearch({ className = '' }: { className?: string }) {
  const navigate = useNavigate();
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);

  const { data: projects = [] } = useQuery({
    queryKey: ['hero-search-projects'],
    queryFn: async () =>
      (await supabase.from('projects').select('id,title,slug,category,tech_stack,price,thumbnail_url,downloads').eq('status', 'published').order('created_at', { ascending: false }).limit(60)).data || [],
    staleTime: 60_000,
  });

  useEffect(() => {
    const close = (e: MouseEvent) => { if (!boxRef.current?.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  const results = useMemo(() => {
    const term = q.trim().toLowerCase();
    const list = projects as any[];
    if (!term) return [...list].sort((a, b) => (b.downloads || 0) - (a.downloads || 0)).slice(0, 4);
    return list
      .map((p) => {
        const hay = [p.title, ...(p.category || []), ...(p.tech_stack || [])].join(' ').toLowerCase();
        const score = (p.title?.toLowerCase().startsWith(term) ? 3 : 0) + (p.title?.toLowerCase().includes(term) ? 2 : 0) + (hay.includes(term) ? 1 : 0);
        return { p, score };
      })
      .filter((x) => x.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 5)
      .map((x) => x.p);
  }, [q, projects]);

  const go = (term: string) => { setOpen(false); navigate(`/marketplace?q=${encodeURIComponent(term)}`); };

  return (
    <div ref={boxRef} className={`relative ${className}`}>
      <form onSubmit={(e) => { e.preventDefault(); if (q.trim()) go(q.trim()); }}
        className="flex items-center gap-2 rounded-2xl border border-border bg-background/90 px-3.5 py-2.5 shadow-lg backdrop-blur-md transition focus-within:border-primary/50 focus-within:shadow-primary/20">
        <Search className="h-4 w-4 shrink-0 text-primary" />
        <input value={q} onChange={(e) => { setQ(e.target.value); setOpen(true); }} onFocus={() => setOpen(true)}
          placeholder="Search SaaS, apps, dashboards…" aria-label="Search projects"
          className="min-w-0 flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground" />
        <button type="submit" className="shrink-0 rounded-xl bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground">Search</button>
      </form>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0, y: -6, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.18 }}
            className="absolute inset-x-0 top-full z-40 mt-2 overflow-hidden rounded-2xl border border-border bg-popover p-2 text-left shadow-2xl">
            <div className="flex flex-wrap gap-1.5 px-1.5 pb-2 pt-1">
              <span className="flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground"><TrendingUp className="h-3 w-3" />Trending</span>
              {TRENDING.map((t) => (
                <button key={t} type="button" onClick={() => go(t)} className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-foreground hover:bg-primary/10 hover:text-primary">{t}</button>
              ))}
            </div>
            <p className="px-2 pb-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{q ? 'Suggestions' : 'Recommended'}</p>
            {results.length === 0 ? (
              <p className="px-2 py-3 text-sm text-muted-foreground">No matches — press Search to browse all.</p>
            ) : results.map((p: any) => (
              <button key={p.id} type="button" onClick={() => { setOpen(false); navigate(p.slug ? `/p/${p.slug}` : `/project/${p.id}`); }}
                className="flex w-full items-center gap-3 rounded-xl p-2 text-left hover:bg-muted">
                <div className="h-10 w-14 shrink-0 overflow-hidden rounded-lg bg-muted">
                  {p.thumbnail_url && <img src={p.thumbnail_url} alt="" draggable={false} className="h-full w-full object-cover" />}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-foreground">{p.title}</p>
                  <p className="truncate text-xs text-muted-foreground">{(p.category || []).slice(0, 2).join(' · ') || 'Project'} · {p.price > 0 ? `₹${p.price}` : 'Free'}</p>
                </div>
                <ArrowUpRight className="h-4 w-4 shrink-0 text-muted-foreground" />
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
