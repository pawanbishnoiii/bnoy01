import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { MorphSVGPlugin } from 'gsap/MorphSVGPlugin';

const paths = ['M8 12H40V36H8Z M8 18H40', 'M12 8H36V32H24L16 40V32H12Z', 'M8 14H40V34H8Z M8 20H40', 'M16 8H32V24H16Z M8 40V30H40V40Z', 'M24 6L38 16V30L24 42L10 30V16Z', 'M10 10H38V38H10Z M10 18H38', 'M8 24L20 36L40 12L34 8L20 26L12 18Z'];
export default function BookingStepMark({ step }: {step:number}) {
  const path = useRef<SVGPathElement>(null);
  useEffect(() => {
    if (!path.current) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) { path.current.setAttribute('d',paths[step] || paths[0]); return; }
    gsap.registerPlugin(MorphSVGPlugin);
    const tween = gsap.to(path.current,{morphSVG:paths[step] || paths[0],duration:.45,ease:'power2.inOut'});
    return () => {tween.kill();};
  },[step]);
  return <svg viewBox="0 0 48 48" className="h-9 w-9 shrink-0 text-primary" aria-hidden="true"><path ref={path} d={paths[0]} stroke="currentColor" fill="none" strokeWidth="2.5" strokeLinejoin="round" /></svg>;
}