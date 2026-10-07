import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowUp } from 'lucide-react';

export default function BackToTop() {
  const [show, setShow] = useState(false);
  const [footerVisible, setFooterVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > 400);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Hide the floating button as soon as the footer enters the viewport — the
  // footer already has its own "Top" button, so we never show two at once.
  useEffect(() => {
    const footer = document.querySelector('footer');
    if (!footer || !('IntersectionObserver' in window)) return;
    const io = new IntersectionObserver(
      ([entry]) => setFooterVisible(entry.isIntersecting),
      { rootMargin: '0px 0px -10% 0px', threshold: 0 }
    );
    io.observe(footer);
    return () => io.disconnect();
  }, []);

  // Mobile screens: never show the floating popup (user request). Tailwind `md:flex` handles desktop+.
  return (
    <AnimatePresence>
      {show && !footerVisible && (
        <motion.button
          initial={{ opacity: 0, scale: 0.6 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.6 }}
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          aria-label="Back to top"
          className="hidden md:flex fixed bottom-8 right-6 z-40 w-11 h-11 rounded-full gradient-fire-strong text-white shadow-card-hover items-center justify-center hover:scale-110 transition-transform">
          <ArrowUp className="h-5 w-5" />
        </motion.button>
      )}
    </AnimatePresence>
  );
}
