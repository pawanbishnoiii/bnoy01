import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Link } from '@/lib/router';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import { ArrowUpRight, Sparkles, Zap, ShieldCheck } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

/**
 * Bento-grid showcase inspired by 21st.dev cards.
 * Mixes real published projects with Lottie + SVG accents.
 */
export default function ProjectShowcase() {
  const { data: projects = [] } = useQuery({
    queryKey: ['showcase-projects'],
    queryFn: async () => {
      const { data } = await supabase
        .from('projects')
        .select('id,title,short_desc,thumbnail_url,price,tech_stack,featured')
        .eq('status', 'published')
        .order('featured', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(5);
      return data || [];
    },
  });

  if (projects.length === 0) return null;

  const [hero, ...rest] = projects;

  return (
    <section className="relative py-24 overflow-hidden bg-gradient-to-b from-warm-bg via-white to-warm-bg/40">
      {/* Decorative SVG blobs */}
      <svg className="absolute -top-10 -left-20 w-[420px] opacity-50 pointer-events-none" viewBox="0 0 200 200">
        <defs>
          <linearGradient id="g1" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="hsl(15 90% 60%)" stopOpacity="0.5" />
            <stop offset="100%" stopColor="hsl(40 95% 60%)" stopOpacity="0.1" />
          </linearGradient>
        </defs>
        <path fill="url(#g1)" d="M44.7,-58.6C57.6,-49.3,67.1,-34.2,71.7,-17.2C76.3,-0.2,76,18.7,67.6,32.6C59.2,46.6,42.7,55.6,25.6,61.4C8.5,67.3,-9.2,70,-25,65.2C-40.7,60.4,-54.5,48,-62.1,32.7C-69.7,17.4,-71.1,-0.7,-66.5,-17C-61.9,-33.3,-51.3,-47.7,-37.4,-57.2C-23.5,-66.7,-6.4,-71.3,8.7,-71.3C23.8,-71.4,31.7,-67.9,44.7,-58.6Z" transform="translate(100 100)" />
      </svg>

      <div className="container mx-auto px-4 relative">
        <div className="text-center mb-14">
          <span className="inline-flex items-center gap-2 text-[11px] font-bold tracking-[0.3em] text-fire uppercase mb-4">
            <Sparkles className="h-3.5 w-3.5" /> Featured Showcase
          </span>
          <h2 className="font-display text-4xl md:text-6xl font-extrabold text-ink leading-[1.05]">
            Built to <span className="gradient-text">launch</span>,
            <br className="hidden md:block" /> tuned to <span className="gradient-text">convert</span>.
          </h2>
          <p className="text-muted-foreground mt-4 max-w-xl mx-auto">
            Hand-picked builds — from production dashboards to mobile apps. Click any tile to dive in.
          </p>
        </div>

        <div className="grid lg:grid-cols-12 gap-5">
          {/* HERO TILE */}
          {hero && (
            <motion.div
              initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
              className="lg:col-span-7 lg:row-span-2 group relative rounded-3xl overflow-hidden border border-border shadow-card bg-white"
            >
              <Link to={`/project/${hero.id}`} className="block relative h-full">
                <div className="aspect-[16/10] overflow-hidden">
                  <img
                    src={hero.thumbnail_url || '/placeholder.svg'}
                    alt={hero.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-ink/90 via-ink/30 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-7 text-white">
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest bg-fire px-2.5 py-1 rounded-full">
                    <Zap className="h-3 w-3" /> Featured
                  </span>
                  <h3 className="font-display text-3xl md:text-4xl font-extrabold mt-3">{hero.title}</h3>
                  <p className="text-sm text-white/80 max-w-md mt-2 line-clamp-2">{hero.short_desc}</p>
                  <div className="flex items-center gap-3 mt-4 text-sm">
                    <span className="font-bold">{hero.price === 0 ? 'FREE' : `₹${hero.price.toLocaleString('en-IN')}`}</span>
                    <span className="inline-flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                      Explore <ArrowUpRight className="h-4 w-4" />
                    </span>
                  </div>
                </div>
              </Link>
            </motion.div>
          )}

          {/* LOTTIE BENTO */}
          <motion.div
            initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className="lg:col-span-5 rounded-3xl border border-border bg-gradient-to-br from-fire/10 via-sun/10 to-white p-6 shadow-card overflow-hidden relative"
          >
            <div className="absolute -bottom-8 -right-8 w-44 h-44 rounded-full bg-fire/10 blur-2xl" />
            <div className="flex items-start gap-4 relative">
              <div className="w-32 h-32 shrink-0">
                <DotLottieReact
                  src="https://lottie.host/b2f358e6-20fa-4646-8a8c-cb8d461d1f04/FqOqJH6vQN.lottie"
                  loop autoplay
                />
              </div>
              <div>
                <h3 className="font-display text-2xl font-extrabold text-ink">Production-ready code</h3>
                <p className="text-sm text-muted-foreground mt-1.5">Clean architecture, typed APIs, RLS — every project is shipped, not just designed.</p>
                <div className="flex flex-wrap gap-2 mt-3">
                  {['React', 'TypeScript', 'Tailwind', 'Supabase'].map((t) => (
                    <span key={t} className="text-[10px] px-2.5 py-1 rounded-full bg-white border border-border font-semibold text-ink/70">{t}</span>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>

          {/* SECONDARY TILES */}
          {rest.slice(0, 2).map((p, i) => (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
              className="lg:col-span-3 rounded-3xl overflow-hidden border border-border shadow-card bg-white group"
            >
              <Link to={`/project/${p.id}`}>
                <div className="aspect-[4/3] overflow-hidden">
                  <img src={p.thumbnail_url || '/placeholder.svg'} alt={p.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                </div>
                <div className="p-4">
                  <h4 className="font-display font-bold text-ink truncate group-hover:text-fire transition">{p.title}</h4>
                  <p className="text-xs text-muted-foreground line-clamp-2 mt-1">{p.short_desc}</p>
                  <p className="text-fire font-bold text-sm mt-2">{p.price === 0 ? 'FREE' : `₹${p.price.toLocaleString('en-IN')}`}</p>
                </div>
              </Link>
            </motion.div>
          ))}

          {/* TRUST TILE */}
          <motion.div
            initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className="lg:col-span-5 rounded-3xl border border-border bg-ink text-white p-7 shadow-card overflow-hidden relative"
          >
            <ShieldCheck className="absolute -bottom-4 -right-4 w-40 h-40 text-fire/20" />
            <span className="text-[11px] font-bold tracking-[0.3em] text-sun uppercase">Trusted by builders</span>
            <h3 className="font-display text-3xl font-extrabold mt-3">Ship in days, not months.</h3>
            <p className="text-sm text-white/70 mt-2 max-w-md">Skip the boilerplate. Every codebase comes with auth, payments, dashboards and CI ready out-of-the-box.</p>
            <Link to="/marketplace" className="inline-flex items-center gap-2 mt-5 px-5 py-2.5 rounded-full bg-fire hover:bg-fire/90 transition font-semibold text-sm">
              Browse marketplace <ArrowUpRight className="h-4 w-4" />
            </Link>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
