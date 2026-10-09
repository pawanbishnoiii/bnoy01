import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Star, ShieldCheck, Sparkles, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/store/authStore';
import { Link, useNavigate } from '@/lib/router';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import LottieAnimation from '@/components/ui/lottie-animation';
import Hero3DButton from '@/components/ui/3d-button';
import ArrowCTA from '@/components/ui/button-1';
import CpuArchitecture from '@/components/ui/cpu-architecture';
import { HeartIcon, DownloadDoneIcon, SuccessIcon, NotificationIcon } from '@/components/ui/animated-state-icons';
import bnoyLogo from '@/assets/bnoy-logo.png';
import benefitTeam from '@/assets/benefit-team.png';
import benefitSecure from '@/assets/benefit-secure.png';
import benefitHandoff from '@/assets/benefit-handoff.png';
import mobileHeroArt from '@/assets/mobile-hero.png';

if (typeof window !== 'undefined') gsap.registerPlugin(ScrollTrigger);

export default function HeroSection() {
  const { isAdmin, setShowAuthModal } = useAuthStore();
  const sectionRef = useRef<HTMLElement>(null);

  const { data: settings } = useQuery({
    queryKey: ['site-settings'],
    queryFn: async () => (await supabase.from('site_settings').select('*').limit(1).maybeSingle()).data,
  });
  const brand = settings?.brand_name || 'Bnoy Studios';
  const tagline = settings?.brand_tagline || 'Premium web & mobile codebases, ready to ship in minutes.';
  const badge = (settings as any)?.hero_badge || 'New · 50+ Premium Projects';
  const heroVideo = settings?.hero_video_url || null;
  const heroBg = (settings as any)?.hero_bg_url || null;
  const heroLottie = (settings as any)?.hero_lottie_url || null;
  const logo = (settings as any)?.logo_url || bnoyLogo;

  useEffect(() => {
    if (typeof window === 'undefined' || !sectionRef.current) return;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) {
      gsap.set('.bnoy-hero-word, .bnoy-hero-char, .bnoy-hero-fade', { opacity: 1, y: 0, rotateX: 0 });
      return;
    }
    const ctx = gsap.context(() => {
      // SplitText-style letter-level stagger reveal with word grouping.
      gsap.from('.bnoy-hero-char', {
        yPercent: 110, opacity: 0, rotateX: 70,
        duration: 0.9, ease: 'expo.out',
        stagger: { each: 0.025, from: 'start' },
        delay: 0.15,
      });
      gsap.from('.bnoy-hero-fade', { y: 24, opacity: 0, stagger: 0.08, duration: 0.8, ease: 'power3.out', delay: 0.65 });
      gsap.to('.bnoy-layer-slow', { yPercent: -8, ease: 'none', scrollTrigger: { trigger: sectionRef.current, start: 'top top', end: 'bottom top', scrub: true } });
      gsap.to('.bnoy-layer-fast', { yPercent: -20, ease: 'none', scrollTrigger: { trigger: sectionRef.current, start: 'top top', end: 'bottom top', scrub: true } });
    }, sectionRef);
    return () => ctx.revert();
  }, []);

  // Helper: split a word into per-char spans for letter-level stagger.
  const splitChars = (word: string, keyPrefix: string) => (
    <span key={keyPrefix} className="bnoy-hero-word inline-block mr-3 overflow-hidden align-bottom" style={{ perspective: 600 }}>
      {Array.from(word).map((c, i) => (
        <span key={`${keyPrefix}-${i}`} className="bnoy-hero-char inline-block" style={{ transformOrigin: '50% 100%' }}>{c}</span>
      ))}
    </span>
  );

  const headline = ['Buy', 'ship-ready', 'projects.'];
  const headline2 = ['Launch', 'in', 'minutes.'];

  return (
    <>
    <MobileHero brand={brand} tagline={tagline} badge={badge} isAdmin={isAdmin} />
    <section ref={sectionRef} className="relative min-h-[100vh] hidden md:flex items-center overflow-hidden pt-28 pb-20 bg-warm-bg text-ink">
      {/* LAYER 1 — light backdrop, optional video / bg image */}
      <div className="absolute inset-0 -z-10">
        {heroVideo ? (
          <video src={heroVideo} autoPlay muted loop playsInline className="absolute inset-0 h-full w-full object-cover opacity-25" />
        ) : heroBg ? (
          <img src={heroBg} alt="" className="absolute inset-0 h-full w-full object-cover opacity-40" />
        ) : null}
        <div className="absolute inset-0 bg-gradient-to-b from-white/70 via-warm-bg/70 to-white" />
      </div>

      {/* LAYER 2 — animated grid (same vibe as footer) */}
      <div className="absolute inset-0 -z-10 opacity-[0.4] bnoy-layer-slow pointer-events-none"
        style={{
          backgroundImage: 'linear-gradient(hsl(24 30% 86%) 1px, transparent 1px), linear-gradient(90deg, hsl(24 30% 86%) 1px, transparent 1px)',
          backgroundSize: '64px 64px',
          maskImage: 'radial-gradient(circle at center, black 0%, transparent 75%)',
          WebkitMaskImage: 'radial-gradient(circle at center, black 0%, transparent 75%)',
        }} />

      {/* LAYER 3 — warm aura blobs */}
      <motion.div animate={{ scale: [1, 1.15, 1], opacity: [0.35, 0.55, 0.35] }} transition={{ repeat: Infinity, duration: 8 }}
        className="absolute -top-32 -left-32 w-[520px] h-[520px] rounded-full bnoy-layer-fast pointer-events-none"
        style={{ background: 'radial-gradient(closest-side, hsl(14 100% 60% / 0.45), transparent)' }} />
      <motion.div animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }} transition={{ repeat: Infinity, duration: 10, delay: 1 }}
        className="absolute -bottom-32 -right-20 w-[600px] h-[600px] rounded-full bnoy-layer-fast pointer-events-none"
        style={{ background: 'radial-gradient(closest-side, hsl(43 100% 55% / 0.45), transparent)' }} />

      {/* LAYER 4 — floating decorative SVGs */}
      <svg className="absolute top-20 right-[20%] w-24 h-24 bnoy-layer-fast text-fire/30 pointer-events-none" viewBox="0 0 100 100" fill="none">
        <motion.circle cx="50" cy="50" r="40" stroke="currentColor" strokeWidth="1.5" strokeDasharray="4 6"
          animate={{ rotate: 360 }} transition={{ duration: 30, repeat: Infinity, ease: 'linear' }} style={{ transformOrigin: 'center' }} />
      </svg>
      <svg className="absolute bottom-32 left-[8%] w-32 h-32 bnoy-layer-slow text-sun/40 pointer-events-none hidden md:block" viewBox="0 0 100 100">
        <motion.path d="M50 10 L60 40 L90 50 L60 60 L50 90 L40 60 L10 50 L40 40 Z" fill="currentColor"
          animate={{ rotate: [0, 360] }} transition={{ duration: 40, repeat: Infinity, ease: 'linear' }} style={{ transformOrigin: 'center' }} />
      </svg>

      <div className="container mx-auto px-4 relative z-10">
        <div className="grid lg:grid-cols-12 gap-10 items-center">
          {/* Copy */}
          <div className="lg:col-span-7">
            <div className="bnoy-hero-fade inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border border-border shadow-card text-xs font-semibold">
              <img src={logo} alt="" className="h-4 w-4 object-contain" />
              <Sparkles className="h-3.5 w-3.5 text-fire" />
              <span className="tracking-[0.18em] uppercase text-ink">{badge}</span>
            </div>

            <h1 className="mt-5 font-display text-5xl sm:text-6xl lg:text-[80px] font-extrabold leading-[1.02] tracking-tight text-ink">
              {headline.map((w, i) => splitChars(w, `a-${i}`))}
              <br />
              <span className="bg-gradient-to-br from-fire via-sun to-fire bg-clip-text text-transparent">
                {headline2.map((w, i) => splitChars(w, `b-${i}`))}
              </span>
            </h1>

            <p className="bnoy-hero-fade mt-6 text-lg text-muted-foreground max-w-xl">{tagline}</p>

            <div className="bnoy-hero-fade mt-8 flex flex-wrap items-center gap-3">
              <ArrowCTA label="Browse Projects" href="/marketplace" />
              {isAdmin ? (
                <Link to="/admin"><Button size="lg" variant="outline" className="border-border">Admin Panel</Button></Link>
              ) : (
                <HeroStartButton />
              )}
            </div>

            <div className="bnoy-hero-fade mt-8 flex flex-wrap gap-2">
              <Pill icon={<SuccessIcon size={16} className="text-fire" />}>Production Ready</Pill>
              <Pill icon={<Star className="h-3.5 w-3.5 text-sun fill-sun" />}>4.9 Rating</Pill>
              <Pill icon={<ShieldCheck className="h-3.5 w-3.5 text-fire" />}>Secure Checkout</Pill>
              <Pill icon={<DownloadDoneIcon size={16} className="text-ink" />}>Instant Delivery</Pill>
            </div>
          </div>

          {/* Right composition — multi-layer */}
          <div className="lg:col-span-5 relative h-[520px] hidden lg:block">
            {/* Background card with grid */}
            <motion.div initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.7 }}
              className="absolute inset-0 rounded-3xl bg-white border border-border shadow-card-hover overflow-hidden bnoy-layer-slow">
              <div
                className="absolute inset-0 opacity-[0.5] pointer-events-none"
                style={{
                  backgroundImage: 'linear-gradient(hsl(24 30% 90%) 1px, transparent 1px), linear-gradient(90deg, hsl(24 30% 90%) 1px, transparent 1px)',
                  backgroundSize: '40px 40px',
                  maskImage: 'radial-gradient(circle at 60% 40%, black 0%, transparent 80%)',
                  WebkitMaskImage: 'radial-gradient(circle at 60% 40%, black 0%, transparent 80%)',
                }}
              />
              {heroLottie ? (
                <div className="absolute inset-0 flex items-center justify-center p-6">
                  <DotLottieReact src={heroLottie} loop autoplay />
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-2 px-4 py-3 bg-warm-bg/60 border-b border-border">
                    <span className="w-3 h-3 rounded-full bg-destructive" />
                    <span className="w-3 h-3 rounded-full bg-sun" />
                    <span className="w-3 h-3 rounded-full bg-green-500" />
                    <span className="ml-3 text-xs text-muted-foreground font-mono flex items-center gap-1.5"><Zap className="h-3 w-3 text-fire" /> bnoy.studio</span>
                  </div>
                  <div className="absolute inset-0 top-10 flex items-center justify-center p-6">
                    <CpuArchitecture text="BNOY" className="text-fire/80 max-w-[420px]" />
                  </div>
                </>
              )}
            </motion.div>

            {/* Floating sticker cards using uploaded assets */}
            <motion.div className="absolute -top-6 -right-6 bg-white p-3 rounded-2xl shadow-card-hover border border-border w-40 rotate-[5deg] bnoy-layer-fast"
              initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 }}>
              <img src={benefitSecure} alt="" className="w-full h-20 object-cover rounded-lg" />
              <div className="text-[10px] text-muted-foreground mt-2">Secure code</div>
              <div className="font-display font-bold text-ink text-sm">PulseChat AI</div>
            </motion.div>

            <motion.div className="absolute top-1/2 -left-8 bg-white px-3 py-1.5 rounded-full shadow-card text-xs font-semibold text-ink -rotate-3 border border-border flex items-center gap-1.5 bnoy-layer-fast"
              animate={{ y: [0, -8, 0] }} transition={{ repeat: Infinity, duration: 3 }}>
              <NotificationIcon size={16} className="text-fire" /> Instant Deploy
            </motion.div>

            <motion.div className="absolute -bottom-6 -left-6 bg-white p-3 rounded-2xl shadow-card-hover border border-border w-44 bnoy-layer-fast"
              initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1 }}>
              <img src={benefitHandoff} alt="" className="w-full h-20 object-cover rounded-lg" />
              <div className="flex items-center gap-2 mt-2">
                <HeartIcon size={16} className="text-fire" />
                <span className="font-bold text-xs text-ink">4.9 / 5</span>
              </div>
            </motion.div>

            <motion.div className="absolute bottom-16 -right-4 bg-gradient-to-br from-fire to-sun text-white p-3 rounded-2xl shadow-card-hover w-32 rotate-[8deg] bnoy-layer-fast"
              initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 1.1 }}>
              <img src={benefitTeam} alt="" className="w-full h-16 object-cover rounded-lg opacity-90" />
              <div className="text-[10px] mt-1 font-bold">200+ buyers</div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
    </>
  );
}

function MobileHero({ brand, tagline, badge, isAdmin }: { brand: string; tagline: string; badge: string; isAdmin: boolean }) {
  const stats = [['50+', 'Projects'], ['4.9★', 'Rating'], ['24/7', 'Support']];
  return (
    <section className="md:hidden relative overflow-hidden bg-warm-bg text-ink pt-24 pb-10 px-5">
      <motion.div aria-hidden animate={{ scale: [1, 1.2, 1], rotate: [0, 30, 0] }} transition={{ repeat: Infinity, duration: 12 }}
        className="absolute -top-24 -right-24 h-72 w-72 rounded-full pointer-events-none" style={{ background: 'radial-gradient(closest-side, hsl(14 100% 60% / 0.4), transparent)' }} />
      <motion.div aria-hidden animate={{ scale: [1, 1.15, 1] }} transition={{ repeat: Infinity, duration: 9, delay: 1 }}
        className="absolute top-72 -left-24 h-64 w-64 rounded-full pointer-events-none" style={{ background: 'radial-gradient(closest-side, hsl(43 100% 55% / 0.4), transparent)' }} />
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="relative inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1 text-[11px] font-semibold uppercase tracking-wider shadow-card">
        <Sparkles className="h-3 w-3 text-fire" />{badge}
      </motion.div>
      <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="relative mt-4 font-display text-[40px] leading-[1.02] font-extrabold tracking-tight">
        Ship-ready code,<br /><span className="bg-gradient-to-br from-fire via-sun to-fire bg-clip-text text-transparent">in your pocket.</span>
      </motion.h1>
      <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.25 }} className="relative mt-3 text-[15px] text-muted-foreground">{tagline}</motion.p>
      <motion.div initial={{ opacity: 0, scale: 0.85, rotate: -4 }} animate={{ opacity: 1, scale: 1, rotate: 0 }} transition={{ delay: 0.2, type: 'spring', stiffness: 90 }} className="relative my-4">
        <motion.img src={mobileHeroArt} alt={`${brand} web, app and Windows projects`} width={1024} height={1024} className="mx-auto w-[88%] max-w-sm drop-shadow-2xl"
          animate={{ y: [0, -10, 0] }} transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut' }} />
        <motion.div animate={{ y: [0, -6, 0] }} transition={{ repeat: Infinity, duration: 3 }} className="absolute left-0 top-6 rounded-2xl border border-border bg-card px-3 py-2 text-xs font-semibold shadow-card flex items-center gap-1.5"><ShieldCheck className="h-3.5 w-3.5 text-fire" />Secure checkout</motion.div>
        <motion.div animate={{ y: [0, 6, 0] }} transition={{ repeat: Infinity, duration: 3.5 }} className="absolute right-0 bottom-6 rounded-2xl border border-border bg-card px-3 py-2 text-xs font-semibold shadow-card flex items-center gap-1.5"><Zap className="h-3.5 w-3.5 text-sun" />Instant download</motion.div>
      </motion.div>
      <div className="relative grid grid-cols-3 gap-2">
        {stats.map(([v, l]) => <div key={l} className="rounded-2xl border border-border bg-card/80 backdrop-blur py-3 text-center shadow-card"><div className="font-display text-lg font-extrabold">{v}</div><div className="text-[11px] text-muted-foreground">{l}</div></div>)}
      </div>
      <div className="relative mt-5 flex flex-col gap-2.5">
        <Link to="/marketplace"><Button size="lg" className="w-full rounded-full h-12 text-base">Browse projects</Button></Link>
        {isAdmin ? <Link to="/admin"><Button size="lg" variant="outline" className="w-full rounded-full h-12">Admin Panel</Button></Link>
          : <Link to="/windows"><Button size="lg" variant="outline" className="w-full rounded-full h-12">Windows software</Button></Link>}
      </div>
    </section>
  );
}

function Pill({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border border-border shadow-card text-sm font-medium text-ink">
      {icon}{children}
    </div>
  );
}

function HeroStartButton() {
  const { user, setShowAuthModal } = useAuthStore();
  const [loading, setLoading] = React.useState(false);
  const navigate = useNavigate();
  const onClick = () => {
    setLoading(true);
    // Small perceived latency so the loading state is visible.
    window.setTimeout(() => {
      if (user) navigate('/marketplace');
      else setShowAuthModal(true, 'Sign in to start buying.');
      setLoading(false);
    }, 420);
  };
  return (
    <Hero3DButton
      onClick={onClick}
      loading={loading}
      labelRest="Get Started"
      labelHover={user ? 'Explore' : "Let's Go"}
    />
  );
}
