import { useEffect, useState, useRef } from 'react';
import { useServerFn } from '@tanstack/react-start';
import { useNavigate } from '@tanstack/react-router';
import { LoaderCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { startTruecaller, reportTruecallerError } from '@/lib/truecaller.functions';
import { useToast } from '@/hooks/use-toast';
import TruecallerAnimation from '@/components/TruecallerAnimation';
import { TRUECALLER_STORAGE_KEY } from '@/lib/truecaller-client';
export default function TruecallerButton({ link = false, disabled = false, onBusyChange }: { link?: boolean; disabled?: boolean; onBusyChange?: (busy: boolean) => void }) {
  const [supported, setSupported] = useState(false);
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate(); const { toast } = useToast();
  const start = useServerFn(startTruecaller);
  const report = useServerFn(reportTruecallerError);
  const locked = useRef(false);
  const [error, setError] = useState('');
  useEffect(() => setSupported(/Android/i.test(navigator.userAgent)), []);
  return <div className="space-y-2"><Button type="button" variant="outline" disabled={busy || disabled} aria-busy={busy} className="truecaller-button w-full h-12 rounded-full" onClick={async () => {
    if (locked.current) return;
    if (!supported) { setError('Truecaller sign-in works on Android phones with the Truecaller app. On this device, please use Google or email.'); return; }
    locked.current = true; setBusy(true); setError(''); onBusyChange?.(true);
    try {
      const attempt = await start();
      sessionStorage.setItem(TRUECALLER_STORAGE_KEY, JSON.stringify({ ...attempt, startedAt: Date.now() }));
      await navigate({ to: '/auth/true-sdk' });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Please try another sign-in method.';
      void report({ data: { stage: 'start', message } }).catch(() => {});
      setError(message); toast({ title: 'Truecaller unavailable', description: message, variant: 'destructive' });
    } finally { locked.current = false; setBusy(false); onBusyChange?.(false); }
  }}>{busy ? <LoaderCircle className="h-5 w-5 animate-spin" /> : <TruecallerAnimation compact />}{busy ? 'Opening Truecaller…' : link ? 'Verify phone with Truecaller' : 'Continue with Truecaller'}</Button>{error && <p role="alert" className="text-xs text-destructive">{error}</p>}</div>;
}