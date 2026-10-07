import LottieAnimation from '@/components/ui/lottie-animation';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';

const DEFAULT_LOADER = 'https://lottie.host/4f0e85a6-8e07-4f0a-a8a5-5b9f3e1d1d2c/0jzPe5R0Yt.lottie';

interface Props {
  size?: number;
  label?: string;
  className?: string;
  src?: string;
}

/** Drop-in replacement for spinners: viewport-lazy, reduced-motion friendly. */
export default function LottieLoader({ size = 96, label, className, src = DEFAULT_LOADER }: Props) {
  const reduced = usePrefersReducedMotion();
  return (
    <div className={`flex flex-col items-center justify-center gap-2 ${className || ''}`} role="status" aria-live="polite">
      {reduced ? (
        <div className="rounded-full border-2 border-fire border-t-transparent animate-spin" style={{ width: size * 0.4, height: size * 0.4 }} />
      ) : (
        <LottieAnimation
          src={src}
          loop
          autoplay
          lazyPlay={false}
          className="pointer-events-none"
          fallback={<div className="rounded-full border-2 border-fire border-t-transparent animate-spin" style={{ width: size * 0.4, height: size * 0.4 }} />}
        />
      )}
      {label && <span className="text-xs text-muted-foreground font-medium">{label}</span>}
      <span className="sr-only">Loading</span>
    </div>
  );
}
