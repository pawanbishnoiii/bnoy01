import { motion, AnimatePresence } from 'framer-motion';
import { X, Monitor, Tablet, Smartphone, RefreshCw, Plus } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import LottieLoader from '@/components/ui/lottie-loader';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';

interface PreviewModalProps {
  url: string | null;
  onClose: () => void;
  watermark?: string | null;
  title?: string;
}

type Device = 'desktop' | 'tablet' | 'mobile';
const SIZES: Record<Device, { w: number; h: number; label: string }> = {
  desktop: { w: 0, h: 0, label: 'Full width' },
  tablet: { w: 834, h: 1180, label: '834×1180' },
  mobile: { w: 390, h: 844, label: '390×844' },
};

/**
 * Fullscreen-first live preview. No chrome bar — a single floating icon menu
 * expands into device switching, reload and exit actions.
 */
export default function PreviewModal({ url, onClose, watermark, title }: PreviewModalProps) {
  const reduced = usePrefersReducedMotion();
  const [loading, setLoading] = useState(true);
  const [device, setDevice] = useState<Device>('desktop');
  const [reloadKey, setReloadKey] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const shellRef = useRef<HTMLDivElement>(null);

  const { data: settings } = useQuery({
    queryKey: ['site-settings'],
    queryFn: async () => (await supabase.from('site_settings').select('*').limit(1).maybeSingle()).data,
  });
  const hideWatermarks = (settings as any)?.hide_watermarks === true;

  // Lock page scroll + Esc to exit while the fullscreen preview is open.
  useEffect(() => {
    if (!url) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => { document.body.style.overflow = prev; window.removeEventListener('keydown', onKey); };
  }, [url, onClose]);

  // Try native fullscreen for a truly immersive preview (best-effort).
  useEffect(() => {
    if (!url || !shellRef.current) return;
    shellRef.current.requestFullscreen?.().catch(() => {});
    return () => { if (document.fullscreenElement) document.exitFullscreen?.().catch(() => {}); };
  }, [url]);

  if (!url) return null;
  const size = SIZES[device];
  const isFull = device === 'desktop';

  const frameStyle = isFull
    ? { width: '100%', height: '100%' }
    : {
        width: Math.min(size.w, typeof window !== 'undefined' ? window.innerWidth - 32 : size.w),
        height: Math.min(size.h, typeof window !== 'undefined' ? window.innerHeight - 48 : size.h),
      };

  const actions: { key: string; icon: typeof Monitor; label: string; active?: boolean; onClick: () => void }[] = [
    { key: 'desktop', icon: Monitor, label: 'Desktop', active: device === 'desktop', onClick: () => setDevice('desktop') },
    { key: 'tablet', icon: Tablet, label: 'Tablet', active: device === 'tablet', onClick: () => setDevice('tablet') },
    { key: 'mobile', icon: Smartphone, label: 'Mobile', active: device === 'mobile', onClick: () => setDevice('mobile') },
    { key: 'reload', icon: RefreshCw, label: 'Reload', onClick: () => { setLoading(true); setReloadKey((k) => k + 1); } },
    { key: 'exit', icon: X, label: 'Exit preview', onClick: onClose },
  ];

  return (
    <AnimatePresence>
      <motion.div
        ref={shellRef}
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        transition={{ duration: reduced ? 0 : 0.25 }}
        className="fixed inset-0 z-[100] bg-ink flex items-center justify-center overflow-hidden"
      >
        <div
          className="relative bg-white overflow-hidden transition-[width,height] duration-300 ease-out max-w-full max-h-full"
          style={{ ...frameStyle, borderRadius: isFull ? 0 : 24 }}
        >
          {loading && (
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 bg-white">
              <LottieLoader size={72} />
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-muted-foreground">Loading preview</p>
            </div>
          )}
          <iframe
            key={`${reloadKey}-${device}`}
            src={url}
            className="w-full h-full border-0 block"
            onLoad={() => setLoading(false)}
            title={title || 'Project preview'}
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
          />
          {watermark && !hideWatermarks && (
            <>
              <div className="absolute top-0 left-0 right-0 z-20 pointer-events-none flex items-center justify-center py-2 px-3 bg-gradient-to-b from-ink/85 to-transparent">
                <span className="text-[11px] font-bold tracking-[0.25em] uppercase text-white/90">{watermark}</span>
              </div>
              <div className="absolute inset-0 z-10 pointer-events-none flex items-center justify-center overflow-hidden">
                <span className="text-iris/10 text-[80px] md:text-[150px] font-display font-extrabold uppercase tracking-widest rotate-[-25deg] select-none">{watermark}</span>
              </div>
            </>
          )}
        </div>

        {/* Floating icon-only menu */}
        <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-30 flex flex-col items-center gap-2">
          <AnimatePresence>
            {menuOpen && (
              <motion.div
                initial={reduced ? undefined : { opacity: 0, y: 12, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={reduced ? undefined : { opacity: 0, y: 12, scale: 0.9 }}
                transition={{ type: 'spring', stiffness: 420, damping: 30 }}
                className="flex items-center gap-1 p-1.5 rounded-full bg-white/95 backdrop-blur border border-border shadow-card-hover"
              >
                {actions.map((a, i) => (
                  <motion.button
                    key={a.key}
                    initial={reduced ? undefined : { opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: reduced ? 0 : i * 0.04 }}
                    onClick={a.onClick}
                    aria-label={a.label}
                    title={a.label}
                    className={`h-10 w-10 rounded-full flex items-center justify-center transition ${
                      a.active
                        ? 'gradient-iris text-white shadow'
                        : a.key === 'exit'
                          ? 'text-destructive hover:bg-destructive/10'
                          : 'text-muted-foreground hover:text-ink hover:bg-muted'
                    }`}
                  >
                    <a.icon className="h-4 w-4" />
                  </motion.button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          <motion.button
            onClick={() => setMenuOpen((o) => !o)}
            whileTap={reduced ? undefined : { scale: 0.92 }}
            aria-label={menuOpen ? 'Close preview menu' : 'Open preview menu'}
            className="h-12 w-12 rounded-full gradient-iris text-white glow-iris flex items-center justify-center shadow-card-hover"
          >
            <motion.span animate={{ rotate: menuOpen ? 135 : 0 }} transition={{ type: 'spring', stiffness: 400, damping: 26 }}>
              <Plus className="h-5 w-5" />
            </motion.span>
          </motion.button>
        </div>

        {/* Device size hint */}
        {!isFull && (
          <span className="absolute top-4 left-1/2 -translate-x-1/2 z-30 text-[11px] font-semibold tracking-widest uppercase text-white/60">
            {size.label}
          </span>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
