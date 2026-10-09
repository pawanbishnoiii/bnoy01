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

function UptimeBar({ history }: { history: number[] }) {
  const bars = [...Array(Math.max(0, 30 - history.length)).fill(-1), ...history];
  return (
    <div className="flex gap-0.5 mt-1">
      {bars.map((v, i) => (
        <div key={i} className={`h-6 w-1 rounded-sm ${v === -1 ? 'bg-muted' : v ? 'bg-green-500' : 'bg-destructive'}`} title={v === -1 ? 'No data' : v ? 'Up' : 'Incident'} />
      ))}
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
    const runAll = async () => {
      const results = await Promise.all(CHECKS.map(async (c) => {
        const t = performance.now();
        try { await c.run(); const ms = Math.round(performance.now() - t); return { name: c.name, status: (ms > 1500 ? 'degraded' : 'operational') as Status, ms }; }
        catch { return { name: c.name, status: 'down' as Status }; }
      }));
      if (!alive.current) return;
      setServices(results);
      setCheckedAt(new Date());
      setHistory((h) => { const n = { ...h }; results.forEach((r) => { n[r.name] = [...(n[r.name] || []), r.status === 'down' ? 0 : 1].slice(-30); }); return n; });
    };
    runAll();
    const id = setInterval(runAll, 30000);
    return () => { alive.current = false; clearInterval(id); };
  }, []);

  const { data: incidents = [] } = useQuery({
    queryKey: ['status-incidents'],
    refetchInterval: 30000,
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
              <p className="text-xs text-muted-foreground">Live · refreshes every 30s{checkedAt ? ` · last check ${checkedAt.toLocaleTimeString()}` : ''}</p>
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
