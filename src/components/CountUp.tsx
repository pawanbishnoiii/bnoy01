import { useEffect, useRef, useState } from 'react';
import { prefersReducedMotion } from '@/hooks/usePrefersReducedMotion';

interface Props { end: number; duration?: number; suffix?: string; prefix?: string; className?: string; }

/** IntersectionObserver-triggered count-up. Static for reduced-motion. */
export default function CountUp({ end, duration = 1600, suffix = '', prefix = '', className }: Props) {
  const ref = useRef<HTMLSpanElement>(null);
  const [value, setValue] = useState(prefersReducedMotion() ? end : 0);
  const started = useRef(prefersReducedMotion());

  useEffect(() => {
    if (started.current || !ref.current) return;
    const io = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting || started.current) return;
      started.current = true;
      const start = performance.now();
      const tick = (now: number) => {
        const p = Math.min(1, (now - start) / duration);
        const eased = 1 - Math.pow(1 - p, 3);
        setValue(Math.round(end * eased));
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    }, { threshold: 0.4 });
    io.observe(ref.current);
    return () => io.disconnect();
  }, [end, duration]);

  return <span ref={ref} className={className}>{prefix}{value.toLocaleString()}{suffix}</span>;
}
