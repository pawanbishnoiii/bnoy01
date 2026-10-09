import { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useServerFn } from '@tanstack/react-start';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { sendTestEmail, announceProduct, confirmBooking } from '@/lib/booking.functions';
import { useAuthStore } from '@/store/authStore';

export default function AdminEmails() {
  const qc = useQueryClient();
  const { user } = useAuthStore();
  const test = useServerFn(sendTestEmail);
  const confirmAppointment = useServerFn(confirmBooking);
  const [confirming, setConfirming] = useState<string | null>(null);
  const [bookingSearch, setBookingSearch] = useState('');
  const announce = useServerFn(announceProduct);
  const [pid, setPid] = useState('');
  const [sending, setSending] = useState(false);
  const { data: projects = [] } = useQuery({ queryKey: ['email-projects'], queryFn: async () => (await supabase.from('projects').select('id,title,slug').eq('status', 'published').order('created_at', { ascending: false }).limit(100)).data || [] });
  const sendProduct = async () => {
    const p: any = projects.find((x: any) => x.id === pid); if (!p) return toast.error('Pick a product');
    if (!confirm(`Email all users about "${p.title}"?`)) return;
    setSending(true);
    try { const r = await announce({ data: { title: p.title, url: `https://bnoy01.lovable.app/p/${p.slug || p.id}` } }); toast.success(`Sent to ${r.sent} users`); }
    catch (e) { toast.error(e instanceof Error ? e.message : 'Failed'); }
    finally { setSending(false); qc.invalidateQueries({ queryKey: ['email-logs'] }); }
  };
  const { data: theme } = useQuery({ queryKey: ['email-theme'], queryFn: async () => (await supabase.from('email_theme').select('*').eq('id', true).maybeSingle()).data });
  const { data: logs = [] } = useQuery({ queryKey: ['email-logs'], queryFn: async () => (await supabase.from('email_logs').select('*').order('created_at', { ascending: false }).limit(50)).data || [] });
  const { data: bookings = [] } = useQuery({ queryKey: ['admin-bookings'], queryFn: async () => (await supabase.from('bookings').select('*').order('booking_date', { ascending: false }).limit(100)).data || [] });
  const [f, setF] = useState<any>(null);
  const [to, setTo] = useState('');
  const [busy, setBusy] = useState(false);
  useEffect(() => { if (theme) setF(theme); }, [theme]);
  useEffect(() => { if (user?.email) setTo(user.email); }, [user]);

  const save = async () => {
    const { error } = await supabase.from('email_theme').update({ accent_color: f.accent_color, logo_url: f.logo_url, footer_text: f.footer_text, from_name: f.from_name, signup_enabled: f.signup_enabled, booking_enabled: f.booking_enabled, product_enabled: f.product_enabled, updated_at: new Date().toISOString() }).eq('id', true);
    error ? toast.error(error.message) : toast.success('Email design saved');
    qc.invalidateQueries({ queryKey: ['email-theme'] });
  };
  const sendTest = async () => {
    setBusy(true);
    try { const r = await test({ data: { to } }); r.sent ? toast.success('Test email sent') : toast.error(r.error || 'Failed'); }
    catch (e) { toast.error(e instanceof Error ? e.message : 'Failed'); }
    finally { setBusy(false); qc.invalidateQueries({ queryKey: ['email-logs'] }); }
  };
  const setStatus = async (id: string, status: string) => { const { error } = await supabase.from('bookings').update({ status }).eq('id', id); if (error) toast.error('Booking status could not update.'); else qc.invalidateQueries({ queryKey: ['admin-bookings'] }); };
  const sendConfirmation = async (id: string) => {
    setConfirming(id);
    try { const result = await confirmAppointment({ data: { id } }); result.sent ? toast.success(result.alreadySent ? 'Confirmation was already sent.' : 'Confirmation email sent.') : toast.error(result.error || 'Confirmation could not be sent.'); }
    catch (error) { toast.error(error instanceof Error ? error.message : 'Confirmation failed.'); }
    finally { setConfirming(null); qc.invalidateQueries({ queryKey: ['admin-bookings'] }); qc.invalidateQueries({ queryKey: ['email-logs'] }); }
  };

  return (
    <div className="space-y-8 max-w-5xl">
      <div><h1 className="font-display text-2xl font-bold">Emails & Bookings</h1><p className="text-muted-foreground text-sm">Emails are sent from your Gmail (bnoy.studios@gmail.com).</p></div>
      {f && (
        <div className="grid md:grid-cols-2 gap-6 rounded-2xl border border-border p-5">
          <div className="space-y-3">
            <div><Label>Sender name</Label><Input value={f.from_name} onChange={(e) => setF({ ...f, from_name: e.target.value })} /></div>
            <div><Label>Logo image link</Label><Input value={f.logo_url || ''} onChange={(e) => setF({ ...f, logo_url: e.target.value })} placeholder="https://…/logo.png" /></div>
            <div><Label>Main colour</Label><div className="flex gap-2"><input type="color" value={f.accent_color} onChange={(e) => setF({ ...f, accent_color: e.target.value })} className="h-10 w-14 rounded border border-border" /><Input value={f.accent_color} onChange={(e) => setF({ ...f, accent_color: e.target.value })} /></div></div>
            <div><Label>Footer text</Label><Input value={f.footer_text} onChange={(e) => setF({ ...f, footer_text: e.target.value })} /></div>
            {([['signup_enabled', 'Welcome email on signup'], ['booking_enabled', 'Booking confirmation'], ['product_enabled', 'New product emails']] as const).map(([k, l]) => (
              <label key={k} className="flex items-center justify-between text-sm"><span>{l}</span><Switch checked={f[k]} onCheckedChange={(v) => setF({ ...f, [k]: v })} /></label>
            ))}
            <Button onClick={save} className="w-full">Save design</Button>
          </div>
          <div className="space-y-3">
            <Label>Preview</Label>
            <div className="rounded-2xl overflow-hidden border border-border">
              <div className="p-6 text-center text-primary-foreground" style={{ background: `linear-gradient(135deg, ${f.accent_color}, #111827)` }}>
                {f.logo_url && <img src={f.logo_url} alt="logo" className="h-10 mx-auto mb-2" />}
                <p className="font-bold text-lg">Your call is booked!</p>
              </div>
              <div className="p-5 text-sm text-muted-foreground">Hi Rahul, thanks for sharing your idea…<div className="mt-4 text-center"><span className="inline-block rounded-full px-5 py-2 text-primary-foreground font-semibold" style={{ background: f.accent_color }}>Button</span></div><p className="text-xs text-center mt-4">{f.footer_text}</p></div>
            </div>
            <div className="flex gap-2"><Input value={to} onChange={(e) => setTo(e.target.value)} /><Button onClick={sendTest} disabled={busy}>{busy ? 'Sending…' : 'Send test'}</Button></div>
          </div>
        </div>
      )}
      <section className="rounded-2xl border border-border p-5"><h2 className="font-display text-lg font-bold mb-1">Announce a new product</h2><p className="text-sm text-muted-foreground mb-3">Sends a launch email to every user with an email address.</p>
        <div className="flex flex-wrap gap-2"><select value={pid} onChange={(e) => setPid(e.target.value)} className="flex-1 min-w-[200px] rounded-md border border-border bg-background px-3 h-10"><option value="">Choose a product…</option>{projects.map((p: any) => <option key={p.id} value={p.id}>{p.title}</option>)}</select><Button onClick={sendProduct} disabled={sending}>{sending ? 'Sending…' : 'Send launch email'}</Button></div>
      </section>
      <section><h2 className="font-display text-lg font-bold mb-3">Call bookings ({bookings.length})</h2>
        <Input aria-label="Search bookings" placeholder="Search name, email, city or project" className="mb-4 max-w-md" value={bookingSearch} onChange={e => setBookingSearch(e.target.value)} />
        <div className="overflow-x-auto rounded-2xl border border-border"><table className="w-full text-sm"><thead><tr className="border-b border-border text-left">{['When', 'Name', 'Contact', 'Type', 'Budget', 'Idea', 'Status'].map((h) => <th key={h} className="p-3">{h}</th>)}</tr></thead>
          <tbody>{bookings.filter(b => [b.name,b.email,b.city,b.project_type].join(' ').toLowerCase().includes(bookingSearch.toLowerCase())).map(b => <tr key={b.id} className="border-b border-border align-top"><td className="p-3 whitespace-nowrap">{b.booking_date} {b.booking_time} IST</td><td className="p-3">{b.name}<p className="text-xs text-muted-foreground">{b.customer_type === 'company' ? b.company : 'Personal'}</p></td><td className="p-3">{b.email}<br /><span className="text-muted-foreground">{b.phone}{b.whatsapp ? ` · WA ${b.whatsapp}` : ''}</span><p className="text-xs text-primary capitalize">Primary: {b.preferred_contact}</p>{(b.age || b.gender || b.pincode || b.city) && <p className="text-xs text-muted-foreground">{[b.age, b.gender, b.city, b.address, b.pincode].filter(Boolean).join(' · ')}</p>}</td><td className="p-3">{b.project_type}</td><td className="p-3">{b.budget}</td><td className="p-3 max-w-xs">{b.details || 'Not provided'}</td><td className="p-3 space-y-2"><select aria-label={`Status for ${b.name}`} value={b.status} onChange={(e) => setStatus(b.id, e.target.value)} className="rounded border border-border bg-background px-2 py-1">{['pending', 'confirmed', 'done', 'cancelled'].map((s) => <option key={s}>{s}</option>)}</select>{b.confirmation_sent_at ? <p className="text-xs text-muted-foreground">Confirmation sent {new Date(b.confirmation_sent_at).toLocaleString()}</p> : <Button variant="outline" size="sm" disabled={confirming === b.id || ['done','cancelled'].includes(b.status)} onClick={() => sendConfirmation(b.id)}>{confirming === b.id ? 'Sending…' : 'Send confirmation'}</Button>}</td></tr>)}</tbody></table></div>
      </section>
      <section><h2 className="font-display text-lg font-bold mb-3">Recent emails</h2>
        <div className="overflow-x-auto rounded-2xl border border-border"><table className="w-full text-sm"><tbody>{logs.map((l: any) => <tr key={l.id} className="border-b border-border"><td className="p-3">{new Date(l.created_at).toLocaleString()}</td><td className="p-3">{l.to_email}</td><td className="p-3">{l.template}</td><td className="p-3">{l.subject}</td><td className={`p-3 font-semibold ${l.status === 'sent' ? 'text-primary' : 'text-destructive'}`}>{l.status}{l.error ? ` · ${l.error}` : ''}</td></tr>)}</tbody></table></div>
      </section>
    </div>
  );
}
