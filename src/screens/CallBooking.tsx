import { useEffect, useMemo, useRef, useState } from 'react';
import { useServerFn } from '@tanstack/react-start';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { ArrowLeft, ArrowRight, CalendarDays, CheckCircle2, Globe, Smartphone, Bot, Cpu, Monitor, Sparkles, Phone, MessageCircle, Mail, MapPin, Loader2 } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import AuthModal from '@/components/AuthModal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { createBooking, getTakenSlots } from '@/lib/booking.functions';
import { bookingSchema, SLOTS } from '@/lib/booking-validation';
import { useAuthStore } from '@/store/authStore';
import webImage from '@/assets/studio-web.png';
import appImage from '@/assets/studio-app.png';
import windowsImage from '@/assets/studio-windows.png';
import automationImage from '@/assets/studio-automation.png';

const TYPES = [
  { id: 'web', label: 'Website / Web app', icon: Globe, image: webImage },
  { id: 'app', label: 'Mobile app', icon: Smartphone, image: appImage },
  { id: 'automation', label: 'AI & Automation', icon: Bot, image: automationImage },
  { id: 'software', label: 'Custom software', icon: Cpu, image: windowsImage },
  { id: 'windows', label: 'Windows software', icon: Monitor, image: windowsImage },
  { id: 'other', label: 'Something else', icon: Sparkles, image: automationImage },
] as const;
const BUDGETS = ['Under ₹10k', '₹10k – ₹50k', '₹50k – ₹2L', '₹2L+', 'Not sure'];
const TITLES = ['What do you want to build?', 'How should we reach you?', 'Your budget', 'About you', 'Location & your idea', 'Pick a date', 'Email & time'];
const ymd = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
type Contact = 'call' | 'whatsapp' | 'email';

export default function CallBooking() {
  const { user } = useAuthStore();
  const book = useServerFn(createBooking);
  const fetchTaken = useServerFn(getTakenSlots);
  const reduced = useReducedMotion();
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const [date, setDate] = useState<Date>();
  const [time, setTime] = useState('');
  const [taken, setTaken] = useState<string[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [slotsError, setSlotsError] = useState(false);
  const [retrySlots, setRetrySlots] = useState(0);
  const [type, setType] = useState<(typeof TYPES)[number]['id']>();
  const [budget, setBudget] = useState('');
  const [contact, setContact] = useState<Contact>();
  const [form, setForm] = useState({ name: '', email: '', phone: '', whatsapp: '', age: '', gender: '', pincode: '', city: '', company: '', customer_type: 'personal', details: '' });
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<{ emailed: boolean } | null>(null);
  const [pinBusy, setPinBusy] = useState(false);
  const [pinMessage, setPinMessage] = useState('');
  const [cities, setCities] = useState<string[]>([]);
  const section = useRef<HTMLDivElement>(null);
  const pinRequest = useRef<AbortController | null>(null);
  useEffect(() => () => pinRequest.current?.abort(), []);
  useEffect(() => { if (user) setForm(f => ({ ...f, email: f.email || (user.email?.endsWith('.invalid') ? '' : user.email || ''), name: f.name || user.user_metadata?.name || '' })); }, [user]);
  useEffect(() => {
    let current = true;
    setTime(''); setTaken([]); setSlotsError(false);
    if (!date) return;
    setSlotsLoading(true);
    fetchTaken({ data: { date: ymd(date) } }).then(result => { if (current) setTaken(result); }).catch(() => { if (current) setSlotsError(true); }).finally(() => { if (current) setSlotsLoading(false); });
    return () => { current = false; };
  }, [date, retrySlots, fetchTaken]);
  const today = useMemo(() => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; }, []);
  const update = (key: keyof typeof form, value: string) => setForm(f => ({ ...f, [key]: value }));
  const go = (next: number) => { setDirection(next > step ? 1 : -1); setStep(next); };
  useEffect(() => { if (step > 0) { section.current?.scrollIntoView({ behavior: reduced ? 'instant' : 'smooth', block: 'start' }); section.current?.focus({ preventScroll: true }); } }, [step, reduced]);
  const next = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (step === 0 && !type) return toast.error('Choose what you want to build.');
    if (step === 1 && !contact) return toast.error('Choose a contact channel.');
    if (step === 2 && !budget) return toast.error('Choose a budget or Not sure.');
    if (step === 3 && form.name.trim().length < 2) return toast.error('Enter your name.');
    if (step === 5 && !date) return toast.error('Choose a date.');
    if (step < 6) return go(step + 1);
    void submit();
  };
  const lookupPin = async () => {
    if (!/^\d{6}$/.test(form.pincode)) return setPinMessage('Enter a six-digit Indian PIN code, or enter your city manually.');
    pinRequest.current?.abort();
    const controller = new AbortController(); pinRequest.current = controller;
    const timeout = window.setTimeout(() => controller.abort(), 8000);
    setPinBusy(true); setPinMessage(''); setCities([]);
    try {
      const response = await fetch(`https://api.postalpincode.in/pincode/${encodeURIComponent(form.pincode)}`, { signal: controller.signal });
      if (!response.ok) throw new Error();
      const data = await response.json() as { Status: string; PostOffice?: { District: string }[] }[];
      const names = [...new Set((data[0]?.PostOffice || []).map(p => p.District).filter(Boolean))];
      if (data[0]?.Status !== 'Success' || !names.length) throw new Error();
      if (controller !== pinRequest.current) return;
      setCities(names); update('city', names[0]); setPinMessage('Location found. You can edit the city.');
    } catch { if (controller === pinRequest.current) setPinMessage('Location could not be found. Enter your city manually.'); }
    finally { window.clearTimeout(timeout); if (controller === pinRequest.current) setPinBusy(false); }
  };
  const submit = async () => {
    if (!date || !time || slotsLoading || slotsError) return toast.error('Choose an available time.');
    const parsed = bookingSchema.safeParse({ ...form, age: form.age ? Number(form.age) : undefined, preferred_contact: contact, project_type: type, budget, booking_date: ymd(date), booking_time: time });
    if (!parsed.success) return toast.error(parsed.error.issues[0]?.message || 'Check your answers.');
    setBusy(true);
    try { const result = await book({ data: parsed.data }); setDone({ emailed: result.emailed }); }
    catch (error) { toast.error(error instanceof Error ? error.message : 'Booking could not be saved.'); setRetrySlots(v => v + 1); }
    finally { setBusy(false); }
  };
  return <div className="min-h-screen bg-background">
    <Navbar /><AuthModal />
    <main className="mx-auto max-w-5xl px-4 pb-20 pt-28 sm:px-6">
      <header className="mb-8 flex flex-wrap items-end justify-between gap-4 border-b border-border pb-6">
        <div><p className="mb-2 flex items-center gap-2 text-sm font-semibold text-primary"><CalendarDays className="h-4 w-4" />Book a call</p><h1 className="font-display text-3xl font-bold sm:text-4xl">Bnoy Studios</h1></div>
        {!done && <p className="text-sm text-muted-foreground">{String(step + 1).padStart(2, '0')} / 07</p>}
      </header>
      {done ? <div className="py-16 text-center"><CheckCircle2 className="mx-auto h-14 w-14 text-primary" /><h2 className="mt-5 text-3xl font-bold">Your request is saved</h2><p className="mt-3 text-muted-foreground">{date?.toDateString()} · {time} IST</p><p className="mt-2 text-sm text-muted-foreground">{done.emailed ? 'Your welcome email has been sent. Our team will confirm your appointment separately.' : 'Our team will review your request and contact you. The welcome email could not be sent.'}</p><Button variant="outline" className="mt-6" onClick={() => { setDone(null); setDate(undefined); setTime(''); go(0); }}>Book another call</Button></div> : <>
        <div className="mb-8 grid grid-cols-7 gap-2" aria-label={`Step ${step + 1} of 7`}>{TITLES.map((title, i) => <div key={title} className={`h-1 rounded-full ${i <= step ? 'bg-primary' : 'bg-muted'}`} />)}</div>
        <div ref={section} tabIndex={-1} className="scroll-mt-24 outline-none">
          <AnimatePresence mode="wait" initial={false}><motion.form key={step} initial={reduced ? false : { opacity: 0, x: direction * 18 }} animate={{ opacity: 1, x: 0 }} exit={reduced ? {} : { opacity: 0, x: -direction * 18 }} transition={{ duration: .2 }} onSubmit={next} className="space-y-7">
            <h2 className="font-display text-2xl font-bold sm:text-3xl">{TITLES[step]}</h2>
            {step === 0 && <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">{TYPES.map(t => <Button type="button" key={t.id} variant="outline" aria-pressed={type === t.id} onClick={() => setType(t.id)} className={`h-auto min-h-44 flex-col items-start gap-3 whitespace-normal rounded-lg p-4 text-left ${type === t.id ? 'border-primary bg-primary/5' : ''}`}><img src={t.image} alt="" width={384} height={512} className="h-24 w-full object-contain" /><span className="flex items-center gap-2"><t.icon className="h-4 w-4 shrink-0" />{t.label}</span></Button>)}</div>}
            {step === 1 && <div className="max-w-xl space-y-6"><div className="grid grid-cols-3 gap-3">{([{ id: 'call', title: 'Call', icon: Phone }, { id: 'whatsapp', title: 'WhatsApp', icon: MessageCircle }, { id: 'email', title: 'Email', icon: Mail }] as const).map(c => <Button type="button" key={c.id} variant="outline" aria-pressed={contact === c.id} onClick={() => setContact(c.id)} className={`h-24 flex-col gap-3 ${contact === c.id ? 'border-primary bg-primary/5 text-primary' : ''}`}><c.icon className="h-6 w-6" />{c.title}</Button>)}</div>{contact && <div className="space-y-2"><Label htmlFor="primary-contact">{contact === 'email' ? 'Email address' : contact === 'call' ? 'Phone number' : 'WhatsApp number'}</Label><Input id="primary-contact" required type={contact === 'email' ? 'email' : 'tel'} autoComplete={contact === 'email' ? 'email' : 'tel'} value={form[contact === 'call' ? 'phone' : contact]} onChange={e => update(contact === 'call' ? 'phone' : contact, e.target.value)} placeholder={contact === 'email' ? 'you@example.com' : '+91'} maxLength={contact === 'email' ? 160 : 30} /></div>}</div>}
            {step === 2 && <div className="grid max-w-2xl gap-3 sm:grid-cols-2">{BUDGETS.map(b => <Button key={b} type="button" variant="outline" aria-pressed={budget === b} className={`h-16 justify-start ${budget === b ? 'border-primary bg-primary/5 text-primary' : ''}`} onClick={() => setBudget(b)}>{b}</Button>)}</div>}
            {step === 3 && <div className="grid max-w-2xl gap-5 sm:grid-cols-2"><div className="space-y-2 sm:col-span-2"><Label htmlFor="booking-name">Name</Label><Input id="booking-name" required minLength={2} maxLength={80} autoComplete="name" value={form.name} onChange={e => update('name',e.target.value)} /></div><div className="space-y-2"><Label htmlFor="booking-gender">Gender (optional)</Label><Select value={form.gender || 'unspecified'} onValueChange={v => update('gender',v === 'unspecified' ? '' : v)}><SelectTrigger id="booking-gender"><SelectValue /></SelectTrigger><SelectContent>{['unspecified','Male','Female','Other','Prefer not to say'].map(g => <SelectItem key={g} value={g}>{g === 'unspecified' ? 'Not specified' : g}</SelectItem>)}</SelectContent></Select></div><div className="space-y-2"><Label htmlFor="booking-age">Age (optional)</Label><Input id="booking-age" type="number" min={10} max={110} value={form.age} onChange={e => update('age', e.target.value)} /></div><div className="flex gap-3 sm:col-span-2">{['personal','company'].map(c => <Button key={c} type="button" variant="outline" aria-pressed={form.customer_type === c} className={`capitalize ${form.customer_type === c ? 'border-primary text-primary' : ''}`} onClick={() => update('customer_type',c)}>{c}</Button>)}</div>{form.customer_type === 'company' && <div className="space-y-2 sm:col-span-2"><Label htmlFor="booking-company">Company name</Label><Input id="booking-company" required maxLength={120} value={form.company} onChange={e => update('company',e.target.value)} /></div>}</div>}
            {step === 4 && <div className="max-w-2xl space-y-5"><div className="space-y-2"><Label htmlFor="booking-pin">PIN code (optional)</Label><div className="flex gap-2"><Input id="booking-pin" inputMode="numeric" maxLength={6} pattern="[0-9]{6}" value={form.pincode} onChange={e => { pinRequest.current?.abort(); setPinBusy(false); setCities([]); setPinMessage(''); update('pincode',e.target.value); }} /><Button type="button" variant="outline" disabled={pinBusy} onClick={lookupPin}>{pinBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <MapPin className="mr-2 h-4 w-4" />}Find city</Button></div><p aria-live="polite" className="text-xs text-muted-foreground">{pinMessage}</p></div><div className="space-y-2"><Label htmlFor="booking-city">City (optional)</Label><Input id="booking-city" list="booking-cities" value={form.city} maxLength={120} onChange={e => update('city',e.target.value)} /><datalist id="booking-cities">{cities.map(c => <option key={c} value={c} />)}</datalist></div><div className="space-y-2"><Label htmlFor="booking-idea">Describe your idea (optional)</Label><Textarea id="booking-idea" rows={5} maxLength={2000} value={form.details} onChange={e => update('details',e.target.value)} /></div></div>}
            {step === 5 && <Calendar mode="single" selected={date} onSelect={setDate} disabled={d => d < today || d.getDay() === 0} className="w-fit rounded-lg border border-border" />}
            {step === 6 && <div className="max-w-2xl space-y-6"><div className="space-y-2"><Label htmlFor="secondary-email">{contact === 'email' ? 'Email address' : 'Secondary contact email'}</Label><Input id="secondary-email" required type="email" autoComplete="email" maxLength={160} value={form.email} onChange={e => update('email',e.target.value)} /></div><div><p className="mb-3 text-sm font-semibold">{date?.toDateString()} · Time (IST)</p>{slotsLoading ? <p role="status" className="text-sm text-muted-foreground">Checking available times…</p> : slotsError ? <Button type="button" variant="outline" onClick={() => setRetrySlots(v => v + 1)}>Retry available times</Button> : <div className="grid grid-cols-4 gap-2">{SLOTS.map(s => { const unavailable = taken.includes(s) || (date && new Date(`${ymd(date)}T${s}:00+05:30`) <= new Date()); return <Button key={s} type="button" variant="outline" disabled={!!unavailable} aria-pressed={time === s} className={time === s ? 'border-primary bg-primary/5 text-primary' : ''} onClick={() => setTime(s)}>{s}</Button>; })}</div>}</div><dl className="grid grid-cols-2 gap-x-5 gap-y-3 border-y border-border py-5 text-sm">{[['Project',TYPES.find(t => t.id === type)?.label],['Contact',contact],['Budget',budget],['Name',form.name],['For',form.customer_type === 'company' ? form.company : 'Personal'],['City',form.city || 'Not specified']].map(([k,v]) => <div key={k}><dt className="text-muted-foreground">{k}</dt><dd className="mt-1 break-words font-medium capitalize">{v}</dd></div>)}</dl></div>}
            <div className="flex items-center justify-between gap-3 border-t border-border pt-6"><Button type="button" variant="ghost" disabled={step === 0 || busy} onClick={() => go(step - 1)}><ArrowLeft className="mr-2 h-4 w-4" />Back</Button><Button type="submit" disabled={busy || (step === 6 && (!time || slotsLoading || slotsError))}>{busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}{step === 6 ? 'Request appointment' : step === 4 && !form.details ? 'Skip idea & continue' : 'Continue'}{step < 6 && <ArrowRight className="ml-2 h-4 w-4" />}</Button></div>
          </motion.form></AnimatePresence>
        </div>
      </>}
    </main><Footer />
  </div>;
}
