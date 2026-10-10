import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { CalendarClock, CheckCircle2, Clock3, Copy, Download, Mail, MessageCircle, Phone, Search } from 'lucide-react';
import { useServerFn } from '@tanstack/react-start';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';
import { confirmBooking } from '@/lib/booking.functions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import inquiriesArt from '@/assets/inquiries-workspace.webp';

type Booking = Database['public']['Tables']['bookings']['Row'];
const STATUSES = ['pending', 'confirmed', 'done', 'cancelled'] as const;

const dateTime = (booking: Booking) => new Date(`${booking.booking_date}T${booking.booking_time}:00+05:30`);
const contactValue = (booking: Booking) => booking.preferred_contact === 'whatsapp' ? booking.whatsapp : booking.preferred_contact === 'call' ? booking.phone : booking.email;
const csvCell = (value: unknown) => `"${String(value ?? '').replaceAll('"', '""')}"`;

export default function AdminInquiries() {
  const qc = useQueryClient();
  const confirmAppointment = useServerFn(confirmBooking);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [timing, setTiming] = useState('upcoming');
  const [selected, setSelected] = useState<Booking | null>(null);
  const [confirming, setConfirming] = useState<string | null>(null);
  const { data: bookings = [], isLoading, error } = useQuery({
    queryKey: ['admin-bookings'],
    queryFn: async () => {
      const { data, error } = await supabase.from('bookings').select('*').order('booking_date', { ascending: false }).order('booking_time', { ascending: false }).limit(300);
      if (error) throw error;
      return data;
    },
  });
  const now = new Date();
  const filtered = bookings.filter((booking) => {
    const haystack = [booking.name, booking.email, booking.phone, booking.whatsapp, booking.city, booking.company, booking.project_type, booking.details].join(' ').toLowerCase();
    const matchesTime = timing === 'all' || (timing === 'upcoming' ? dateTime(booking) >= now : dateTime(booking) < now);
    return haystack.includes(search.trim().toLowerCase()) && (status === 'all' || booking.status === status) && matchesTime;
  }).sort((a, b) => timing === 'upcoming' ? +dateTime(a) - +dateTime(b) : +dateTime(b) - +dateTime(a));

  const changeStatus = async (booking: Booking, nextStatus: string) => {
    const previous = booking.status;
    qc.setQueryData<Booking[]>(['admin-bookings'], old => old?.map(item => item.id === booking.id ? { ...item, status: nextStatus } : item));
    setSelected(current => current?.id === booking.id ? { ...current, status: nextStatus } : current);
    const { error } = await supabase.from('bookings').update({ status: nextStatus }).eq('id', booking.id);
    if (error) {
      qc.setQueryData<Booking[]>(['admin-bookings'], old => old?.map(item => item.id === booking.id ? { ...item, status: previous } : item));
      toast.error('Status could not be updated.');
    } else toast.success(`Inquiry marked ${nextStatus}.`);
    void qc.invalidateQueries({ queryKey: ['admin-bookings'] });
  };
  const sendConfirmation = async (booking: Booking) => {
    setConfirming(booking.id);
    try {
      const result = await confirmAppointment({ data: { id: booking.id } });
      result.sent ? toast.success(result.alreadySent ? 'Confirmation was already sent.' : 'Confirmation email sent.') : toast.error(result.error || 'Confirmation could not be sent.');
      await qc.invalidateQueries({ queryKey: ['admin-bookings'] });
    } catch (error) { toast.error(error instanceof Error ? error.message : 'Confirmation failed.'); }
    finally { setConfirming(null); }
  };
  const exportCsv = () => {
    const headings = ['Date', 'Time', 'Name', 'Primary contact', 'Email', 'Phone', 'WhatsApp', 'Project', 'Budget', 'City', 'Status', 'Details'];
    const rows = filtered.map(b => [b.booking_date, b.booking_time, b.name, b.preferred_contact, b.email, b.phone, b.whatsapp, b.project_type, b.budget, b.city, b.status, b.details]);
    const blob = new Blob([[headings, ...rows].map(row => row.map(csvCell).join(',')).join('\n')], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob); const anchor = document.createElement('a'); anchor.href = url; anchor.download = `bnoy-inquiries-${new Date().toISOString().slice(0, 10)}.csv`; anchor.click(); URL.revokeObjectURL(url);
  };
  const counts = { pending: bookings.filter(b => b.status === 'pending').length, confirmed: bookings.filter(b => b.status === 'confirmed').length, upcoming: bookings.filter(b => !['done', 'cancelled'].includes(b.status) && dateTime(b) >= now).length };
  const statCards = [{ label: 'Pending', value: counts.pending, icon: Clock3 }, { label: 'Confirmed', value: counts.confirmed, icon: CheckCircle2 }, { label: 'Upcoming', value: counts.upcoming, icon: CalendarClock }];

  return <div className="mx-auto max-w-7xl space-y-6">
    <header className="grid items-center gap-5 border-b border-border pb-6 md:grid-cols-[1fr_180px]">
      <div><p className="text-xs font-semibold uppercase text-primary">Customers / Inquiries</p><h1 className="mt-2 font-display text-3xl font-bold">Book a call inbox</h1><p className="mt-2 max-w-2xl text-sm text-muted-foreground">Review every request, contact the customer, confirm appointments, and keep the pipeline current.</p></div>
      <img src={inquiriesArt} alt="Inquiry inbox with calendar and contact controls" width={360} height={360} className="hidden h-32 w-full object-contain md:block" />
    </header>
    <div className="grid grid-cols-3 gap-3">
      {statCards.map(({ label, value, icon: Icon }) => <button key={label} type="button" onClick={() => label === 'Upcoming' ? (setTiming('upcoming'), setStatus('all')) : (setStatus(label.toLowerCase()), setTiming('all'))} className="rounded-lg border border-border bg-card p-4 text-left transition-colors hover:border-primary/50"><Icon className="mb-3 h-5 w-5 text-primary" /><span className="block text-2xl font-bold">{value}</span><span className="text-xs text-muted-foreground">{label}</span></button>)}
    </div>
    <div className="flex flex-col gap-3 border-y border-border py-4 lg:flex-row">
      <div className="relative flex-1"><Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" /><Input aria-label="Search inquiries" placeholder="Search name, phone, city, project or idea" value={search} onChange={event => setSearch(event.target.value)} className="pl-9" /></div>
      <Select value={status} onValueChange={setStatus}><SelectTrigger className="w-full lg:w-44" aria-label="Filter status"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All statuses</SelectItem>{STATUSES.map(item => <SelectItem key={item} value={item} className="capitalize">{item}</SelectItem>)}</SelectContent></Select>
      <Select value={timing} onValueChange={setTiming}><SelectTrigger className="w-full lg:w-40" aria-label="Filter timing"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="upcoming">Upcoming</SelectItem><SelectItem value="past">Past</SelectItem><SelectItem value="all">All dates</SelectItem></SelectContent></Select>
      <Button variant="outline" onClick={exportCsv} disabled={!filtered.length}><Download className="mr-2 h-4 w-4" />Export</Button>
    </div>
    {error && <p role="alert" className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">Inquiries could not load. Check database access and refresh.</p>}
    {isLoading ? <div className="py-20 text-center text-sm text-muted-foreground">Loading inquiries...</div> : filtered.length === 0 ? <div className="grid place-items-center py-16 text-center"><img src={inquiriesArt} alt="" className="h-40 w-40 object-contain opacity-80" /><h2 className="mt-3 font-display text-xl font-bold">No matching inquiries</h2><p className="mt-1 text-sm text-muted-foreground">Try another status, date range, or search.</p></div> : <div className="overflow-hidden rounded-lg border border-border bg-card">
      {filtered.map((booking, index) => <article key={booking.id} className={`grid gap-4 p-4 lg:grid-cols-[170px_minmax(180px,1fr)_minmax(160px,.8fr)_150px_170px] lg:items-center ${index ? 'border-t border-border' : ''}`}>
        <button type="button" className="text-left" onClick={() => setSelected(booking)}><p className="font-semibold">{dateTime(booking).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'Asia/Kolkata' })}</p><p className="text-sm text-primary">{booking.booking_time} IST</p></button>
        <button type="button" className="min-w-0 text-left" onClick={() => setSelected(booking)}><p className="truncate font-semibold">{booking.name}</p><p className="truncate text-xs text-muted-foreground">{booking.customer_type === 'company' ? booking.company : booking.city || 'Personal inquiry'}</p></button>
        <div><p className="text-sm font-medium capitalize">{booking.project_type}</p><p className="text-xs text-muted-foreground">{booking.budget || 'Budget not set'}</p></div>
        <Badge variant="outline" className="w-fit capitalize">{booking.status}</Badge>
        <div className="flex items-center justify-end gap-1"><ContactButtons booking={booking} /><Button variant="ghost" size="sm" onClick={() => setSelected(booking)}>View</Button></div>
      </article>)}
    </div>}
    <Dialog open={!!selected} onOpenChange={open => !open && setSelected(null)}><DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto"><DialogHeader><DialogTitle>{selected?.name}</DialogTitle></DialogHeader>{selected && <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-2"><Badge variant="outline" className="capitalize">{selected.status}</Badge><span className="text-sm text-muted-foreground">{selected.booking_date} at {selected.booking_time} IST</span></div>
      <div className="grid gap-4 border-y border-border py-5 sm:grid-cols-2">{[['Project', selected.project_type], ['Budget', selected.budget], ['Preferred contact', selected.preferred_contact], ['Email', selected.email], ['Phone', selected.phone], ['WhatsApp', selected.whatsapp], ['City', [selected.city, selected.pincode].filter(Boolean).join(' ')], ['Customer', selected.customer_type === 'company' ? selected.company : 'Personal']].map(([label, value]) => <div key={label}><p className="text-xs text-muted-foreground">{label}</p><p className="mt-1 break-words text-sm font-medium">{value || 'Not provided'}</p></div>)}</div>
      <div><p className="text-xs text-muted-foreground">Idea</p><p className="mt-2 whitespace-pre-wrap text-sm leading-6">{selected.details || 'No project details provided.'}</p></div>
      <div className="flex flex-wrap gap-2"><ContactButtons booking={selected} labels /><Button variant="outline" onClick={() => navigator.clipboard.writeText([selected.name, selected.booking_date, selected.booking_time, selected.project_type, selected.details].filter(Boolean).join('\n')).then(() => toast.success('Inquiry copied.'))}><Copy className="mr-2 h-4 w-4" />Copy</Button></div>
      <div className="grid gap-3 border-t border-border pt-5 sm:grid-cols-[1fr_auto]"><Select value={selected.status} onValueChange={value => void changeStatus(selected, value)}><SelectTrigger aria-label="Update inquiry status"><SelectValue /></SelectTrigger><SelectContent>{STATUSES.map(item => <SelectItem key={item} value={item} className="capitalize">{item}</SelectItem>)}</SelectContent></Select><Button disabled={!selected.email || !!selected.confirmation_sent_at || confirming === selected.id || ['done', 'cancelled'].includes(selected.status)} onClick={() => void sendConfirmation(selected)}>{selected.confirmation_sent_at ? 'Confirmation sent' : confirming === selected.id ? 'Sending...' : 'Confirm & email'}</Button></div>
      {!selected.email && <p className="text-xs text-muted-foreground">No secondary email was supplied. Confirm through the preferred contact button, then update the status.</p>}
    </div>}</DialogContent></Dialog>
  </div>;
}

function ContactButtons({ booking, labels = false }: { booking: Booking; labels?: boolean }) {
  const value = contactValue(booking);
  const normalized = value?.replace(/\D/g, '');
  const config = booking.preferred_contact === 'whatsapp'
    ? { href: normalized ? `https://wa.me/${normalized}` : '', Icon: MessageCircle, label: 'WhatsApp' }
    : booking.preferred_contact === 'call'
      ? { href: value ? `tel:${value}` : '', Icon: Phone, label: 'Call' }
      : { href: value ? `mailto:${value}` : '', Icon: Mail, label: 'Email' };
  if (!config.href) return null;
  return <Button asChild variant="outline" size={labels ? 'default' : 'icon'} title={config.label}><a href={config.href} target={booking.preferred_contact === 'whatsapp' ? '_blank' : undefined} rel="noreferrer"><config.Icon className="h-4 w-4" />{labels && <span className="ml-2">{config.label}</span>}</a></Button>;
}
