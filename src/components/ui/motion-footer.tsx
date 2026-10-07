import * as React from 'react';
import { useEffect, useRef } from 'react';
import { Link } from '@/lib/router';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useQuery } from '@tanstack/react-query';
import { Github, Twitter, Linkedin, Instagram, Youtube, Mail, ArrowUpRight, Heart, ArrowUp } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import bnoyLogoFallback from '@/assets/bnoy-logo.png';
import { cn } from '@/lib/utils';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

// ----- Magnetic primitive ---------------------------------------------------
type MagneticProps = React.HTMLAttributes<HTMLElement> & {
  as?: React.ElementType;
  href?: string;
  to?: string;
  target?: string;
  rel?: string;
};

const Magnetic = React.forwardRef<HTMLElement, MagneticProps>(
  ({ className, children, as: Component = 'button', ...rest }, fwdRef) => {
    const ref = useRef<HTMLElement | null>(null);

    useEffect(() => {
      const el = ref.current;
      if (!el || typeof window === 'undefined') return;
      const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (reduced) return;

      const ctx = gsap.context(() => {
        const onMove = (e: MouseEvent) => {
          const r = el.getBoundingClientRect();
          const x = e.clientX - r.left - r.width / 2;
          const y = e.clientY - r.top - r.height / 2;
          gsap.to(el, { x: x * 0.35, y: y * 0.35, scale: 1.04, ease: 'power2.out', duration: 0.4 });
        };
        const onLeave = () => gsap.to(el, { x: 0, y: 0, scale: 1, ease: 'elastic.out(1, 0.4)', duration: 1 });
        el.addEventListener('mousemove', onMove);
        el.addEventListener('mouseleave', onLeave);
        return () => {
          el.removeEventListener('mousemove', onMove);
          el.removeEventListener('mouseleave', onLeave);
        };
      }, el);
      return () => ctx.revert();
    }, []);

    return (
      <Component
        ref={(node: HTMLElement | null) => {
          ref.current = node;
          if (typeof fwdRef === 'function') fwdRef(node);
          else if (fwdRef) (fwdRef as React.MutableRefObject<HTMLElement | null>).current = node;
        }}
        className={cn('inline-flex cursor-pointer', className)}
        {...rest}
      >
        {children}
      </Component>
    );
  }
);
Magnetic.displayName = 'Magnetic';

// ----- Marquee --------------------------------------------------------------
const MARQUEE = ['Production Ready ✦', 'GSAP Powered ✦', 'Lottie Animations ✦', 'shadcn / Tailwind ✦', 'Premium Code ✦', 'Bnoy Studios ✦'];
const MarqueeRow = () => (
  <div className="flex shrink-0 items-center gap-10 px-5 text-[11vw] font-black uppercase tracking-tighter md:text-[8vw]">
    {MARQUEE.map((t, i) => (
      <span key={i} className="flex items-center gap-10 text-transparent" style={{ WebkitTextStroke: '1px hsl(var(--foreground) / 0.18)' }}>
        {t}
      </span>
    ))}
  </div>
);

// ----- Main footer ----------------------------------------------------------
export function CinematicFooter() {
  const wrapperRef = useRef<HTMLElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const linksRef = useRef<HTMLDivElement>(null);
  const auroraRef = useRef<HTMLDivElement>(null);

  const { data: s } = useQuery({
    queryKey: ['site-settings'],
    queryFn: async () => (await supabase.from('site_settings').select('*').limit(1).maybeSingle()).data,
  });

  useEffect(() => {
    if (typeof window === 'undefined' || !wrapperRef.current) return;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        auroraRef.current,
        { y: 80, opacity: 0.3, scale: 0.9 },
        {
          y: 0, opacity: 1, scale: 1, ease: 'power1.out',
          scrollTrigger: { trigger: wrapperRef.current, start: 'top 80%', end: 'bottom bottom', scrub: 1 },
        }
      );
      gsap.fromTo(
        [headingRef.current, linksRef.current],
        { y: 60, opacity: 0 },
        {
          y: 0, opacity: 1, stagger: 0.15, ease: 'power3.out',
          scrollTrigger: { trigger: wrapperRef.current, start: 'top 70%', toggleActions: 'play none none reverse' },
        }
      );
    }, wrapperRef);
    return () => ctx.revert();
  }, []);

  const socials = [
    { icon: Github, url: s?.social_github, label: 'GitHub' },
    { icon: Twitter, url: s?.social_twitter, label: 'Twitter' },
    { icon: Linkedin, url: s?.social_linkedin, label: 'LinkedIn' },
    { icon: Instagram, url: s?.social_instagram, label: 'Instagram' },
    { icon: Youtube, url: s?.social_youtube, label: 'YouTube' },
    { icon: Mail, url: s?.support_email ? `mailto:${s.support_email}` : null, label: 'Email' },
  ].filter((x) => x.url);

  const navCols = [
    { title: 'Explore', links: [['Marketplace', '/marketplace'], ['Apps', '/apps'], ['Free Templates', '/marketplace?price=free'], ['Pricing', '/#pricing']] as const },
    { title: 'Studio', links: [['How it works', '/#how'], ['FAQ', '/#faq'], ['Refund Policy', '/refund'], ['Contact', `mailto:${s?.support_email || 'hello@bnoy.studio'}`]] as const },
  ];

  const bnoyLogo = (s as any)?.logo_url || bnoyLogoFallback;
  const brandFull = s?.brand_name || 'Bnoy Studios';
  const [brandLead, ...brandTailArr] = brandFull.split(' ');
  const brandTail = brandTailArr.join(' ') || 'Studios';

  return (
    <footer ref={wrapperRef} className="relative isolate overflow-hidden bg-ink text-white pt-24 pb-10 w-full">

      {/* Aurora glow */}
      <div ref={auroraRef} className="absolute inset-0 -z-10 pointer-events-none">
        <div className="absolute left-1/2 top-0 h-[700px] w-[1100px] -translate-x-1/2 -translate-y-1/3 rounded-full opacity-60 blur-3xl"
             style={{ background: 'radial-gradient(closest-side, hsl(14 100% 56% / 0.5), hsl(43 100% 50% / 0.25), transparent)' }} />
      </div>
      {/* Grid */}
      <div className="absolute inset-0 -z-10 opacity-[0.07]"
           style={{ backgroundImage: 'linear-gradient(white 1px, transparent 1px), linear-gradient(90deg, white 1px, transparent 1px)', backgroundSize: '64px 64px',
                    maskImage: 'linear-gradient(to bottom, transparent, black 25%, black 75%, transparent)',
                    WebkitMaskImage: 'linear-gradient(to bottom, transparent, black 25%, black 75%, transparent)' }} />

      <div className="container mx-auto px-4 relative">
        <div className="grid lg:grid-cols-12 gap-12">
          {/* Heading + CTA */}
          <div className="lg:col-span-7">
            <p className="text-[11px] font-bold tracking-[0.35em] uppercase text-fire mb-5">Bnoy Studios · Est. 2025</p>
            <h2 ref={headingRef} className="font-display font-extrabold leading-[0.95] tracking-tight text-5xl sm:text-6xl md:text-7xl">
              Let's build something{' '}
              <span className="bg-gradient-to-br from-fire via-sun to-fire bg-clip-text text-transparent">unforgettable.</span>
            </h2>
            <p className="mt-6 max-w-lg text-white/60 text-base md:text-lg">
              Production-grade web and mobile codebases, designed and engineered for makers who ship fast.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Magnetic as={Link} to="/marketplace"
                className="group items-center gap-2 rounded-full bg-white text-ink px-6 py-3 text-sm font-bold shadow-2xl">
                Browse Marketplace
                <ArrowUpRight className="ml-2 h-4 w-4 transition-transform group-hover:rotate-45" />
              </Magnetic>
              <Magnetic as="a" href={`mailto:${s?.support_email || 'hello@bnoy.studio'}`}
                className="items-center gap-2 rounded-full border border-white/15 px-6 py-3 text-sm font-semibold text-white/90 hover:bg-white/5 backdrop-blur">
                Get in touch
              </Magnetic>
            </div>
          </div>

          {/* Link grid */}
          <div ref={linksRef} className="lg:col-span-5 grid grid-cols-2 gap-10">
            {navCols.map((col) => (
              <div key={col.title}>
                <h4 className="text-xs font-bold tracking-[0.25em] uppercase text-white/40 mb-4">{col.title}</h4>
                <ul className="space-y-3">
                  {col.links.map(([label, href]) => (
                    <li key={label}>
                      {href.startsWith('mailto:') ? (
                        <a href={href} className="group inline-flex items-center text-sm text-white/80 hover:text-fire transition">
                          {label}<ArrowUpRight className="ml-1 h-3.5 w-3.5 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                        </a>
                      ) : (
                        <Link to={href} className="group inline-flex items-center text-sm text-white/80 hover:text-fire transition">
                          {label}<ArrowUpRight className="ml-1 h-3.5 w-3.5 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                        </Link>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Marquee */}
        <div className="relative mt-20 overflow-hidden">
          <div className="flex" style={{ animation: 'bnoy-marquee 40s linear infinite' }}>
            <MarqueeRow /><MarqueeRow />
          </div>
          <style>{`@keyframes bnoy-marquee { from { transform: translateX(0); } to { transform: translateX(-50%); } }`}</style>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 flex flex-col md:flex-row items-center justify-between gap-6 border-t border-white/10 pt-6">
          <Link to="/" className="flex items-center gap-2">
            <img src={bnoyLogo} alt={brandFull} width={36} height={36} className="h-9 w-9 rounded-xl object-contain" />
            <span className="font-display text-lg font-extrabold tracking-tight">
              {brandLead}<span className="text-fire">.</span>{brandTail}
            </span>
          </Link>
          <div className="flex gap-2">
            {socials.map((s, i) => (
              <Magnetic key={i} as="a" href={s.url!} target="_blank" rel="noopener noreferrer" aria-label={s.label}
                className="h-9 w-9 items-center justify-center rounded-full border border-white/15 text-white/70 hover:text-fire hover:border-fire/40 transition">
                <s.icon className="h-4 w-4" />
              </Magnetic>
            ))}
          </div>
          <div className="flex items-center gap-4 text-xs text-white/50">
            <span className="inline-flex items-center gap-1.5">© {new Date().getFullYear()} Made with <Heart className="h-3.5 w-3.5 fill-fire text-fire" /> in India</span>
            <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="inline-flex items-center gap-1.5 rounded-full border border-white/15 px-3 py-1.5 text-white/80 hover:text-fire hover:border-fire/40 transition">
              Top<ArrowUp className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default CinematicFooter;
