import { useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronUp, Circle, AlertTriangle, CheckCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

type Status = 'operational' | 'degraded' | 'down' | 'checking';
type Svc = { name: string; status: Status; ms?: number };

const CHECKS: { name: string; run: () => Promise<unknown> }[] = [
  { name: 'Database', run: async () => { const { error } = await supabase.from('projects').select('id', { head: true, count: 'exact' }); if (error) throw error; } },
  { name: 'Auth', run: async () => { const { error } = await supabase.auth.getSession(); if (error) throw error; } },
  { name: 'Storage', run: async () => { const { error } = await supabase.storage.from('project-images').list('', { limit: 1 }); if (error) throw error; } },
  { name: 'Visitor tracking', run: async () => { const { error } = await supabase.from('visitor_sessions').select('id', { head: true, count: 'exact' }); if (error) throw error; } },
  { name: 'Truecaller', run: async () => { const { error } = await supabase.from('truecaller_settings').select('enabled').limit(1); if (error) throw error; } },
];

const SLOT = 15 * 60 * 1000;
const SLOTS = 96; // 24 hours of 15-minute candles
function UptimeBar({ history }: { history: number[] }) {
  return (
    <div className="mt-1">
      <div className="flex gap-[2px]">
        {history.map((v, i) => (
          <div key={i} className={`h-7 flex-1 min-w-[2px] rounded-[2px] transition-colors ${v === -1 ? 'bg-muted' : v === 1 ? 'bg-green-500' : v === 0.5 ? 'bg-yellow-500' : 'bg-destructive'}`}
            title={`${new Date(Date.now() - (SLOTS - 1 - i) * SLOT).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} · ${v === -1 ? 'No data' : v === 1 ? 'Up' : v === 0.5 ? 'Slow' : 'Incident'}`} />
        ))}
      </div>
      <div className="flex justify-between text-[10px] text-muted-foreground mt-1"><span>24h ago</span><span>{(() => { const k = history.filter((v) => v !== -1); return k.length ? `${Math.round((k.filter((v) => v > 0).length / k.length) * 1000) / 10}% uptime` : 'Collecting data…'; })()}</span><span>Now</span></div>
    </div>
  );
}

function getStatusIcon(status: Status) {
  if (status === 'operational') return <CheckCircle className="text-green-500 w-4 h-4" />;
  if (status === 'degraded') return <AlertTriangle className="text-yellow-500 w-4 h-4" />;
  if (status === 'down') return <Circle className="text-destructive w-4 h-4" />;
  return <Circle className="text-muted-foreground w-4 h-4 animate-pulse" />;
}

const SystemStatusBlock = () => {
  const [showIncidents, setShowIncidents] = useState(false);
  const [services, setServices] = useState<Svc[]>(CHECKS.map((c) => ({ name: c.name, status: 'checking' })));
  const [history, setHistory] = useState<Record<string, number[]>>({});
  const [checkedAt, setCheckedAt] = useState<Date | null>(null);
  const alive = useRef(true);

  useEffect(() => {
    alive.current = true;
    const loadHistory = async () => {
      const since = new Date(Date.now() - SLOTS * SLOT).toISOString();
      const { data } = await supabase.from('system_checks').select('service,status,created_at').gte('created_at', since).order('created_at').limit(5000);
      const now = Date.now(); const n: Record<string, number[]> = {};
      CHECKS.forEach((c) => { n[c.name] = Array(SLOTS).fill(-1); });
      (data || []).forEach((r) => {
        const idx = SLOTS - 1 - Math.floor((now - new Date(r.created_at).getTime()) / SLOT);
        if (idx < 0 || idx >= SLOTS || !n[r.service]) return;
        const v = r.status === 'down' ? 0 : r.status === 'degraded' ? 0.5 : 1;
        n[r.service][idx] = n[r.service][idx] === -1 ? v : Math.min(n[r.service][idx], v);
      });
      if (alive.current) setHistory(n);
    };
    const runAll = async () => {
      const results = await Promise.all(CHECKS.map(async (c) => {
        const t = performance.now();
        try { await c.run(); const ms = Math.round(performance.now() - t); return { name: c.name, status: (ms > 1500 ? 'degraded' : 'operational') as Status, ms }; }
        catch { return { name: c.name, status: 'down' as Status }; }
      }));
      if (!alive.current) return;
      setServices(results);
      setCheckedAt(new Date());
      // Record at most one check per 15-minute slot so the 96 candles stay accurate.
      const slotStart = new Date(Math.floor(Date.now() / SLOT) * SLOT).toISOString();
      const { count } = await supabase.from('system_checks').select('id', { head: true, count: 'exact' }).gte('created_at', slotStart);
      if (!count) await supabase.from('system_checks').insert(results.map((r) => ({ service: r.name, status: r.status, ms: r.ms ?? null })));
      await loadHistory();
    };
    runAll();
    const id = setInterval(runAll, SLOT);
    return () => { alive.current = false; clearInterval(id); };
  }, []);

  const { data: incidents = [] } = useQuery({
    queryKey: ['status-incidents'],
    refetchInterval: 15 * 60 * 1000,
    queryFn: async () => {
      const { data } = await supabase.from('truecaller_logs').select('stage,message,created_at').order('created_at', { ascending: false }).limit(8);
      return data || [];
    },
  });

  return (
    <Card className="w-full p-2 md:p-4">
      <CardContent className="p-6 flex flex-col gap-6">
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <span className="font-semibold text-lg">System Status</span>
              <p className="text-xs text-muted-foreground">Live · refreshes every 15 min · last 24 hours{checkedAt ? ` · last check ${checkedAt.toLocaleTimeString()}` : ''}</p>
            </div>
            <Button size="sm" variant="secondary" onClick={() => setShowIncidents((v) => !v)} aria-label={showIncidents ? 'Hide incident history' : 'Show incident history'}>
              {showIncidents ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              <span className="text-xs">{showIncidents ? 'Hide' : 'Incident History'}</span>
            </Button>
          </div>
          <div className="flex flex-col gap-3">
            {services.map((svc) => (
              <div key={svc.name} className="flex flex-col gap-1">
                <div className="flex items-center gap-4 flex-wrap">
                  {getStatusIcon(svc.status)}
                  <span className="font-medium">{svc.name}</span>
                  <span className="text-xs text-muted-foreground">{svc.status.charAt(0).toUpperCase() + svc.status.slice(1)}</span>
                  {svc.ms !== undefined && <span className="text-xs text-muted-foreground ml-auto">{svc.ms} ms</span>}
                </div>
                <UptimeBar history={history[svc.name] || []} />
              </div>
            ))}
          </div>
        </div>
        {showIncidents && (
          <div className="flex flex-col gap-2 bg-accent rounded-lg p-4 mt-2">
            <span className="font-semibold text-sm mb-2">Incident History</span>
            {incidents.length === 0 && <span className="text-xs text-muted-foreground">No incidents recorded.</span>}
            {incidents.map((inc: any, i: number) => (
              <div key={i} className="flex flex-col gap-1 border-b last:border-b-0 border-muted-foreground/10 pb-2 last:pb-0">
                <span className="text-xs font-medium">Truecaller · {inc.stage} - {new Date(inc.created_at).toLocaleString()}</span>
                <span className="text-xs text-muted-foreground">{inc.message}</span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SystemStatusBlock;
