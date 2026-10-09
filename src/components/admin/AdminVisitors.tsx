import { useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Globe2, Monitor, Smartphone, Tablet, Clock, Users, MapPin, Trash2, Search, Bot, Eye } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

type Session = {
  id: string; visitor_id: string; user_id: string | null; ip: string | null;
  country: string | null; region: string | null; city: string | null; postal: string | null;
  latitude: number | null; longitude: number | null; isp: string | null; timezone: string | null;
  device_type: string | null; device_name: string | null; os: string | null; browser: string | null;
  user_agent: string | null; screen: string | null; language: string | null; referrer: string | null;
  landing_page: string | null; last_page: string | null; page_views: number; total_seconds: number;
  first_seen: string; last_seen: string;
};

const fmtDur = (s: number) => (s < 60 ? `${s}s` : s < 3600 ? `${Math.floor(s / 60)}m ${s % 60}s` : `${Math.floor(s / 3600)}h ${Math.floor((s % 3600) / 60)}m`);
const DeviceIcon = ({ t }: { t: string | null }) =>
  t === 'mobile' ? <Smartphone className="h-4 w-4" /> : t === 'tablet' ? <Tablet className="h-4 w-4" /> : t === 'bot' ? <Bot className="h-4 w-4" /> : <Monitor className="h-4 w-4" />;

function topN(rows: Session[], key: keyof Session, n = 6) {
  const m = new Map<string, number>();
  rows.forEach((r) => { const k = (r[key] as string) || 'Unknown'; m.set(k, (m.get(k) || 0) + 1); });
  return [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, n).map(([name, value]) => ({ name, value }));
}

/** Every visit, including people who never sign in: IP location, device, pages and time on site. */
export default function AdminVisitors() {
  const qc = useQueryClient();
  const [range, setRange] = useState<1 | 7 | 30 | 90>(7);
  const [q, setQ] = useState('');
  const [onlyGuests, setOnlyGuests] = useState(false);
  const [device, setDevice] = useState('all');
  const [open, setOpen] = useState<Session | null>(null);

  const since = useMemo(() => new Date(Date.now() - range * 86400_000).toISOString(), [range]);
  const { data: rows = [], isLoading, error } = useQuery({
    queryKey: ['admin-visitors', range],
    queryFn: async () => {
      const { data, error } = await supabase.from('visitor_sessions').select('*').gte('last_seen', since).order('last_seen', { ascending: false }).limit(1000);
      if (error) throw error;
      return data as Session[];
    },
    refetchInterval: 30_000,
  });
  const { data: profiles = [] } = useQuery({
    queryKey: ['admin-visitor-profiles'],
    queryFn: async () => (await supabase.from('profiles').select('id, name, email')).data ?? [],
  });
  const { data: pages = [] } = useQuery({
    queryKey: ['admin-visitor-pages', open?.id],
    enabled: !!open,
    queryFn: async () => { if (!open) return []; return (await supabase.from('page_views').select('*').eq('session_id', open.id).order('created_at')).data ?? []; },
  });
  const nameOf = (id: string | null) => {
    const p = profiles.find((x: any) => x.id === id) as any;
    return p ? p.name || p.email : null;
  };

  const filtered = rows.filter((r) => {
    if (onlyGuests && r.user_id) return false;
    if (device !== 'all' && r.device_type !== device) return false;
    if (!q) return true;
    const hay = [r.ip, r.city, r.region, r.country, r.device_name, r.os, r.browser, r.isp, r.referrer, r.landing_page, r.last_page, nameOf(r.user_id)].join(' ').toLowerCase();
    return hay.includes(q.toLowerCase());
  });

  const humans = rows.filter((r) => r.device_type !== 'bot');
  const uniqueVisitors = new Set(humans.map((r) => r.visitor_id)).size;
  const avgTime = humans.length ? Math.round(humans.reduce((a, r) => a + r.total_seconds, 0) / humans.length) : 0;
  const avgPages = humans.length ? (humans.reduce((a, r) => a + r.page_views, 0) / humans.length).toFixed(1) : '0';
  const liveNow = rows.filter((r) => Date.now() - new Date(r.last_seen).getTime() < 5 * 60_000).length;
  const guests = humans.filter((r) => !r.user_id).length;

  const remove = async (id: string) => {
    const { error } = await supabase.from('visitor_sessions').delete().eq('id', id);
    if (error) return toast.error(error.message);
    qc.invalidateQueries({ queryKey: ['admin-visitors'] });
    setOpen(null);
  };

  const exportCsv = () => {
    const cols: (keyof Session)[] = ['first_seen', 'last_seen', 'ip', 'city', 'region', 'country', 'isp', 'device_type', 'device_name', 'os', 'browser', 'screen', 'language', 'referrer', 'landing_page', 'page_views', 'total_seconds', 'user_id'];
    const csv = [cols.join(','), ...filtered.map((r) => cols.map((c) => JSON.stringify(r[c] ?? '')).join(','))].join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    a.download = `visitors-${range}d.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  return (
    <div className="space-y-6 min-w-0">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl font-bold flex items-center gap-2"><Globe2 className="h-6 w-6 text-primary" /> Visitors</h2>
          <p className="text-sm text-muted-foreground">Everyone who opens your site — signed in or not. Location comes from their IP address.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {([1, 7, 30, 90] as const).map((d) => (
            <Button key={d} size="sm" variant={range === d ? 'default' : 'outline'} onClick={() => setRange(d)}>{d === 1 ? '24h' : `${d} days`}</Button>
          ))}
          <Button size="sm" variant="outline" onClick={exportCsv}>Export CSV</Button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-6 gap-3">
        <Stat icon={<Users className="h-4 w-4" />} label="Unique visitors" value={uniqueVisitors} />
        <Stat icon={<Eye className="h-4 w-4" />} label="Visits" value={humans.length} />
        <Stat icon={<Clock className="h-4 w-4" />} label="Avg time / visit" value={fmtDur(avgTime)} />
        <Stat icon={<Eye className="h-4 w-4" />} label="Avg pages / visit" value={avgPages} />
        <Stat icon={<Users className="h-4 w-4" />} label="Guests (not signed in)" value={guests} />
        <Stat icon={<span className="h-2 w-2 rounded-full bg-primary inline-block" />} label="Seen in last 5 min" value={liveNow} />
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <ChartCard title="Top countries" data={topN(humans, 'country')} />
        <ChartCard title="Top cities" data={topN(humans, 'city')} />
        <ChartCard title="Devices" data={topN(humans, 'device_name')} />
        <ChartCard title="Operating systems" data={topN(humans, 'os')} />
        <ChartCard title="Browsers" data={topN(humans, 'browser')} />
        <ChartCard title="Landing pages" data={topN(humans, 'landing_page')} />
      </div>

      <div className="bg-card border border-border rounded-2xl shadow-card overflow-hidden">
        <div className="flex flex-wrap items-center gap-3 p-4 border-b border-border">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search IP, city, device, browser, user…" className="pl-9" />
          </div>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={onlyGuests} onChange={(e) => setOnlyGuests(e.target.checked)} /> Guests only</label>
          <Select value={device} onValueChange={setDevice}><SelectTrigger className="w-36" aria-label="Visitor device"><SelectValue /></SelectTrigger><SelectContent>{['all','desktop','mobile','tablet','bot'].map(d => <SelectItem key={d} value={d}>{d === 'all' ? 'All devices' : d}</SelectItem>)}</SelectContent></Select>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left text-xs uppercase tracking-wider text-muted-foreground">
              <tr><th className="p-3">Visitor</th><th className="p-3">Location</th><th className="p-3">Device</th><th className="p-3">IP</th><th className="p-3">Pages</th><th className="p-3">Time</th><th className="p-3">Last seen</th></tr>
            </thead>
            <tbody>
              {isLoading && <tr><td colSpan={7} className="p-6 text-center text-muted-foreground">Loading…</td></tr>}
              {error && <tr><td colSpan={7} className="p-6 text-center text-destructive">Visitor records could not load.</td></tr>}
              {!isLoading && !error && filtered.length === 0 && <tr><td colSpan={7} className="p-6 text-center text-muted-foreground">No visits match these filters.</td></tr>}
              {filtered.map((r) => (
                <tr key={r.id} onClick={() => setOpen(r)} className="border-t border-border hover:bg-muted/40 cursor-pointer">
                  <td className="p-3">{r.user_id ? <span className="font-medium">{nameOf(r.user_id) || 'Member'}</span> : <Badge variant="secondary">Guest</Badge>}</td>
                  <td className="p-3"><span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3 text-primary" />{[r.city, r.region, r.country].filter(Boolean).join(', ') || 'Unknown'}</span></td>
                  <td className="p-3"><span className="inline-flex items-center gap-1.5"><DeviceIcon t={r.device_type} />{r.device_name} · {r.os} · {r.browser}</span></td>
                  <td className="p-3 font-mono text-xs">{r.ip || '—'}</td>
                  <td className="p-3">{r.page_views}</td>
                  <td className="p-3">{fmtDur(r.total_seconds)}</td>
                  <td className="p-3 whitespace-nowrap">{new Date(r.last_seen).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog open={!!open} onOpenChange={(o) => !o && setOpen(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Visit details</DialogTitle></DialogHeader>
          {open && (
            <div className="space-y-4 text-sm">
              <div className="grid sm:grid-cols-2 gap-x-6 gap-y-2">
                <Row k="Who" v={open.user_id ? nameOf(open.user_id) || open.user_id : 'Guest (not signed in)'} />
                <Row k="IP address" v={open.ip} />
                <Row k="Location" v={[open.city, open.region, open.postal, open.country].filter(Boolean).join(', ')} />
                <Row k="Coordinates" v={open.latitude != null ? `${open.latitude}, ${open.longitude}` : null} />
                <Row k="Internet provider" v={open.isp} />
                <Row k="Timezone" v={open.timezone} />
                <Row k="Device" v={`${open.device_name ?? ''} (${open.device_type ?? ''})`} />
                <Row k="System" v={open.os} />
                <Row k="Browser" v={open.browser} />
                <Row k="Screen" v={open.screen} />
                <Row k="Language" v={open.language} />
                <Row k="Came from" v={open.referrer || 'Direct'} />
                <Row k="First seen" v={new Date(open.first_seen).toLocaleString()} />
                <Row k="Time on site" v={fmtDur(open.total_seconds)} />
              </div>
              {open.latitude != null && (
                <a className="text-primary font-semibold hover:underline" target="_blank" rel="noreferrer" href={`https://www.google.com/maps?q=${open.latitude},${open.longitude}`}>Open on map</a>
              )}
              <div>
                <p className="font-semibold mb-2">Pages visited</p>
                <ol className="space-y-1">
                  {pages.map((p: any) => (
                    <li key={p.id} className="flex justify-between gap-3 rounded-lg bg-muted/50 px-3 py-1.5">
                      <span className="truncate">{p.path}</span>
                      <span className="text-muted-foreground whitespace-nowrap">{fmtDur(p.duration_seconds)} · {new Date(p.created_at).toLocaleTimeString()}</span>
                    </li>
                  ))}
                </ol>
              </div>
              <p className="text-xs text-muted-foreground break-all">{open.user_agent}</p>
              <Button variant="destructive" size="sm" onClick={() => remove(open.id)}><Trash2 className="h-4 w-4 mr-1" /> Delete this record</Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: React.ReactNode }) {
  return (
    <div className="bg-card border border-border rounded-2xl p-4 shadow-card">
      <p className="text-xs text-muted-foreground flex items-center gap-1.5">{icon}{label}</p>
      <p className="font-display text-2xl font-bold mt-1">{value}</p>
    </div>
  );
}
function Row({ k, v }: { k: string; v: React.ReactNode }) {
  return <div className="flex justify-between gap-3 border-b border-border/60 py-1"><span className="text-muted-foreground">{k}</span><span className="font-medium text-right break-all">{v || '—'}</span></div>;
}
function ChartCard({ title, data }: { title: string; data: { name: string; value: number }[] }) {
  return (
    <div className="bg-card border border-border rounded-2xl p-4 shadow-card min-w-0">
      <p className="font-semibold mb-2">{title}</p>
      {data.length === 0 ? <p className="text-sm text-muted-foreground py-8 text-center">No data yet</p> : (
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={data} layout="vertical" margin={{ left: 10 }}>
            <CartesianGrid strokeDasharray="3 3" horizontal={false} />
            <XAxis type="number" allowDecimals={false} hide />
            <YAxis type="category" dataKey="name" width={110} tick={{ fontSize: 11 }} />
            <Tooltip />
            <Bar dataKey="value" fill="hsl(var(--primary))" radius={[0, 6, 6, 0]} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
