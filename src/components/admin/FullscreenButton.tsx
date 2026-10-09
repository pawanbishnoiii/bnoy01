import { useEffect, useState } from 'react';
import { Maximize2, Minimize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

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
    } catch { /* browser blocked */ }
  };
  return (
    <Button variant="outline" size="sm" onClick={toggle} className="w-full gap-2" aria-label="Toggle full screen">
      {isFull ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
      {isFull ? 'Exit full screen' : 'Full screen'}
    </Button>
  );
}
