import { useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { requestEmailLink } from '@/lib/truecaller.functions';
import TruecallerButton from '@/components/TruecallerButton';
import { useToast } from '@/hooks/use-toast';
export default function IdentitySettings() {
  const { user } = useAuthStore(); const { toast } = useToast(); const [email, setEmail] = useState(''); const [busy, setBusy] = useState(false);
  if (!user) return null;
  const hasEmail = user.email && !user.email.endsWith('@phone.bnoy.invalid');
  return <section className="border-y border-border py-5 my-6 space-y-4"><h2 className="text-lg font-semibold">Verified identity</h2><p className="text-sm text-muted-foreground">{hasEmail ? user.email : 'Add your email'}{user.phone ? ` · ${user.phone}` : ''}</p>
    {!hasEmail && <form className="flex flex-wrap gap-2" onSubmit={async e => { e.preventDefault(); setBusy(true); try { await requestEmailLink({ data: { email } }); toast({ title: 'Confirm your email', description: 'Check your inbox to finish linking.' }); } catch (err) { toast({ title: 'Link could not complete', description: err instanceof Error ? err.message : 'Try again.', variant: 'destructive' }); } finally { setBusy(false); } }}><Input aria-label="Email to link" type="email" required value={email} onChange={e => setEmail(e.target.value)} className="flex-1 min-w-48" /><Button disabled={busy}>Add email</Button></form>}
    {!user.phone && <TruecallerButton link />}
  </section>;
}