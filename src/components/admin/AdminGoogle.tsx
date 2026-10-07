import { useEffect, useState } from 'react';
import { Search, BarChart3, ShieldCheck, Copy, ExternalLink, Upload, KeyRound, Loader2 } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const KEYS = {
  gsc: 'bnoy_gsc_verification',
  ga: 'bnoy_ga4_id',
  gtm: 'bnoy_gtm_id',
};

/** Admin Google integrations: GSC meta + HTML file, GA4/GTM, and Google login config. */
export default function AdminGoogle() {
  const qc = useQueryClient();
  const [gsc, setGsc] = useState('');
  const [ga, setGa] = useState('');
  const [gtm, setGtm] = useState('');
  const [saving, setSaving] = useState(false);

  const { data: site } = useQuery({
    queryKey: ['site-settings'],
    queryFn: async () => (await supabase.from('site_settings').select('*').limit(1).maybeSingle()).data,
  });
  const { data: auth } = useQuery({
    queryKey: ['auth-settings'],
    queryFn: async () => (await supabase.from('auth_settings').select('*').limit(1).maybeSingle()).data,
  });

  const [fileName, setFileName] = useState('');
  const [fileBody, setFileBody] = useState('');
  const [clientId, setClientId] = useState('');
  const [callback, setCallback] = useState('');
  const [mode, setMode] = useState('lovable');
  const [googleOn, setGoogleOn] = useState(true);

  useEffect(() => {
    setGsc(localStorage.getItem(KEYS.gsc) || '');
    setGa(localStorage.getItem(KEYS.ga) || '');
    setGtm(localStorage.getItem(KEYS.gtm) || '');
  }, []);

  useEffect(() => {
    if (!site) return;
    setFileName((site as any).google_verify_file_name || '');
    setFileBody((site as any).google_verify_file_content || '');
  }, [site]);

  useEffect(() => {
    if (!auth) return;
    setClientId((auth as any).google_client_id || '');
    setCallback((auth as any).google_callback_url || `${window.location.origin}/`);
    setMode((auth as any).google_auth_mode || 'lovable');
    setGoogleOn((auth as any).google_login_enabled !== false);
  }, [auth]);

  const saveTracking = () => {
    localStorage.setItem(KEYS.gsc, gsc.trim());
    localStorage.setItem(KEYS.ga, ga.trim());
    localStorage.setItem(KEYS.gtm, gtm.trim());
    injectGoogle();
    toast.success('Google tracking saved', { description: 'Tracking is live across all pages.' });
  };

  const saveVerifyFile = async () => {
    if (!fileName || !fileBody) return toast.error('Upload or paste the verification file first');
    setSaving(true);
    const id = (site as any)?.id;
    const payload = { google_verify_file_name: fileName.trim(), google_verify_file_content: fileBody };
    const { error } = id
      ? await supabase.from('site_settings').update(payload).eq('id', id)
      : await supabase.from('site_settings').insert(payload as any);
    setSaving(false);
    if (error) return toast.error('Could not save', { description: error.message });
    qc.invalidateQueries({ queryKey: ['site-settings'] });
    toast.success('Verification file live', { description: `/${fileName.trim()}` });
  };

  const saveAuth = async () => {
    setSaving(true);
    const id = (auth as any)?.id;
    const payload = {
      google_client_id: clientId.trim() || null,
      google_callback_url: callback.trim() || null,
      google_auth_mode: mode,
      google_login_enabled: googleOn,
    };
    const { error } = id
      ? await supabase.from('auth_settings').update(payload).eq('id', id)
      : await supabase.from('auth_settings').insert(payload as any);
    setSaving(false);
    if (error) return toast.error('Could not save', { description: error.message });
    qc.invalidateQueries({ queryKey: ['auth-settings'] });
    toast.success('Google login settings saved');
  };

  const onPickFile = async (f?: File | null) => {
    if (!f) return;
    setFileName(f.name);
    setFileBody(await f.text());
  };

  const copy = (v: string) => { navigator.clipboard.writeText(v); toast('Copied to clipboard'); };

  return (
    <div className="space-y-6 min-w-0">
      <div>
        <h1 className="font-display text-2xl font-bold flex items-center gap-2"><Search className="h-6 w-6 text-iris" /> Google Integrations</h1>
        <p className="text-sm text-muted-foreground mt-1">Verify Search Console (meta or HTML file), plug in GA4 / GTM, and manage Google login.</p>
      </div>

      <Card title="Search Console — meta tag" icon={<ShieldCheck className="h-5 w-5 text-iris" />}>
        <Label className="text-xs uppercase tracking-widest font-bold">Verification code (content value)</Label>
        <Input value={gsc} onChange={(e) => setGsc(e.target.value)} placeholder="abc123…  or full <meta> tag" />
        <p className="text-xs text-muted-foreground">Paste either just the content value, or the entire <code>&lt;meta&gt;</code> tag — we'll extract it.</p>
        <a className="inline-flex items-center gap-1 text-xs font-semibold text-iris hover:underline" target="_blank" rel="noreferrer" href="https://search.google.com/search-console/welcome">
          Open Search Console <ExternalLink className="h-3 w-3" />
        </a>
      </Card>

      <Card title="Search Console — HTML file" icon={<Upload className="h-5 w-5 text-iris" />}>
        <Label className="text-xs uppercase tracking-widest font-bold">Upload googleXXXX.html</Label>
        <Input type="file" accept=".html,text/html" onChange={(e) => onPickFile(e.target.files?.[0])} />
        <div className="grid sm:grid-cols-2 gap-3">
          <div className="space-y-1 min-w-0">
            <Label className="text-xs">File name</Label>
            <Input value={fileName} onChange={(e) => setFileName(e.target.value)} placeholder="google1234abcd.html" />
          </div>
          <div className="space-y-1 min-w-0">
            <Label className="text-xs">File content</Label>
            <Input value={fileBody} onChange={(e) => setFileBody(e.target.value)} placeholder="google-site-verification: google1234abcd.html" />
          </div>
        </div>
        {fileName && (
          <a href={`/${fileName}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs font-semibold text-iris hover:underline">
            Test /{fileName} <ExternalLink className="h-3 w-3" />
          </a>
        )}
        <Button onClick={saveVerifyFile} disabled={saving} className="gradient-iris text-white">
          {saving && <Loader2 className="h-4 w-4 mr-1 animate-spin" />} Publish verification file
        </Button>
      </Card>

      <Card title="Google Analytics 4" icon={<BarChart3 className="h-5 w-5 text-iris" />}>
        <Label className="text-xs uppercase tracking-widest font-bold">GA4 Measurement ID</Label>
        <Input value={ga} onChange={(e) => setGa(e.target.value)} placeholder="G-XXXXXXX" />
      </Card>

      <Card title="Google Tag Manager" icon={<BarChart3 className="h-5 w-5 text-iris" />}>
        <Label className="text-xs uppercase tracking-widest font-bold">GTM Container ID</Label>
        <Input value={gtm} onChange={(e) => setGtm(e.target.value)} placeholder="GTM-XXXXXXX" />
      </Card>

      <div className="flex flex-wrap items-center gap-3">
        <Button onClick={saveTracking} className="gradient-iris text-white">Save & activate tracking</Button>
        {gsc && <Button variant="outline" onClick={() => copy(`<meta name="google-site-verification" content="${extractGsc(gsc)}" />`)}><Copy className="h-4 w-4 mr-1" /> Copy meta tag</Button>}
      </div>

      <Card title="Google login" icon={<KeyRound className="h-5 w-5 text-iris" />}>
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold">Enable Google sign-in</p>
            <p className="text-xs text-muted-foreground">Turn off to hide the Google button on login/signup.</p>
          </div>
          <Switch checked={googleOn} onCheckedChange={setGoogleOn} />
        </div>
        <div className="grid sm:grid-cols-2 gap-3">
          <div className="space-y-1 min-w-0">
            <Label className="text-xs uppercase tracking-widest font-bold">Mode</Label>
            <select value={mode} onChange={(e) => setMode(e.target.value)} className="h-10 w-full rounded-md border border-border bg-white px-3 text-sm">
              <option value="lovable">Managed (default)</option>
              <option value="custom">Custom OAuth client</option>
            </select>
          </div>
          <div className="space-y-1 min-w-0">
            <Label className="text-xs uppercase tracking-widest font-bold">Callback URL</Label>
            <Input value={callback} onChange={(e) => setCallback(e.target.value)} placeholder={`${window.location.origin}/`} />
          </div>
        </div>
        {mode === 'custom' && (
          <div className="space-y-1">
            <Label className="text-xs uppercase tracking-widest font-bold">Google Client ID</Label>
            <Input value={clientId} onChange={(e) => setClientId(e.target.value)} placeholder="xxxx.apps.googleusercontent.com" />
            <p className="text-xs text-muted-foreground">The client secret is stored securely on the backend — never in the browser.</p>
          </div>
        )}
        <Button onClick={saveAuth} disabled={saving} className="gradient-iris text-white">
          {saving && <Loader2 className="h-4 w-4 mr-1 animate-spin" />} Save Google login
        </Button>
      </Card>
    </div>
  );
}

function Card({ title, icon, children }: any) {
  return (
    <div className="bg-white border border-border rounded-2xl p-5 sm:p-6 shadow-card space-y-3 min-w-0">
      <h3 className="font-display font-bold flex items-center gap-2">{icon} {title}</h3>
      {children}
    </div>
  );
}

function extractGsc(raw: string) {
  const m = raw.match(/content=["']([^"']+)["']/);
  return m ? m[1] : raw.trim();
}

/** Injects GSC meta + GA4 + GTM into <head> from localStorage. Called on app boot + after save. */
export function injectGoogle() {
  if (typeof document === 'undefined') return;
  const gsc = extractGsc(localStorage.getItem(KEYS.gsc) || '');
  const ga = (localStorage.getItem(KEYS.ga) || '').trim();
  const gtm = (localStorage.getItem(KEYS.gtm) || '').trim();

  document.querySelectorAll('[data-bnoy-google]').forEach((n) => n.remove());

  if (gsc) {
    const m = document.createElement('meta');
    m.name = 'google-site-verification';
    m.content = gsc;
    m.setAttribute('data-bnoy-google', '1');
    document.head.appendChild(m);
  }
  if (ga) {
    const s = document.createElement('script');
    s.src = `https://www.googletagmanager.com/gtag/js?id=${ga}`;
    s.async = true;
    s.setAttribute('data-bnoy-google', '1');
    document.head.appendChild(s);
    const inline = document.createElement('script');
    inline.setAttribute('data-bnoy-google', '1');
    inline.text = `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${ga}');`;
    document.head.appendChild(inline);
  }
  if (gtm) {
    const inline = document.createElement('script');
    inline.setAttribute('data-bnoy-google', '1');
    inline.text = `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${gtm}');`;
    document.head.appendChild(inline);
  }
}
