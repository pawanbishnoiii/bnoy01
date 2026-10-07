import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';

const DotLottieReact = lazy(() =>
  import('@lottiefiles/dotlottie-react').then((m) => ({ default: m.DotLottieReact }))
);

interface LottieAnimationProps {
  src: string;
  loop?: boolean;
  autoplay?: boolean;
  className?: string;
  /** Pause animation when scrolled off-screen for perf. Defaults to true. */
  lazyPlay?: boolean;
  /** Static fallback (img/svg) shown for reduced-motion users. */
  fallback?: React.ReactNode;
}

/** Reusable, reduced-motion-aware, viewport-lazy Lottie player. */
export default function LottieAnimation({
  src,
  loop = true,
  autoplay = true,
  className,
  lazyPlay = true,
  fallback,
}: LottieAnimationProps) {
  const reduced = usePrefersReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(!lazyPlay);

  useEffect(() => {
    if (!lazyPlay || !ref.current || reduced) return;
    const io = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting),
      { rootMargin: '120px' }
    );
    io.observe(ref.current);
    return () => io.disconnect();
  }, [lazyPlay, reduced]);

  if (reduced) {
    return (
      <div ref={ref} className={className} aria-hidden="true">
        {fallback}
      </div>
    );
  }

  return (
    <div ref={ref} className={className} aria-hidden="true">
      {inView && (
        <Suspense fallback={<div className="w-full h-full" />}>
          <DotLottieReact src={src} loop={loop} autoplay={autoplay} />
        </Suspense>
      )}
    </div>
  );
}
