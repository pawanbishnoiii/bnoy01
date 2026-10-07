import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Save, Copy } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

export default function AdminTruecaller() {
  const { toast } = useToast();
  const [domain, setDomain] = useState('https://bnoy01.lovable.app');
  const [callback, setCallback] = useState('https://bnoy01.lovable.app/auth/true-sdk');
  const [busy, setBusy] = useState(false);
  const { data, error, refetch } = useQuery({ queryKey: ['admin-truecaller'], queryFn: async () => {
    const { data, error } = await supabase.from('truecaller_settings').select('*').eq('id', true).maybeSingle();
    if (error) throw error;
    return data;
  } });
  useEffect(() => { if (data) { setDomain(data.app_domain); setCallback(data.callback_url); } }, [data]);
  return <div className="max-w-2xl space-y-6"><h1 className="text-2xl font-bold">Truecaller Settings</h1>
    {error && <p role="alert" className="text-destructive">Settings could not load.</p>}
    <form className="space-y-5" onSubmit={async e => {
      e.preventDefault();
      try {
        const origin = new URL(domain); const url = new URL(callback);
        if (origin.protocol !== 'https:' || url.protocol !== 'https:' || origin.origin !== url.origin || origin.pathname !== '/') throw new Error('Use an HTTPS app domain and a callback on the same domain.');
        setBusy(true);
        const { error } = await supabase.from('truecaller_settings').upsert({ id: true, app_domain: origin.origin, callback_url: url.href });
        if (error) throw error;
        await refetch(); toast({ title: 'Truecaller settings saved' });
      } catch (err) { toast({ title: 'Save failed', description: err instanceof Error ? err.message : 'Please retry.', variant: 'destructive' }); }
      finally { setBusy(false); }
    }}>
      <div className="space-y-2"><Label htmlFor="true-domain">App domain</Label><Input id="true-domain" type="url" required value={domain} onChange={e => setDomain(e.target.value)} /></div>
      <div className="space-y-2"><Label htmlFor="true-callback">Registered callback URL</Label><div className="flex gap-2"><Input id="true-callback" type="url" required value={callback} onChange={e => setCallback(e.target.value)} /><Button type="button" variant="outline" size="icon" title="Copy callback URL" aria-label="Copy callback URL" onClick={async () => { try { await navigator.clipboard.writeText(callback); toast({ title: 'Callback copied' }); } catch { toast({ title: 'Copy unavailable', variant: 'destructive' }); } }}><Copy className="h-4 w-4" /></Button></div></div>
      <p className="text-sm text-muted-foreground">Truecaller verification is not connected yet. These settings save your registered URLs; they do not enable sign-in.</p>
      <Button type="submit" disabled={busy}><Save className="h-4 w-4" />{busy ? 'Saving…' : 'Save settings'}</Button>
    </form>
  </div>;
}