import { createFileRoute, useNavigate, Link } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { useServerFn } from '@tanstack/react-start';
import { motion } from 'framer-motion';
import { Mail, UserRound, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuthStore } from '@/store/authStore';
import { getOnboardingNeeds, saveOnboardingName, requestEmailLink } from '@/lib/truecaller.functions';

export const Route = createFileRoute('/onboarding')({
  validateSearch: (s: Record<string, unknown>) => ({ needs: typeof s.needs === 'string' ? s.needs : '' }),
  head: () => ({ meta: [
    { title: 'Finish your profile — Bnoy Studios' },
    { name: 'description', content: 'Add the details Truecaller did not share to finish your Bnoy Studios account.' },
    { property: 'og:title', content: 'Finish your profile — Bnoy Studios' },
    { property: 'og:description', content: 'Complete your Bnoy Studios account after Truecaller sign-in.' },
    { property: 'og:type', content: 'website' }, { name: 'twitter:card', content: 'summary' }, { name: 'robots', content: 'noindex' },
  ] }),
  component: Onboarding,
});

function Onboarding() {
  const { needs: needsParam } = Route.useSearch();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const getNeeds = useServerFn(getOnboardingNeeds);
  const saveName = useServerFn(saveOnboardingName);
  const linkEmail = useServerFn(requestEmailLink);
  const [needs, setNeeds] = useState<string[]>(needsParam.split(',').filter(n => n === 'email' || n === 'name'));
  const [first, setFirst] = useState(''); const [last, setLast] = useState(''); const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false); const [error, setError] = useState(''); const [emailSent, setEmailSent] = useState(false);

  useEffect(() => {
    if (!user) return;
    getNeeds().then(r => { setNeeds(r.needs); if (r.pendingEmail) setEmailSent(true); if (!r.needs.length) navigate({ to: '/dashboard', replace: true }); }).catch(() => {});
  }, [user, getNeeds, navigate]);

  const done = () => navigate({ to: '/dashboard', replace: true });
  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setBusy(true); setError('');
    try {
      if (needs.includes('name')) await saveName({ data: { firstName: first, lastName: last } });
      if (needs.includes('email') && email && !emailSent) { await linkEmail({ data: { email } }); setEmailSent(true); setNeeds(['email']); return; }
      done();
    } catch (err) { setError(err instanceof Error ? err.message : 'Please retry.'); }
    finally { setBusy(false); }
  };

  if (!user) return <main className="auth-page"><div className="auth-card p-8 text-center space-y-4"><p>Please sign in to finish your profile.</p><Button asChild><Link to="/login">Sign in</Link></Button></div></main>;

  return <main className="auth-page"><motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="auth-card !max-w-md p-6 sm:p-8">
    <form onSubmit={submit} className="space-y-5">
      <div className="space-y-1"><h1 className="font-display text-2xl font-semibold">Almost done</h1><p className="text-sm text-muted-foreground">Truecaller verified your phone. Just add what it didn’t share.</p></div>
      {needs.includes('name') && <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2"><Label htmlFor="ob-first"><UserRound className="inline h-3.5 w-3.5 mr-1" />First name</Label><Input id="ob-first" required maxLength={100} value={first} onChange={e => setFirst(e.target.value)} /></div>
        <div className="space-y-2"><Label htmlFor="ob-last">Last name</Label><Input id="ob-last" maxLength={100} value={last} onChange={e => setLast(e.target.value)} /></div>
      </div>}
      {needs.includes('email') && (emailSent
        ? <p role="status" className="text-sm rounded-lg border border-border p-3"><Mail className="inline h-4 w-4 mr-1" />Check your inbox and click the link to confirm your email.</p>
        : <div className="space-y-2"><Label htmlFor="ob-email"><Mail className="inline h-3.5 w-3.5 mr-1" />Email</Label><Input id="ob-email" type="email" maxLength={254} value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" /></div>)}
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      <Button type="submit" disabled={busy} className="w-full rounded-full auth-submit">{busy ? 'Saving…' : emailSent ? 'Go to dashboard' : 'Continue'}<ArrowRight className="h-4 w-4" /></Button>
      {needs.includes('email') && !emailSent && !needs.includes('name') && <Button type="button" variant="ghost" className="w-full" onClick={done}>Skip for now</Button>}
    </form>
  </motion.div></main>;
}
