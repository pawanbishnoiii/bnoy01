import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Save, Copy } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';

export default function AdminTruecaller() {
  const { toast } = useToast();
  const [domain, setDomain] = useState('https://bnoy01.lovable.app');
  const [callback, setCallback] = useState('https://bnoy01.lovable.app/auth/true-sdk');
  const [busy, setBusy] = useState(false);
  const [appKey, setAppKey] = useState('');
  const [enabled, setEnabled] = useState(false);
  const { data, error, refetch } = useQuery({ queryKey: ['admin-truecaller'], queryFn: async () => {
    const { data, error } = await supabase.from('truecaller_settings').select('*').eq('id', true).maybeSingle();
    if (error) throw error;
    return data;
  } });
  const { data: logs = [], refetch: refetchLogs } = useQuery({ queryKey: ['admin-truecaller-logs'], queryFn: async () => {
    const { data, error } = await supabase.from('truecaller_logs').select('*').order('created_at', { ascending: false }).limit(50);
    if (error) throw error;
    return data || [];
  } });
  useEffect(() => { if (data) { setDomain(data.app_domain); setCallback(data.callback_url); setAppKey(data.app_key); setEnabled(data.enabled); } }, [data]);
  return <div className="max-w-2xl space-y-6"><h1 className="text-2xl font-bold">Truecaller Settings</h1>
    {error && <p role="alert" className="text-destructive">Settings could not load.</p>}
    <form className="space-y-5" onSubmit={async e => {
      e.preventDefault();
      try {
        const origin = new URL(domain); const url = new URL(callback);
        if (origin.protocol !== 'https:' || url.protocol !== 'https:' || origin.origin !== url.origin || origin.pathname !== '/') throw new Error('Use an HTTPS app domain and a callback on the same domain.');
        setBusy(true);
        if (enabled && !appKey.trim()) throw new Error('Enter your registered app key.');
        const { error } = await supabase.from('truecaller_settings').upsert({ id: true, app_domain: origin.origin, callback_url: url.href, app_key: appKey.trim(), enabled });
        if (error) throw error;
        await refetch(); toast({ title: 'Truecaller settings saved' });
      } catch (err) { toast({ title: 'Save failed', description: err instanceof Error ? err.message : 'Please retry.', variant: 'destructive' }); }
      finally { setBusy(false); }
    }}>
      <div className="space-y-2"><Label htmlFor="true-domain">App domain</Label><Input id="true-domain" type="url" required value={domain} onChange={e => setDomain(e.target.value)} /></div>
      <div className="space-y-2"><Label htmlFor="true-key">App key</Label><Input id="true-key" value={appKey} onChange={e => setAppKey(e.target.value)} maxLength={200} required={enabled} /></div>
      <div className="flex gap-3 items-center"><Switch id="true-enabled" checked={enabled} onCheckedChange={setEnabled} /><Label htmlFor="true-enabled">Enable Truecaller</Label></div>
      <div className="space-y-2"><Label htmlFor="true-callback">Registered callback URL</Label><div className="flex gap-2"><Input id="true-callback" type="url" required value={callback} onChange={e => setCallback(e.target.value)} /><Button type="button" variant="outline" size="icon" title="Copy callback URL" aria-label="Copy callback URL" onClick={async () => { try { await navigator.clipboard.writeText(callback); toast({ title: 'Callback copied' }); } catch { toast({ title: 'Copy unavailable', variant: 'destructive' }); } }}><Copy className="h-4 w-4" /></Button></div></div>
      <p className="text-sm text-muted-foreground">Android mobile web requires the Truecaller app and this exact registered HTTPS callback. iOS mobile web is not supported by Truecaller.</p>
      <Button type="submit" disabled={busy}><Save className="h-4 w-4" />{busy ? 'Saving…' : 'Save settings'}</Button>
    </form>
    <section className="space-y-3 pt-4 border-t border-border">
      <div className="flex items-center justify-between gap-2"><h2 className="text-lg font-semibold">Recent Truecaller errors</h2><div className="flex gap-2"><Button type="button" variant="outline" size="sm" onClick={() => refetchLogs()}>Refresh</Button>{logs.length > 0 && <Button type="button" variant="ghost" size="sm" onClick={async () => { if (!window.confirm('Clear all Truecaller error logs?')) return; await supabase.from('truecaller_logs').delete().not('id', 'is', null); refetchLogs(); }}>Clear</Button>}</div></div>
      {logs.length === 0 ? <p className="text-sm text-muted-foreground">No errors recorded.</p> : <ul className="divide-y divide-border text-sm">{logs.map(l => <li key={l.id} className="py-3 space-y-1">
        <div className="flex flex-wrap gap-2 text-xs text-muted-foreground"><span className="font-mono rounded bg-muted px-1.5">{l.stage}</span><span>{new Date(l.created_at).toLocaleString()}</span>{l.request_id && <span className="font-mono">{l.request_id.slice(0, 8)}</span>}</div>
        <p className="break-words">{l.message}</p>
        {l.details && <details><summary className="text-xs cursor-pointer text-muted-foreground">Details</summary><pre className="text-xs whitespace-pre-wrap break-all bg-muted p-2 rounded">{JSON.stringify(l.details, null, 2)}</pre></details>}
      </li>)}</ul>}
    </section>
  </div>;
}