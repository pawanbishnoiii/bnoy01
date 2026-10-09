import { useState } from 'react';
import { useServerFn } from '@tanstack/react-start';
import { useAuthStore } from '@/store/authStore';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { sendEmailCode, verifyEmailCode } from '@/lib/email-link.functions';
import TruecallerButton from '@/components/TruecallerButton';
import { useToast } from '@/hooks/use-toast';

export default function IdentitySettings() {
  const { user } = useAuthStore(); const { toast } = useToast();
  const send = useServerFn(sendEmailCode); const verify = useServerFn(verifyEmailCode);
  const [email, setEmail] = useState(''); const [code, setCode] = useState('');
  const [step, setStep] = useState<'idle' | 'code'>('idle'); const [busy, setBusy] = useState(false); const [editing, setEditing] = useState(false);
  if (!user) return null;
  const hasEmail = !!user.email && !user.email.endsWith('.invalid');
  const err = (e: unknown) => toast({ title: 'Could not continue', description: e instanceof Error ? e.message : 'Try again.', variant: 'destructive' });
  const showForm = !hasEmail || editing;
  return <section className="border-y border-border py-5 my-6 space-y-4">
    <h2 className="text-lg font-semibold">Verified identity</h2>
    <p className="text-sm text-muted-foreground">{hasEmail ? user.email : 'No email yet — add one to get receipts and updates.'}{user.phone ? ` · ${user.phone}` : ''}
      {hasEmail && !editing && <button className="ml-2 underline" onClick={() => setEditing(true)}>Change email</button>}</p>
    {showForm && step === 'idle' && <form className="flex flex-wrap gap-2" onSubmit={async (e) => { e.preventDefault(); setBusy(true); try { await send({ data: { email } }); setStep('code'); toast({ title: 'Code sent', description: `Check ${email}` }); } catch (x) { err(x); } finally { setBusy(false); } }}>
      <Input aria-label="Email" type="email" required placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} className="flex-1 min-w-48" />
      <Button disabled={busy}>{busy ? 'Sending…' : 'Send code'}</Button>
    </form>}
    {step === 'code' && <form className="flex flex-wrap gap-2" onSubmit={async (e) => { e.preventDefault(); setBusy(true); try { await verify({ data: { email, code } }); await supabase.auth.refreshSession(); toast({ title: 'Email added 🎉', description: 'A welcome email is on its way.' }); setStep('idle'); setEditing(false); } catch (x) { err(x); } finally { setBusy(false); } }}>
      <Input aria-label="6-digit code" inputMode="numeric" maxLength={6} required placeholder="123456" value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))} className="w-40 tracking-[0.4em] text-center" />
      <Button disabled={busy}>{busy ? 'Checking…' : 'Verify'}</Button>
      <Button type="button" variant="ghost" onClick={() => setStep('idle')}>Back</Button>
    </form>}
    {!user.phone && <TruecallerButton link />}
  </section>;
}
