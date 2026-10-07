import { useEffect, useState } from 'react';

export default function ProgressBar() {
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    const onScroll = () => {
      const total = document.documentElement.scrollHeight - window.innerHeight;
      setProgress(total > 0 ? (window.scrollY / total) * 100 : 0);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  return (
    <div className="fixed top-0 left-0 right-0 h-[3px] z-[60] pointer-events-none bg-transparent">
      <div className="h-full gradient-fire-strong transition-[width] duration-150" style={{ width: `${progress}%` }} />
    </div>
  );
}
