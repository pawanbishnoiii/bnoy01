import { createFileRoute, useNavigate, Link } from '@tanstack/react-router';
import { useEffect, useRef, useState } from 'react';
import { useServerFn } from '@tanstack/react-start';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, ArrowRight, ArrowLeft, Camera, Check, Globe, Smartphone, Monitor, Apple, Workflow, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/store/authStore';
import { requestEmailLink } from '@/lib/truecaller.functions';

export const Route = createFileRoute('/onboarding')({
  validateSearch: (s: Record<string, unknown>) => ({ needs: typeof s.needs === 'string' ? s.needs : '' }),
  head: () => ({ meta: [
    { title: 'Set up your profile — Bnoy Studios' },
    { name: 'description', content: 'Three quick steps to personalise your Bnoy Studios account.' },
    { property: 'og:title', content: 'Set up your profile — Bnoy Studios' },
    { property: 'og:description', content: 'Add your photo, details and interests in three quick steps.' },
    { property: 'og:type', content: 'website' }, { name: 'twitter:card', content: 'summary' }, { name: 'robots', content: 'noindex' },
  ] }),
  component: Onboarding,
});

const PREFS = [
  { id: 'web', label: 'Web', icon: Globe }, { id: 'app', label: 'App', icon: Smartphone },
  { id: 'windows', label: 'Windows', icon: Monitor }, { id: 'mac', label: 'Mac', icon: Apple },
  { id: 'automations', label: 'Automations', icon: Workflow }, { id: 'other', label: 'Other', icon: Sparkles },
];
const STEPS = ['Photo', 'About you', 'Interests'];

function Onboarding() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const linkEmail = useServerFn(requestEmailLink);
  const fileRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState(0);
  const [avatar, setAvatar] = useState(''); const [name, setName] = useState('');
  const [gender, setGender] = useState(''); const [age, setAge] = useState('');
  const [email, setEmail] = useState(''); const [hasEmail, setHasEmail] = useState(false);
  const [prefs, setPrefs] = useState<string[]>([]);
  const [busy, setBusy] = useState(false); const [error, setError] = useState(''); const [emailSent, setEmailSent] = useState(false);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    supabase.from('profiles').select('name, avatar_url, gender, age, email, preferences').eq('id', user.id).maybeSingle().then(({ data }) => {
      if (data) {
        setName(data.name ?? ''); setAvatar(data.avatar_url ?? ''); setGender(data.gender ?? '');
        setAge(data.age ? String(data.age) : ''); setHasEmail(!!data.email); setEmail(data.email ?? ''); setPrefs(data.preferences ?? []);
      }
      setLoading(false);
    });
  }, [user]);

  const upload = async (file: File) => {
    if (!user) return;
    if (file.size > 5 * 1024 * 1024) { setError('Photo must be under 5 MB.'); return; }
    setBusy(true); setError('');
    const path = `${user.id}/avatar-${Date.now()}.${file.name.split('.').pop() || 'jpg'}`;
    const { error: e } = await supabase.storage.from('avatars').upload(path, file, { upsert: true, cacheControl: '3600' });
    if (e) setError(e.message);
    else {
      const { data: s } = await supabase.storage.from('avatars').createSignedUrl(path, 60 * 60 * 24 * 365);
      const url = s?.signedUrl ?? supabase.storage.from('avatars').getPublicUrl(path).data.publicUrl;
      setAvatar(url); await supabase.from('profiles').update({ avatar_url: url }).eq('id', user.id);
    }
    setBusy(false);
  };

  const next = async () => {
    if (!user) return; setError('');
    if (step === 1) {
      if (!name.trim()) return setError('Please enter your name.');
      const a = age ? Number(age) : null;
      if (a !== null && (a < 13 || a > 120)) return setError('Age must be between 13 and 120.');
      setBusy(true);
      const { error: e } = await supabase.from('profiles').update({ name: name.trim().slice(0, 100), gender: gender || null, age: a }).eq('id', user.id);
      if (!e && !hasEmail && email && !emailSent) { try { await linkEmail({ data: { email } }); setEmailSent(true); } catch (err) { setError(err instanceof Error ? err.message : 'Email link failed'); } }
      setBusy(false); if (e) return setError(e.message);
    }
    if (step === 2) {
      setBusy(true);
      const { error: e } = await supabase.from('profiles').update({ preferences: prefs, onboarded: true }).eq('id', user.id);
      setBusy(false); if (e) return setError(e.message);
      return navigate({ to: '/dashboard', replace: true });
    }
    setStep(s => s + 1);
  };

  if (!user && !loading) return <main className="auth-page"><div className="auth-card p-8 text-center space-y-4"><p>Please sign in to finish your profile.</p><Button asChild><Link to="/login">Sign in</Link></Button></div></main>;

  return <main className="auth-page"><motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="auth-card !max-w-md p-6 sm:p-8 space-y-6">
    <div className="flex items-center gap-2">
      {STEPS.map((s, i) => <div key={s} className="flex-1 space-y-1.5">
        <div className="h-1.5 rounded-full bg-muted overflow-hidden"><motion.div className="h-full bg-primary" initial={false} animate={{ width: i <= step ? '100%' : '0%' }} /></div>
        <p className={`text-[11px] ${i === step ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>{i + 1}. {s}</p>
      </div>)}
    </div>

    {loading ? <div className="space-y-4"><Skeleton className="h-24 w-24 rounded-full mx-auto" /><Skeleton className="h-10 w-full" /><Skeleton className="h-10 w-full" /></div> :
    <AnimatePresence mode="wait">
      <motion.div key={step} initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }} transition={{ duration: 0.25 }} className="space-y-5">
        {step === 0 && <>
          <div className="space-y-1 text-center"><h1 className="font-display text-2xl font-semibold">Add your photo</h1><p className="text-sm text-muted-foreground">Help the team recognise you.</p></div>
          <button type="button" onClick={() => fileRef.current?.click()} className="relative mx-auto block h-28 w-28 rounded-full border-2 border-dashed border-border overflow-hidden hover:border-primary transition-colors" aria-label="Upload profile photo">
            {avatar ? <img src={avatar} alt="Your profile" className="h-full w-full object-cover" /> : <Camera className="h-8 w-8 mx-auto text-muted-foreground" />}
            <span className="absolute bottom-1 right-1 rounded-full bg-primary p-1.5 text-primary-foreground"><Camera className="h-3.5 w-3.5" /></span>
          </button>
          <input ref={fileRef} type="file" accept="image/*" hidden onChange={e => e.target.files?.[0] && upload(e.target.files[0])} />
        </>}
        {step === 1 && <>
          <div className="space-y-1"><h1 className="font-display text-2xl font-semibold">About you</h1><p className="text-sm text-muted-foreground">Just the basics.</p></div>
          <div className="space-y-2"><Label htmlFor="ob-name">Full name</Label><Input id="ob-name" maxLength={100} value={name} onChange={e => setName(e.target.value)} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2"><Label>Gender</Label><div className="flex flex-wrap gap-1.5">{['male', 'female', 'other'].map(g => <button type="button" key={g} onClick={() => setGender(g)} className={`rounded-full border px-3 py-1 text-xs capitalize ${gender === g ? 'border-primary bg-primary/10 text-primary' : 'border-border'}`}>{g}</button>)}</div></div>
            <div className="space-y-2"><Label htmlFor="ob-age">Age</Label><Input id="ob-age" type="number" min={13} max={120} value={age} onChange={e => setAge(e.target.value)} /></div>
          </div>
          {hasEmail ? <p className="text-sm text-muted-foreground"><Mail className="inline h-4 w-4 mr-1" />{email}</p>
            : emailSent ? <p role="status" className="text-sm rounded-lg border border-border p-3"><Mail className="inline h-4 w-4 mr-1" />Check your inbox to confirm your email.</p>
            : <div className="space-y-2"><Label htmlFor="ob-email">Email</Label><Input id="ob-email" type="email" maxLength={254} value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" /></div>}
        </>}
        {step === 2 && <>
          <div className="space-y-1"><h1 className="font-display text-2xl font-semibold">What interests you?</h1><p className="text-sm text-muted-foreground">Pick all that apply.</p></div>
          <div className="grid grid-cols-3 gap-2">{PREFS.map(p => { const on = prefs.includes(p.id); return (
            <motion.button whileTap={{ scale: 0.95 }} type="button" key={p.id} onClick={() => setPrefs(v => on ? v.filter(x => x !== p.id) : [...v, p.id])}
              className={`relative flex flex-col items-center gap-1.5 rounded-xl border p-3 text-xs ${on ? 'border-primary bg-primary/10 text-primary' : 'border-border hover:border-primary/50'}`}>
              {on && <Check className="absolute top-1.5 right-1.5 h-3 w-3" />}<p.icon className="h-5 w-5" />{p.label}
            </motion.button>); })}</div>
        </>}
      </motion.div>
    </AnimatePresence>}

    {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
    <div className="flex gap-2">
      {step > 0 && <Button type="button" variant="outline" onClick={() => setStep(s => s - 1)} className="rounded-full"><ArrowLeft className="h-4 w-4" /></Button>}
      <Button type="button" disabled={busy || loading} onClick={next} className="flex-1 rounded-full auth-submit">{busy ? 'Saving…' : step === 2 ? 'Finish' : step === 0 && !avatar ? 'Skip' : 'Continue'}<ArrowRight className="h-4 w-4" /></Button>
    </div>
  </motion.div></main>;
}
