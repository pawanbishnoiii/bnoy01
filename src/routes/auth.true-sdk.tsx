import { createFileRoute, Link } from '@tanstack/react-router';
import { ShieldAlert, LoaderCircle, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useEffect, useState, useCallback, useRef } from 'react';
import { useServerFn } from '@tanstack/react-start';
import { motion } from 'framer-motion';
import TruecallerAnimation from '@/components/TruecallerAnimation';
import { readTruecallerAttempt, TRUECALLER_STORAGE_KEY } from '@/lib/truecaller-client';
import { useAuthStore } from '@/store/authStore';
import creatorWorkspace from '@/assets/creator-workspace.png';
import { finishTruecaller, reportTruecallerError } from '@/lib/truecaller.functions';
import { truecallerCallback } from '@/lib/truecaller-callback';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from '@tanstack/react-router';
export const Route = createFileRoute('/auth/true-sdk')({
  head: () => ({ meta: [
    { title: 'Truecaller Sign-in — Bnoy Studios' },
    { name: 'description', content: 'Truecaller sign-in status for Bnoy Studios.' },
    { property: 'og:title', content: 'Truecaller Sign-in — Bnoy Studios' },
    { property: 'og:description', content: 'Truecaller sign-in status for Bnoy Studios.' },
    { property: 'og:type', content: 'website' }, { name: 'twitter:card', content: 'summary' }, { name: 'robots', content: 'noindex' },
  ] }),
  server: { handlers: { POST: ({ request }) => truecallerCallback(request) } },
  component: TruecallerStatus,
});

function TruecallerStatus() {
  const [phase, setPhase] = useState<'waiting' | 'slow' | 'error' | 'success'>('waiting');
  const [message, setMessage] = useState('Confirm your name and phone number in Truecaller.');
  const [retry, setRetry] = useState(0);
  const navigate = useNavigate();
  const finish = useServerFn(finishTruecaller);
  const report = useServerFn(reportTruecallerError);
  const needsRef = useRef<string[]>([]);
  const redirect = useCallback(() => needsRef.current.length ? navigate({ to: '/onboarding', search: { needs: needsRef.current.join(',') }, replace: true }) : navigate({ to: '/dashboard', replace: true }), [navigate]);
  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let inFlight = false;
    let finished = false;
    const attempt = readTruecallerAttempt();
    if (!attempt) { setPhase('error'); setMessage('No active verification. Start again from the sign-in page.'); return; }
    setPhase('waiting');
    const started = Date.now();
    let failures = 0;
    const poll = async () => {
      if (cancelled || inFlight || finished) return;
      inFlight = true;
      clearTimeout(timer);
      try {
        const result = await finish({ data: { requestId: attempt.requestId, proof: attempt.proof } });
        if (cancelled) return;
        failures = 0;
        if (result.status === 'pending') {
          const elapsed = Date.now() - started;
          if (elapsed >= 60000) { void report({ data: { requestId: attempt.requestId, stage: 'timeout', message: 'No callback received within 60s' } }).catch(() => {}); finished = true; setPhase('error'); setMessage('Truecaller has not responded. Check that the app is installed and retry, or use another sign-in method.'); return; }
          if (elapsed >= 12000) { setPhase('slow'); setMessage('Still waiting for Truecaller. You can reopen the app or choose another sign-in method.'); }
          else setMessage('Waiting for Truecaller confirmation…');
          timer = setTimeout(poll, elapsed < 12000 ? 900 : 2000);
          return;
        }
        if (result.status === 'ready' && result.tokenHash) {
          setMessage('Securing your account…');
          const { error } = await supabase.auth.verifyOtp({ token_hash: result.tokenHash, type: 'magiclink' });
          if (error) throw new Error('Could not sign in. Please start verification again.');
        } else if (result.status !== 'linked') {
          finished = true; setPhase('error'); setMessage(result.message || 'Verification could not complete. Please try again.'); return;
        }
        needsRef.current = 'needs' in result && Array.isArray(result.needs) ? result.needs : [];
        if (cancelled) return;
        sessionStorage.removeItem(TRUECALLER_STORAGE_KEY);
        finished = true;
        useAuthStore.getState().setShowAuthModal(false);
        setPhase('success'); setMessage('Your phone is verified. Welcome to Bnoy Studios.');
      } catch (err) {
        if (cancelled) return;
        if (++failures < 3) { timer = setTimeout(poll, 1500); return; }
        const msg = err instanceof Error ? err.message : 'Connection interrupted. Please retry.';
        void report({ data: { requestId: attempt.requestId, stage: 'poll', message: msg } }).catch(() => {});
        finished = true; setPhase('error'); setMessage(msg);
      } finally { inFlight = false; }
    };
    const resume = () => { if (document.visibilityState === 'visible') void poll(); };
    document.addEventListener('visibilitychange', resume);
    window.addEventListener('focus', resume);
    void poll();
    // Move to the waiting page before opening the app so returning cannot lose the polling screen.
    if (attempt.deepLink && !retry && attempt.startedAt && Date.now() - attempt.startedAt < 10000) {
      sessionStorage.setItem(TRUECALLER_STORAGE_KEY, JSON.stringify({ ...attempt, startedAt: 0 }));
      window.location.assign(attempt.deepLink);
    }
    return () => { cancelled = true; clearTimeout(timer); document.removeEventListener('visibilitychange', resume); window.removeEventListener('focus', resume); };
  }, [finish, report, retry]);
  const waiting = phase === 'waiting' || phase === 'slow';
  return <main className="auth-page"><motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="auth-card !max-w-[860px]">
    <div className="auth-form-panel"><Link to="/login" className="text-sm font-semibold">Bnoy Studios</Link>
      <div className="truecaller-status space-y-5">
        {phase === 'error' ? <ShieldAlert className="w-12 h-12 text-destructive mx-auto" /> : <TruecallerAnimation success={phase === 'success'} onComplete={phase === 'success' ? redirect : undefined} />}
        <h1 className="font-display text-2xl font-semibold">{phase === 'success' ? 'You’re signed in' : phase === 'error' ? 'Truecaller problem detected' : 'Truecaller sign-in'}</h1>
        <div className="truecaller-status-steps" aria-hidden="true"><span className="active" /><span className={phase === 'success' ? 'active' : ''} /><span className={phase === 'success' ? 'active' : ''} /></div>
        <p role={phase === 'error' ? 'alert' : 'status'} className="text-sm text-muted-foreground min-h-12">{message}</p>
        {waiting && <Button disabled aria-busy="true" className="w-full auth-submit rounded-full"><LoaderCircle className="w-4 h-4 animate-spin" />Verifying…</Button>}
        {phase === 'slow' && <Button variant="outline" className="w-full rounded-full" onClick={() => { const a = readTruecallerAttempt(); if (a?.deepLink) window.location.assign(a.deepLink); }}>Reopen Truecaller</Button>}
        {phase === 'error' && <Button className="w-full auth-submit rounded-full" onClick={() => { if (readTruecallerAttempt()) setRetry(n => n + 1); else navigate({ to: '/login' }); }}><RotateCcw className="h-4 w-4" />Retry verification</Button>}
        {phase !== 'success' && <Button asChild variant="ghost" className="w-full"><Link to="/login">Use another sign-in method</Link></Button>}
      </div>
    </div>
    <div className="auth-art-panel"><img src={creatorWorkspace} width={1024} height={1024} alt="Creator workspace" className="auth-creator-art" /></div>
  </motion.div></main>;
}
