import { useEffect, useRef } from 'react';
import { ShieldCheck } from 'lucide-react';
import loadingAsset from '@/assets/auth/truecaller-loading.asset.json';
import successAsset from '@/assets/auth/truecaller-success.asset.json';

export default function TruecallerAnimation({ success = false, compact = false, onComplete }: { success?: boolean; compact?: boolean; onComplete?: () => void }) {
  const video = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      video.current?.pause();
      if (success) { const timer = setTimeout(() => onComplete?.(), 600); return () => clearTimeout(timer); }
    }
    if (success) { const timer = setTimeout(() => onComplete?.(), 4600); return () => clearTimeout(timer); }
  }, [success, onComplete]);
  return <span className={compact ? 'truecaller-animation compact' : 'truecaller-animation'}>
    <video ref={video} key={success ? 'success' : 'loading'} src={success ? successAsset.url : loadingAsset.url}
      autoPlay muted playsInline loop={!success} preload="auto" aria-label={success ? 'Truecaller verification successful' : 'Truecaller'}
      onEnded={success ? onComplete : undefined} onError={success ? onComplete : undefined} />
    <ShieldCheck className="truecaller-video-fallback" aria-hidden="true" />
  </span>;
}