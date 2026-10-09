import { useLocation, Link } from '@/lib/router';
import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Home, Search } from 'lucide-react';
import LottieAnimation from '@/components/ui/lottie-animation';
import error404 from '@/assets/error-404.json.asset.json';
import { Button } from '@/components/ui/button';

const NotFound = () => {
  const location = useLocation();
  useEffect(() => {
    console.error('404 Error: User attempted to access non-existent route:', location.pathname);
  }, [location.pathname]);

  return (
    <main className="relative min-h-dvh flex items-center justify-center bg-gradient-to-br from-warm-bg via-white to-warm-bg overflow-hidden px-4 py-16">
      <div className="absolute -top-32 -left-32 w-[420px] h-[420px] rounded-full opacity-50 blur-3xl"
        style={{ background: 'radial-gradient(closest-side, hsl(14 100% 56% / 0.4), transparent)' }} />
      <div className="absolute -bottom-40 -right-40 w-[500px] h-[500px] rounded-full opacity-50 blur-3xl"
        style={{ background: 'radial-gradient(closest-side, hsl(45 100% 55% / 0.4), transparent)' }} />

      <motion.div
        initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
        className="relative text-center max-w-lg"
      >
        <div className="w-72 h-72 md:w-96 md:h-96 mx-auto -mb-6">
          <LottieAnimation
            src={error404.url}
            fallback={<div className="w-full h-full grid place-items-center text-7xl">🛸</div>}
          />
        </div>
        <h1 className="font-display text-6xl md:text-8xl font-extrabold gradient-text">404</h1>
        <h2 className="font-display text-2xl md:text-3xl font-bold text-ink mt-3">Lost in space</h2>
        <p className="text-muted-foreground mt-3">
          The page <code className="px-1.5 py-0.5 bg-warm-bg rounded text-fire text-xs">{location.pathname}</code> drifted away. Let's get you back on course.
        </p>
        <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
          <Link to="/"><Button className="gradient-fire-strong text-white"><Home className="h-4 w-4 mr-2" />Home</Button></Link>
          <Link to="/marketplace"><Button variant="outline"><Search className="h-4 w-4 mr-2" />Browse projects</Button></Link>
          <button onClick={() => history.back()} className="text-sm text-muted-foreground hover:text-fire inline-flex items-center gap-1">
            <ArrowLeft className="h-4 w-4" /> Go back
          </button>
        </div>
      </motion.div>
    </main>
  );
};

export default NotFound;
