import { useState } from 'react';
import { Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { generateListing } from '@/lib/ai-listing.functions';
import { useToast } from '@/hooks/use-toast';

type Result = { short_desc: string; full_desc: string; tags: string[]; seo_title: string };

export default function AiListingGenerator({ defaultName, onApply }: { defaultName?: string; onApply: (r: Result) => void }) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(defaultName || '');
  const [features, setFeatures] = useState('');
  const [audience, setAudience] = useState('');
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<Result | null>(null);

  const run = async () => {
    setBusy(true);
    try { setResult(await generateListing({ data: { name: name || defaultName || '', features, audience } })); }
    catch (e) { toast({ title: 'Could not generate', description: e instanceof Error ? e.message : 'Retry', variant: 'destructive' }); }
    finally { setBusy(false); }
  };

  if (!open) return (
    <Button type="button" variant="outline" onClick={() => { setName(defaultName || name); setOpen(true); }} className="gap-2 border-primary/40">
      <Sparkles className="h-4 w-4 text-primary" /> Write description with AI
    </Button>
  );

  return (
    <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 space-y-3">
      <div className="flex items-center gap-2 font-semibold"><Sparkles className="h-4 w-4 text-primary" /> AI listing writer</div>
      <div className="space-y-1"><Label>Project name</Label><Input value={name} onChange={(e) => setName(e.target.value)} /></div>
      <div className="space-y-1"><Label>Key features</Label><Textarea rows={3} value={features} onChange={(e) => setFeatures(e.target.value)} placeholder="Auth, Razorpay, admin dashboard, dark mode…" /></div>
      <div className="space-y-1"><Label>Target audience</Label><Input value={audience} onChange={(e) => setAudience(e.target.value)} placeholder="Indie hackers, agencies…" /></div>
      <div className="flex gap-2">
        <Button type="button" disabled={busy || features.length < 3 || audience.length < 2 || (name || defaultName || '').length < 2} onClick={run}>{busy ? 'Writing…' : 'Generate'}</Button>
        <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Close</Button>
      </div>
      {result && (
        <div className="space-y-2 text-sm border-t border-border pt-3">
          <p className="font-medium">{result.short_desc}</p>
          <div className="flex flex-wrap gap-1">{result.tags.map((t) => <span key={t} className="px-2 py-0.5 rounded-full bg-muted text-xs">#{t}</span>)}</div>
          <pre className="whitespace-pre-wrap text-xs text-muted-foreground max-h-48 overflow-auto">{result.full_desc}</pre>
          <Button type="button" onClick={() => { onApply(result); toast({ title: 'Applied to the form' }); }}>Use this</Button>
        </div>
      )}
    </div>
  );
}
