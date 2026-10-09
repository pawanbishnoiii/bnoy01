import { useEffect, useState } from 'react';
import { Maximize2, Minimize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export default function FullscreenButton() {
  const [isFull, setIsFull] = useState(false);
  useEffect(() => {
    const on = () => setIsFull(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', on);
    return () => document.removeEventListener('fullscreenchange', on);
  }, []);
  const toggle = async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await document.documentElement.requestFullscreen();
    } catch { toast.info('Full screen is unavailable in this browser window.'); }
  };
  return (
    <Button variant="outline" size="icon" onClick={toggle} className="shrink-0" title={isFull ? 'Exit full screen' : 'Full screen'} aria-label={isFull ? 'Exit full screen' : 'Full screen'} aria-pressed={isFull}>
      {isFull ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
    </Button>
  );
}
