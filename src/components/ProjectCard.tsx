import { useState } from 'react';
import { motion } from 'framer-motion';
import { Eye, ShoppingCart, Lock, ImageOff } from 'lucide-react';
import { prefersReducedMotion } from '@/hooks/usePrefersReducedMotion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuthStore } from '@/store/authStore';
import { Link, useNavigate } from '@/lib/router';

interface ProjectCardProps {
  project: {
    id: string; title: string; short_desc: string; price: number;
    thumbnail_url: string | null; tech_stack: string[]; category: string[]; preview_url: string | null;
    views_count?: number; likes_count?: number; slug?: string | null;
  };
  onPreview?: (url: string) => void;
  onBuy?: (project: any) => void;
  index?: number;
}

export default function ProjectCard({ project, onPreview, onBuy, index = 0 }: ProjectCardProps) {
  const navigate = useNavigate();
  const { user, setShowAuthModal } = useAuthStore();
  const isFree = project.price === 0;
  const views = project.views_count ?? 0;

  const handleBuy = () => { navigate(`/checkout/${project.id}`); };

  const reduced = prefersReducedMotion();
  // Cap stagger delay so off-screen rows never wait minutes to appear; cards above the fold animate fast.
  const delay = reduced ? 0 : Math.min(index, 5) * 0.05;
  return (
    <motion.div
      data-magnetic
      initial={reduced ? false : { opacity: 0, y: 40 }}
      whileInView={reduced ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15, margin: '0px 0px -80px 0px' }}
      transition={{ delay, duration: 0.5, ease: [0.2, 0.8, 0.2, 1] }}
      whileHover={reduced ? undefined : { y: -6, rotateX: 2, rotateY: -2 }}
      style={{ contain: 'content', willChange: 'transform', transformStyle: 'preserve-3d', perspective: 800 }}
      className="group bg-white rounded-2xl overflow-hidden border border-border shadow-card card-hover flex flex-col"
    >
      <Link to={project.slug ? `/p/${project.slug}` : `/project/${project.id}`} className="relative aspect-[16/10] overflow-hidden bg-gradient-to-br from-fire/15 to-sun/20 block rounded-t-2xl">
        <ThumbWithFallback src={project.thumbnail_url} alt={project.title} />

        <div className="absolute top-3 right-3">
          {isFree ? (
            <Badge className="bg-green-500 text-white border-0 shadow-card">FREE</Badge>
          ) : (
            <Badge className="gradient-fire-strong text-white border-0 shadow-card">₹{project.price.toLocaleString('en-IN')}</Badge>
          )}
        </div>
      </Link>

      <div className="p-5 flex-1 flex flex-col">
        <Link to={project.slug ? `/p/${project.slug}` : `/project/${project.id}`}>
          <h3 className="font-display text-base font-bold text-ink hover:text-fire transition-colors">{project.title}</h3>
        </Link>
        <p className="text-[13px] text-muted-foreground line-clamp-2 mt-1 mb-3 flex-1">{project.short_desc}</p>

        <div className="flex items-center justify-between mb-3">
          <div className="flex flex-wrap gap-1.5">
            {project.tech_stack?.slice(0, 2).map((tag) => (
              <span key={tag} className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-muted border border-border text-ink/70">{tag}</span>
            ))}
          </div>
          <span className="text-[11px] text-muted-foreground">👁 {views.toLocaleString()}</span>
        </div>

        <div className="flex gap-2">
          {project.preview_url && (
            <Button variant="outline" size="sm" className="flex-1 border-border" onClick={() => onPreview?.(project.preview_url!)}>
              <Eye className="h-4 w-4 mr-1" /> Preview
            </Button>
          )}
          <Button size="sm" className="flex-1 gradient-fire-strong text-white hover:opacity-95" onClick={handleBuy}>
            {!user ? <Lock className="h-4 w-4 mr-1" /> : <ShoppingCart className="h-4 w-4 mr-1" />}
            {isFree ? 'Get Free' : 'Buy Now'}
          </Button>
        </div>
      </div>
    </motion.div>
  );
}

function ThumbWithFallback({ src, alt }: { src: string | null; alt: string }) {
  const [loaded, setLoaded] = useState(false);
  const [errored, setErrored] = useState(false);
  if (!src || errored) {
    return (
      <div className="w-full h-full gradient-fire flex flex-col items-center justify-center text-white/80 gap-1">
        <ImageOff className="h-6 w-6" />
        <span className="text-[10px] font-bold uppercase tracking-widest">No preview</span>
      </div>
    );
  }
  return (
    <>
      {!loaded && <div className="absolute inset-0 animate-pulse bg-muted" />}
      <img src={src} alt={alt} loading="lazy"
        onLoad={() => setLoaded(true)}
        onError={() => setErrored(true)}
        className={`w-full h-full object-cover transition-all duration-500 group-hover:scale-105 ${loaded ? 'opacity-100' : 'opacity-0'}`} />
    </>
  );
}
