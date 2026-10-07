import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { prefersReducedMotion } from '@/hooks/usePrefersReducedMotion';

/** Soft-lag custom cursor that grows when hovering interactive elements. */
export default function MagneticCursor() {
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (prefersReducedMotion()) return;
    // Skip on touch devices — they don't have a hover cursor.
    if (window.matchMedia('(pointer: coarse)').matches) return;

    const dot = dotRef.current!;
    const ring = ringRef.current!;
    dot.style.opacity = '1';
    ring.style.opacity = '1';

    const xToDot = gsap.quickTo(dot, 'x', { duration: 0.12, ease: 'power3.out' });
    const yToDot = gsap.quickTo(dot, 'y', { duration: 0.12, ease: 'power3.out' });
    const xToRing = gsap.quickTo(ring, 'x', { duration: 0.45, ease: 'power3.out' });
    const yToRing = gsap.quickTo(ring, 'y', { duration: 0.45, ease: 'power3.out' });

    const onMove = (e: MouseEvent) => {
      xToDot(e.clientX); yToDot(e.clientY);
      xToRing(e.clientX); yToRing(e.clientY);
    };
    const onEnter = () => gsap.to(ring, { scale: 2, opacity: 0.7, duration: 0.25 });
    const onLeave = () => gsap.to(ring, { scale: 1, opacity: 1, duration: 0.25 });

    window.addEventListener('mousemove', onMove);
    const targets = document.querySelectorAll('a, button, [role="button"], [data-cursor="hover"]');
    targets.forEach((t) => { t.addEventListener('mouseenter', onEnter); t.addEventListener('mouseleave', onLeave); });

    return () => {
      window.removeEventListener('mousemove', onMove);
      targets.forEach((t) => { t.removeEventListener('mouseenter', onEnter); t.removeEventListener('mouseleave', onLeave); });
    };
  }, []);

  return (
    <>
      <div ref={ringRef} aria-hidden="true"
        className="pointer-events-none fixed top-0 left-0 z-[200] w-8 h-8 -ml-4 -mt-4 rounded-full border border-fire/60 mix-blend-difference"
        style={{ opacity: 0, transform: 'translate(-100px,-100px)' }} />
      <div ref={dotRef} aria-hidden="true"
        className="pointer-events-none fixed top-0 left-0 z-[201] w-2 h-2 -ml-1 -mt-1 rounded-full bg-fire"
        style={{ opacity: 0, transform: 'translate(-100px,-100px)' }} />
    </>
  );
}
