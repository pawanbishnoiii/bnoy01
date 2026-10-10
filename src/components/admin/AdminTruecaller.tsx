import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Save, Copy, ExternalLink } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';

export default function AdminTruecaller() {
  const { toast } = useToast();
  const runtimeOrigin = typeof window === 'undefined' ? '' : window.location.origin;
  const defaultOrigin = 'https://bnoyservices.vercel.app';
  const [domain, setDomain] = useState(defaultOrigin);
  const [callback, setCallback] = useState('https://bnoy01.lovable.app/auth/true-sdk');
  const [busy, setBusy] = useState(false);
  const [appKey, setAppKey] = useState('');
  const [enabled, setEnabled] = useState(false);
  const { data, error, refetch } = useQuery({ queryKey: ['admin-truecaller'], queryFn: async () => {
    const { data, error } = await supabase.from('truecaller_settings').select('*').eq('id', true).maybeSingle();
    if (error) throw error;
    return data;
  } });
  const { data: site } = useQuery({ queryKey: ['site-settings-domain'], queryFn: async () => (await supabase.from('site_settings').select('id,site_url').limit(1).maybeSingle()).data });
  const { data: logs = [], refetch: refetchLogs } = useQuery({ queryKey: ['admin-truecaller-logs'], queryFn: async () => {
    const { data, error } = await supabase.from('truecaller_logs').select('*').order('created_at', { ascending: false }).limit(50);
    if (error) throw error;
    return data || [];
  } });
  useEffect(() => { if (data) { setDomain(data.app_domain || defaultOrigin); setCallback(data.callback_url || `${defaultOrigin}/auth/true-sdk`); setAppKey(data.app_key); setEnabled(data.enabled); } }, [data]);
  const domains = domain.split(/[\n,]+/).map(d => d.trim()).filter(Boolean);
  const primaryDomain = domains[0] || defaultOrigin;
  const deployedOrigin = runtimeOrigin.startsWith('https://') ? runtimeOrigin : site?.site_url || primaryDomain;
  const callbackForPrimary = `${primaryDomain.replace(/\/+$/, '')}/auth/true-sdk`;
  return <div className="max-w-3xl space-y-6"><h1 className="text-2xl font-bold">Truecaller Settings</h1>
    {error && <p role="alert" className="text-destructive">Settings could not load.</p>}
    <div className="rounded-xl border border-border bg-muted/40 p-4 text-sm">
      <div className="flex flex-wrap items-center justify-between gap-2"><p className="font-semibold">Vercel setup checklist</p><a href="https://developer.truecaller.com/" target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-primary hover:underline">Truecaller Console <ExternalLink className="h-3.5 w-3.5" /></a></div>
      <ul className="mt-2 list-disc space-y-1 pl-5 text-muted-foreground">
        <li>Add this exact site domain in Truecaller Developer Console: <span className="font-mono text-foreground">{deployedOrigin}</span></li>
        <li>Register callback URL: <span className="font-mono text-foreground">{`${deployedOrigin}/auth/true-sdk`}</span></li>
        <li>In Vercel, set <span className="font-mono text-foreground">SUPABASE_URL</span> and a server-only key as <span className="font-mono text-foreground">SUPABASE_SECRET_KEY</span> (preferred) or <span className="font-mono text-foreground">SUPABASE_SERVICE_ROLE_KEY</span>.</li>
      </ul>
      <p className="mt-3 rounded-lg border border-amber-300 bg-amber-50 p-3 text-xs text-amber-900">Lovable's <span className="font-mono">sb_publishable_...</span> key cannot create a verified Auth user or session. Open the same project in Supabase Dashboard, then copy the server <span className="font-mono">service_role</span> (legacy) or <span className="font-mono">sb_secret_...</span> key. Never put it in a <span className="font-mono">VITE_</span> variable.</p>
    </div>
    <form className="space-y-5" onSubmit={async e => {
      e.preventDefault();
      try {
        const cleanDomains = domain.split(/[\n,]+/).map(d => d.trim()).filter(Boolean).map((d) => {
          const origin = new URL(d);
          if (origin.protocol !== 'https:' || origin.pathname !== '/') throw new Error('Use HTTPS root domains only, for example https://bnoyservices.vercel.app');
          return origin.origin;
        });
        const url = new URL(callback);
        if (!cleanDomains.length) throw new Error('Add at least one registered HTTPS domain.');
        if (url.protocol !== 'https:' || !cleanDomains.includes(url.origin) || !['/auth/true-sdk', '/api/public/truecaller'].includes(url.pathname)) throw new Error('Use a callback on one of the registered domains: /auth/true-sdk.');
        setBusy(true);
        if (enabled && !appKey.trim()) throw new Error('Enter your registered app key.');
        const { error } = await supabase.from('truecaller_settings').upsert({ id: true, app_domain: cleanDomains.join('\n'), callback_url: url.href, app_key: appKey.trim(), enabled });
        if (error) throw error;
        const { error: siteError } = site?.id
          ? await supabase.from('site_settings').update({ site_url: cleanDomains[0] }).eq('id', site.id)
          : await supabase.from('site_settings').insert({ site_url: cleanDomains[0] });
        if (siteError) throw siteError;
        await refetch(); toast({ title: 'Truecaller settings saved' });
      } catch (err) { toast({ title: 'Save failed', description: err instanceof Error ? err.message : 'Please retry.', variant: 'destructive' }); }
      finally { setBusy(false); }
    }}>
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <Label htmlFor="true-domain">Registered site domains</Label>
          <Button type="button" variant="outline" size="sm" onClick={() => {
            const next = Array.from(new Set([deployedOrigin, ...domains])).join('\n');
            setDomain(next);
            setCallback(`${deployedOrigin}/auth/true-sdk`);
          }}>Use deployed domain</Button>
        </div>
        <Textarea id="true-domain" required value={domain} onChange={e => setDomain(e.target.value)} rows={Math.max(2, domains.length)} placeholder="https://bnoyservices.vercel.app" />
        <p className="text-xs text-muted-foreground">One HTTPS root domain per line. Truecaller must also have each same domain registered in its developer console.</p>
      </div>
      <div className="space-y-2"><Label htmlFor="true-key">App key</Label><Input id="true-key" value={appKey} onChange={e => setAppKey(e.target.value)} maxLength={200} required={enabled} /></div>
      <div className="flex gap-3 items-center"><Switch id="true-enabled" checked={enabled} onCheckedChange={setEnabled} /><Label htmlFor="true-enabled">Enable Truecaller</Label></div>
      <div className="space-y-2"><Label htmlFor="true-callback">Registered callback URL</Label><div className="flex gap-2"><Input id="true-callback" type="url" required value={callback} onChange={e => setCallback(e.target.value)} /><Button type="button" variant="outline" size="icon" title="Use primary callback" aria-label="Use primary callback" onClick={() => setCallback(callbackForPrimary)}><ExternalLink className="h-4 w-4" /></Button><Button type="button" variant="outline" size="icon" title="Copy callback URL" aria-label="Copy callback URL" onClick={async () => { try { await navigator.clipboard.writeText(callback); toast({ title: 'Callback copied' }); } catch { toast({ title: 'Copy unavailable', variant: 'destructive' }); } }}><Copy className="h-4 w-4" /></Button></div></div>
      <p className="text-sm text-muted-foreground">Android mobile web requires the Truecaller app and the exact HTTPS callback registered in Truecaller. iOS mobile web is not supported by Truecaller.</p>
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
