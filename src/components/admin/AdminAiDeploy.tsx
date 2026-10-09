import { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useServerFn } from '@tanstack/react-start';
import { Copy, Eye, Lock, Sparkles } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { revealDeployValues } from '@/lib/admin-vault.functions';

export default function AdminAiDeploy() {
  const qc = useQueryClient();
  const reveal = useServerFn(revealDeployValues);
  const { data: s } = useQuery({ queryKey: ['ai-settings'], queryFn: async () => (await supabase.from('site_settings').select('id,ai_section_enabled,ai_system_prompt').limit(1).maybeSingle()).data });
  const [enabled, setEnabled] = useState(true); const [prompt, setPrompt] = useState('');
  const [pwd, setPwd] = useState(''); const [vals, setVals] = useState<[string, string][] | null>(null); const [busy, setBusy] = useState(false);
  useEffect(() => { if (s) { setEnabled(s.ai_section_enabled); setPrompt(s.ai_system_prompt || ''); } }, [s]);

  const saveAi = async () => {
    if (!s) return;
    const { error } = await supabase.from('site_settings').update({ ai_section_enabled: enabled, ai_system_prompt: prompt }).eq('id', s.id);
    error ? toast.error(error.message) : toast.success('AI settings saved');
    qc.invalidateQueries();
  };
  const unlock = async (e: React.FormEvent) => {
    e.preventDefault(); setBusy(true);
    try { setVals(await reveal({ data: { password: pwd } })); setPwd(''); }
    catch (x) { toast.error(x instanceof Error ? x.message : 'Failed'); } finally { setBusy(false); }
  };
  const copy = (v: string) => { navigator.clipboard.writeText(v); toast.success('Copied'); };

  return <div className="space-y-8 max-w-4xl">
    <div><h1 className="font-display text-2xl font-bold">AI & Deploy</h1><p className="text-sm text-muted-foreground">Control the site AI assistant and copy the values you need for Vercel.</p></div>
    <section className="rounded-2xl border border-border p-5 space-y-4">
      <div className="flex items-center justify-between"><h2 className="font-semibold flex items-center gap-2"><Sparkles className="h-4 w-4 text-primary" />AI assistant</h2><Switch checked={enabled} onCheckedChange={setEnabled} aria-label="AI enabled" /></div>
      <div><p className="text-sm font-medium mb-1">System prompt</p><Textarea rows={8} value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder="You are Bnoy Studio's helpful assistant…" /><p className="text-xs text-muted-foreground mt-1">Tells the assistant how to talk and what it knows. Leave empty for the default.</p></div>
      <Button onClick={saveAi}>Save AI settings</Button>
    </section>
    <section className="rounded-2xl border border-border p-5 space-y-4">
      <h2 className="font-semibold flex items-center gap-2"><Lock className="h-4 w-4 text-primary" />Deploy credentials</h2>
      {!vals ? <form onSubmit={unlock} className="flex flex-wrap gap-2"><Input type="password" required placeholder="Re-enter your password" value={pwd} onChange={(e) => setPwd(e.target.value)} className="flex-1 min-w-48" /><Button disabled={busy}><Eye className="h-4 w-4 mr-1" />{busy ? 'Checking…' : 'Unlock'}</Button></form>
        : <div className="divide-y divide-border">{vals.map(([k, v]) => <div key={k} className="flex items-center gap-3 py-2.5"><div className="min-w-0 flex-1"><p className="text-xs font-semibold text-muted-foreground">{k}</p><p className="font-mono text-sm break-all">{v}</p></div>{!k.startsWith('Secrets') && <Button size="icon" variant="ghost" aria-label={`Copy ${k}`} onClick={() => copy(v)}><Copy className="h-4 w-4" /></Button>}</div>)}
          <Button variant="outline" className="mt-3" onClick={() => copy(vals.filter(([k]) => /^[A-Z_]+$/.test(k)).map(([k, v]) => `${k}="${v}"`).join('\n'))}>Copy all as .env</Button></div>}
    </section>
  </div>;
}
