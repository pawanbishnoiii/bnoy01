import { createFileRoute, Link } from '@tanstack/react-router';
import { ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useEffect, useState } from 'react';
import { finishTruecaller } from '@/lib/truecaller.functions';
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
  const [message, setMessage] = useState('Verifying your Truecaller profile…');
  const [waiting, setWaiting] = useState(true);
  const navigate = useNavigate();
  useEffect(() => {
    let cancelled = false; let timer: ReturnType<typeof setTimeout>;
    const raw = sessionStorage.getItem('bnoy_truecaller');
    if (!raw) { setWaiting(false); setMessage('No verification request found. Please start again.'); return; }
    let proof: { requestId: string; proof: string };
    try { proof = JSON.parse(raw); } catch { setWaiting(false); setMessage('Invalid verification request. Please retry.'); return; }
    let count = 0;
    const poll = async () => {
      try {
        const result = await finishTruecaller({ data: proof });
        if (cancelled) return;
        if (result.status === 'pending' && ++count < 90) { timer = setTimeout(poll, 2000); return; }
        if (result.status === 'ready' && result.tokenHash) {
          const { error } = await supabase.auth.verifyOtp({ token_hash: result.tokenHash, type: 'magiclink' });
          if (error) throw error;
          sessionStorage.removeItem('bnoy_truecaller');
          navigate({ to: '/dashboard' }); return;
        }
        if (result.status === 'linked') { sessionStorage.removeItem('bnoy_truecaller'); navigate({ to: '/dashboard' }); return; }
        setWaiting(false); setMessage(result.message || 'Verification timed out. Make sure Truecaller is installed, then retry.');
      } catch { if (!cancelled) { setWaiting(false); setMessage('Verification could not complete. Please try another sign-in method.'); } }
    };
    poll(); return () => { cancelled = true; clearTimeout(timer); };
  }, [navigate]);
  return <main className="min-h-screen grid place-items-center bg-background px-6"><div className="max-w-sm text-center space-y-5">{waiting ? <div className="w-10 h-10 rounded-full border-2 border-primary border-t-transparent animate-spin mx-auto" /> : <ShieldAlert className="h-10 w-10 text-primary mx-auto" />}<h1 className="text-2xl font-semibold">Truecaller sign-in</h1><p role="status" className="text-muted-foreground">{message}</p><Button asChild variant="outline"><Link to="/login">Back to sign in</Link></Button></div></main>;
}