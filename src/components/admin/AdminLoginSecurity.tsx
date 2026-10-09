import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ShieldCheck, ShieldAlert, Users, LogIn, RefreshCw, Search } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import type { Database } from '@/integrations/supabase/types';

type Log = Database['public']['Tables']['user_login_logs']['Row'];
export default function AdminLoginSecurity() {
  const [method, setMethod] = useState('all');
  const [range, setRange] = useState('30');
  const [signal, setSignal] = useState('all');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Log | null>(null);
  const { data: logs = [], isLoading, error, refetch, isFetching } = useQuery({ queryKey: ['admin-login-logs', range], queryFn: async () => {
    const since = new Date(Date.now() - Number(range) * 86400000).toISOString();
    const { data, error } = await supabase.from('user_login_logs').select('*').gte('login_at', since).order('login_at', { ascending: false }).limit(500);
    if (error) throw error; return data || [];
  } });
  const filtered = logs.filter(l => (method === 'all' || l.login_method === method) && (signal === 'all' || l.is_suspicious === (signal === 'flagged')) && [l.user_id,l.city,l.country,l.ip_address,l.browser,l.device_name].join(' ').toLowerCase().includes(search.toLowerCase()));
  const stats = [
    { label: 'Recorded logins', value: logs.length, icon: LogIn },
    { label: 'Unique accounts', value: new Set(logs.map(l => l.user_id)).size, icon: Users },
    { label: 'Country-change signals', value: logs.filter(l => l.is_suspicious).length, icon: ShieldAlert },
    { label: 'No country-change signal', value: logs.filter(l => !l.is_suspicious).length, icon: ShieldCheck },
  ];
  return <div className="space-y-6">
    <div className="flex flex-wrap items-center justify-between gap-3"><h1 className="flex items-center gap-2 font-display text-2xl font-bold"><ShieldCheck className="h-6 w-6 text-primary" />Login Security</h1><Button variant="outline" size="icon" aria-label="Refresh login records" onClick={() => refetch()}><RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} /></Button></div>
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">{stats.map(s => <div key={s.label} className="rounded-lg border border-border bg-card p-4"><s.icon className="mb-3 h-5 w-5 text-primary" /><p className="text-2xl font-bold">{isLoading ? '—' : s.value}</p><p className="mt-1 text-xs text-muted-foreground">{s.label}</p></div>)}</div>
    <div className="flex flex-wrap gap-3">
      <div className="relative min-w-48 flex-1"><Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" /><Input aria-label="Search login records" className="pl-9" placeholder="Search account, location or device" value={search} onChange={e => setSearch(e.target.value)} /></div>
      <Select value={range} onValueChange={setRange}><SelectTrigger aria-label="Login date range" className="w-36"><SelectValue /></SelectTrigger><SelectContent>{['1','7','30','90'].map(n => <SelectItem value={n} key={n}>{n === '1' ? 'Last 24 hours' : `Last ${n} days`}</SelectItem>)}</SelectContent></Select>
      <Select value={method} onValueChange={setMethod}><SelectTrigger aria-label="Login provider" className="w-36"><SelectValue /></SelectTrigger><SelectContent>{['all','email','google','apple','truecaller'].map(m => <SelectItem value={m} key={m}>{m === 'all' ? 'All providers' : m}</SelectItem>)}</SelectContent></Select>
      <Select value={signal} onValueChange={setSignal}><SelectTrigger aria-label="Security signal" className="w-44"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All signals</SelectItem><SelectItem value="flagged">Country changed</SelectItem><SelectItem value="normal">No signal</SelectItem></SelectContent></Select>
    </div>
    {error ? <p role="alert" className="text-destructive">Login records could not load. Please retry.</p> : <div className="overflow-x-auto rounded-lg border border-border"><table className="w-full text-sm"><thead className="bg-muted/50"><tr>{['Account','Provider','Location','Device','Time','Signal',''].map(t => <th className="p-3 text-left" key={t}>{t}</th>)}</tr></thead><tbody>{isLoading ? <tr><td colSpan={7} className="p-8 text-center text-muted-foreground">Loading records…</td></tr> : filtered.length === 0 ? <tr><td colSpan={7} className="p-8 text-center text-muted-foreground">No matching logins.</td></tr> : filtered.map(l => <tr key={l.id} className="border-t border-border"><td className="p-3 font-mono">{l.user_id.slice(0,8)}</td><td className="p-3 capitalize">{l.login_method}</td><td className="p-3">{[l.city,l.country].filter(Boolean).join(', ') || 'Unknown'}</td><td className="p-3">{[l.device_name,l.browser].filter(Boolean).join(' · ') || 'Unknown'}</td><td className="whitespace-nowrap p-3">{new Date(l.login_at).toLocaleString()}</td><td className="p-3"><Badge variant={l.is_suspicious ? 'destructive' : 'secondary'}>{l.is_suspicious ? 'Country changed' : 'No signal'}</Badge></td><td className="p-3"><Button variant="ghost" size="sm" onClick={() => setSelected(l)}>Details</Button></td></tr>)}</tbody></table></div>}
    <Dialog open={!!selected} onOpenChange={o => !o && setSelected(null)}><DialogContent><DialogHeader><DialogTitle>Login details</DialogTitle></DialogHeader>{selected && <dl className="space-y-3 text-sm">{[['Account',selected.user_id],['Provider',selected.login_method],['IP address',selected.ip_address],['Location',[selected.city,selected.state,selected.country].filter(Boolean).join(', ')],['Timezone',selected.timezone],['Network',selected.isp],['Device',[selected.device_name,selected.os,selected.browser].filter(Boolean).join(' · ')],['Screen',selected.screen_size]].map(([k,v]) => <div key={k} className="grid grid-cols-[6rem_1fr] gap-3 border-b border-border pb-2"><dt className="text-muted-foreground">{k}</dt><dd className="break-all">{v || 'Unknown'}</dd></div>)}{selected.is_suspicious && <p className="text-muted-foreground">The recorded country differs from an earlier login. Travel, VPNs and location estimates can cause this signal.</p>}</dl>}</DialogContent></Dialog>
  </div>;
}