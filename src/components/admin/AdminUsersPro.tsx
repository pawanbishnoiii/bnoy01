import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { BadgeCheck, Download, Mail, Phone, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';

type P = Record<string, any>;
const providerOf = (p: P, logs: P[]) => {
  if (p.phone_verified && p.phone) return 'truecaller';
  return logs.find((l) => l.user_id === p.id)?.login_method || 'email';
};

export default function AdminUsersPro() {
  const [q, setQ] = useState('');
  const [prov, setProv] = useState('all');
  const [open, setOpen] = useState<P | null>(null);
  const { data: profiles = [] } = useQuery({ queryKey: ['admin-profiles'], queryFn: async () => (await supabase.from('profiles').select('*').order('created_at', { ascending: false })).data || [] });
  const { data: logs = [] } = useQuery({ queryKey: ['admin-login-logs-all'], queryFn: async () => (await supabase.from('user_login_logs').select('*').order('login_at', { ascending: false }).limit(1000)).data || [] });
  const { data: roles = [] } = useQuery({ queryKey: ['admin-roles'], queryFn: async () => (await supabase.from('user_roles').select('user_id,role')).data || [] });

  const rows = useMemo(() => profiles.map((p: P) => {
    const mine = logs.filter((l: P) => l.user_id === p.id);
    return { ...p, provider: providerOf(p, logs), logins: mine.length, last: mine[0], admin: roles.some((r: P) => r.user_id === p.id && r.role === 'admin') };
  }).filter((p: P) => (prov === 'all' || p.provider === prov) && [p.name, p.email, p.phone, p.city, p.company].join(' ').toLowerCase().includes(q.toLowerCase())), [profiles, logs, roles, q, prov]);

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: profiles.length };
    profiles.forEach((p: P) => { const k = providerOf(p, logs); c[k] = (c[k] || 0) + 1; });
    return c;
  }, [profiles, logs]);

  const exportCsv = () => {
    const cols = ['name', 'email', 'phone', 'provider', 'city', 'company', 'job_title', 'gender', 'created_at', 'logins'];
    const csv = [cols.join(','), ...rows.map((r: P) => cols.map((c) => `"${String(r[c] ?? '').replace(/"/g, '""')}"`).join(','))].join('\n');
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' })); a.download = 'users.csv'; a.click();
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div><h1 className="font-display text-2xl font-bold">Users</h1><p className="text-sm text-muted-foreground">All Google, Truecaller and email accounts in one place.</p></div>
        <Button variant="outline" onClick={exportCsv}><Download className="h-4 w-4 mr-2" />Export CSV</Button>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {['all', 'google', 'truecaller', 'email'].map((k) => (
          <button key={k} onClick={() => setProv(k)} className={`rounded-2xl border p-4 text-left transition-all ${prov === k ? 'border-primary bg-primary/10' : 'border-border bg-card'}`}>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">{k === 'all' ? 'All users' : k}</p>
            <p className="font-display text-2xl font-bold">{counts[k] || 0}</p>
          </button>
        ))}
      </div>
      <div className="relative max-w-md"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input className="pl-9" placeholder="Search name, email, phone, city…" value={q} onChange={(e) => setQ(e.target.value)} /></div>
      <div className="rounded-2xl border border-border bg-card overflow-x-auto">
        <table className="w-full text-sm">
          <thead><tr className="border-b border-border text-left">{['User', 'Contact', 'Sign-in', 'Location', 'Logins', 'Joined'].map((h) => <th key={h} className="p-3">{h}</th>)}</tr></thead>
          <tbody>
            {rows.map((p: P) => (
              <tr key={p.id} onClick={() => setOpen(p)} className="border-b border-border/60 hover:bg-muted/50 cursor-pointer">
                <td className="p-3"><div className="flex items-center gap-3"><Avatar className="h-9 w-9"><AvatarImage src={p.avatar_url || undefined} /><AvatarFallback className="gradient-fire-strong text-primary-foreground text-xs font-bold">{(p.name || p.email || '?').slice(0, 2).toUpperCase()}</AvatarFallback></Avatar><div><p className="font-semibold flex items-center gap-1">{p.name || '—'}{p.verified_name && <BadgeCheck className="h-4 w-4 text-primary" />}</p>{p.admin && <span className="text-[10px] font-bold text-primary">ADMIN</span>}</div></div></td>
                <td className="p-3"><p>{p.email || '—'}</p><p className="text-muted-foreground">{p.phone || ''}</p></td>
                <td className="p-3"><span className="rounded-full bg-muted px-2 py-0.5 text-xs font-semibold capitalize">{p.provider}</span></td>
                <td className="p-3">{p.city || [p.last?.city, p.last?.country].filter(Boolean).join(', ') || '—'}</td>
                <td className="p-3">{p.logins}</td>
                <td className="p-3 text-muted-foreground">{new Date(p.created_at).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 && <p className="text-center text-muted-foreground py-8">No users found</p>}
      </div>

      <Sheet open={!!open} onOpenChange={(v) => !v && setOpen(null)}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          {open && <>
            <SheetHeader><SheetTitle>{open.name || 'User'}</SheetTitle></SheetHeader>
            <div className="flex items-center gap-4 mt-4"><Avatar className="h-16 w-16"><AvatarImage src={open.avatar_url || undefined} /><AvatarFallback className="gradient-fire-strong text-primary-foreground font-bold">{(open.name || open.email || '?').slice(0, 2).toUpperCase()}</AvatarFallback></Avatar>
              <div className="space-y-1 text-sm">{open.email && <p className="flex items-center gap-2"><Mail className="h-4 w-4" />{open.email}{open.email_verified && <BadgeCheck className="h-4 w-4 text-primary" />}</p>}{open.phone && <p className="flex items-center gap-2"><Phone className="h-4 w-4" />{open.phone}{open.phone_verified && <BadgeCheck className="h-4 w-4 text-primary" />}</p>}</div></div>
            <dl className="grid grid-cols-2 gap-3 mt-6 text-sm">
              {[['First name', open.first_name], ['Last name', open.last_name], ['Gender', open.gender], ['City', open.city], ['Company', open.company], ['Job title', open.job_title], ['Country code', open.country_code], ['Sign-in', open.provider], ['Truecaller last seen', open.truecaller_last_seen && new Date(open.truecaller_last_seen).toLocaleString()], ['Joined', new Date(open.created_at).toLocaleString()]].map(([k, v]) => (
                <div key={k as string} className="rounded-xl bg-muted/60 p-3"><dt className="text-xs text-muted-foreground">{k}</dt><dd className="font-semibold break-words">{v || '—'}</dd></div>
              ))}
            </dl>
            <h3 className="font-display font-bold mt-6 mb-2">Login history</h3>
            <div className="space-y-2">
              {logs.filter((l: P) => l.user_id === open.id).slice(0, 20).map((l: P) => (
                <div key={l.id} className={`rounded-xl border p-3 text-xs ${l.is_suspicious ? 'border-destructive' : 'border-border'}`}>
                  <p className="font-semibold">{new Date(l.login_at).toLocaleString()} · {l.login_method}</p>
                  <p className="text-muted-foreground">{[l.city, l.state, l.country].filter(Boolean).join(', ') || 'Unknown'} · {l.ip_address || '—'}</p>
                  <p className="text-muted-foreground">{l.device_name} · {l.os} · {l.browser}</p>
                </div>
              ))}
            </div>
          </>}
        </SheetContent>
      </Sheet>
    </div>
  );
}
