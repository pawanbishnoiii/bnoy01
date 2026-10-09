import { useEffect, useMemo, useState } from 'react';
import { useServerFn } from '@tanstack/react-start';
import { motion } from 'framer-motion';
import { CalendarDays, Clock, Globe, Smartphone, Bot, Cpu, Monitor, Sparkles, CheckCircle2, Loader2 } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import AuthModal from '@/components/AuthModal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { toast } from 'sonner';
import { createBooking, getTakenSlots, SLOTS } from '@/lib/booking.functions';
import { useAuthStore } from '@/store/authStore';
import { useScroll, useTransform } from 'framer-motion';
import clayHero from '@/assets/call-clay-hero.png';
import claySteps from '@/assets/call-clay-steps.png';

const TYPES = [
  { id: 'web', label: 'Website / Web app', icon: Globe },
  { id: 'app', label: 'Mobile app', icon: Smartphone },
  { id: 'automation', label: 'AI & Automation', icon: Bot },
  { id: 'software', label: 'Custom software', icon: Cpu },
  { id: 'windows', label: 'Windows software', icon: Monitor },
  { id: 'other', label: 'Something else', icon: Sparkles },
] as const;
const BUDGETS = ['Under ₹10k', '₹10k – ₹50k', '₹50k – ₹2L', '₹2L+', 'Not sure'];
const ymd = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

export default function CallBooking() {
  const { user } = useAuthStore();
  const book = useServerFn(createBooking);
  const fetchTaken = useServerFn(getTakenSlots);
  const [date, setDate] = useState<Date | undefined>();
  const [time, setTime] = useState('');
  const [taken, setTaken] = useState<string[]>([]);
  const [type, setType] = useState<string>('web');
  const [budget, setBudget] = useState('Not sure');
  const [form, setForm] = useState({ name: '', email: '', phone: '', whatsapp: '', age: '', gender: '', address: '', pincode: '', company: '', preferred_contact: 'call' as 'call' | 'whatsapp' | 'email', details: '' });
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<null | { emailed: boolean }>(null);

  useEffect(() => { if (user) setForm((f) => ({ ...f, email: f.email || user.email || '', name: f.name || user.user_metadata?.name || '' })); }, [user]);
  useEffect(() => { setTime(''); if (date) fetchTaken({ data: { date: ymd(date) } }).then(setTaken).catch(() => setTaken([])); }, [date]);
  const today = useMemo(() => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!date || !time) return toast.error('Please pick a date and time.');
    if (!/\d{7,}/.test(form.phone + form.whatsapp)) return toast.error('Add a phone or WhatsApp number.');
    setBusy(true);
    try {
      const r = await book({ data: { ...form, age: form.age ? Number(form.age) : undefined, project_type: type as any, budget, booking_date: ymd(date), booking_time: time } });
      setDone({ emailed: r.emailed });
    } catch (err) { toast.error(err instanceof Error ? err.message : 'Booking failed'); }
    finally { setBusy(false); }
  };

  const { scrollYProgress } = useScroll();
  const floatY = useTransform(scrollYProgress, [0, 1], [0, -160]);
  const rotate = useTransform(scrollYProgress, [0, 1], [0, 8]);
  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <Navbar /><AuthModal />
      <main className="container mx-auto px-4 pt-28 pb-20 max-w-6xl">
        <section className="grid md:grid-cols-2 gap-8 items-center mb-14">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 text-primary px-3 py-1 text-xs font-semibold"><CalendarDays className="h-3.5 w-3.5" /> Free 30-minute call</span>
            <h1 className="font-display text-4xl md:text-6xl font-extrabold mt-4 text-ink leading-[1.05]">Tell us your idea. <span className="gradient-text">We'll build it.</span></h1>
            <p className="text-muted-foreground mt-4 text-lg">Websites, apps, automation or Windows software — pick a time and we'll plan how to turn your idea into real, working software.</p>
            <div className="flex flex-wrap gap-3 mt-6 text-sm">
              {['No cost, no pressure', 'Reply within 24h', 'Talk on call or WhatsApp'].map((t, i) => (
                <motion.span key={t} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 + i * 0.12 }} className="rounded-full border border-border bg-card px-3 py-1.5 font-medium">✓ {t}</motion.span>
              ))}
            </div>
          </motion.div>
          <motion.div style={{ y: floatY, rotate }} className="relative">
            <div className="absolute inset-8 rounded-full bg-primary/20 blur-3xl" />
            <motion.img src={clayHero} alt="Clay illustration of a video call with a developer" width={1024} height={1024}
              initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1, y: [0, -10, 0] }} transition={{ duration: 0.8, y: { repeat: Infinity, duration: 5, ease: 'easeInOut' } }}
              className="relative w-full max-w-md mx-auto drop-shadow-2xl" />
          </motion.div>
        </section>
        <motion.section initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.3 }} transition={{ duration: 0.7 }} className="mb-12 rounded-[2rem] border border-border bg-card p-6 md:p-8 shadow-card">
          <img src={claySteps} alt="Pick a date, connect on WhatsApp, get your plan" width={1248} height={544} loading="lazy" className="w-full max-w-3xl mx-auto" />
          <div className="grid grid-cols-3 gap-4 text-center max-w-3xl mx-auto -mt-2">
            {[['1', 'Pick a slot'], ['2', 'We call / WhatsApp you'], ['3', 'Get a clear plan & price']].map(([n, l], i) => (
              <motion.div key={n} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.15 }}>
                <p className="font-display text-2xl font-extrabold text-primary">{n}</p><p className="text-sm font-semibold">{l}</p>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {done ? (
          <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="max-w-lg mx-auto text-center rounded-3xl border border-border bg-card p-10 shadow-card">
            <CheckCircle2 className="h-14 w-14 text-primary mx-auto" />
            <h2 className="font-display text-2xl font-bold mt-4">Your call is booked!</h2>
            <p className="text-muted-foreground mt-2">{date?.toDateString()} at {time} IST.</p>
            <p className="text-sm text-muted-foreground mt-2">{done.emailed ? 'A confirmation email is on its way.' : 'We saved your booking and will contact you soon.'}</p>
            <Button className="mt-6 gradient-fire-strong text-primary-foreground" onClick={() => { setDone(null); setDate(undefined); setTime(''); }}>Book another call</Button>
          </motion.div>
        ) : (
          <form onSubmit={submit} className="grid lg:grid-cols-[1fr_1.1fr] gap-6">
            <section className="rounded-3xl border border-border bg-card p-5 md:p-6 shadow-card">
              <h2 className="font-display font-bold text-lg flex items-center gap-2"><CalendarDays className="h-5 w-5 text-primary" />1. Pick a date</h2>
              <div className="flex justify-center mt-3">
                <Calendar mode="single" selected={date} onSelect={setDate} disabled={(d) => d < today || d.getDay() === 0} className="rounded-2xl border border-border" />
              </div>
              <h2 className="font-display font-bold text-lg flex items-center gap-2 mt-6"><Clock className="h-5 w-5 text-primary" />2. Pick a time (IST)</h2>
              {!date ? <p className="text-sm text-muted-foreground mt-2">Choose a date first.</p> : (
                <div className="grid grid-cols-4 gap-2 mt-3">
                  {SLOTS.map((s) => {
                    const off = taken.includes(s);
                    return <button type="button" key={s} disabled={off} onClick={() => setTime(s)} className={`rounded-xl border py-2.5 text-sm font-semibold transition-all ${time === s ? 'bg-primary text-primary-foreground border-primary' : off ? 'opacity-40 line-through border-border' : 'border-border hover:border-primary hover:text-primary'}`}>{s}</button>;
                  })}
                </div>
              )}
            </section>

            <section className="rounded-3xl border border-border bg-card p-5 md:p-6 shadow-card space-y-5">
              <div>
                <h2 className="font-display font-bold text-lg">3. What do you want to build?</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-3">
                  {TYPES.map((t) => (
                    <button type="button" key={t.id} onClick={() => setType(t.id)} className={`rounded-2xl border p-3 text-left text-sm transition-all ${type === t.id ? 'border-primary bg-primary/10 text-primary' : 'border-border hover:border-primary/50'}`}>
                      <t.icon className="h-5 w-5 mb-1.5" /><span className="font-semibold">{t.label}</span>
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-sm font-semibold mb-2">Budget</p>
                <div className="flex flex-wrap gap-2">{BUDGETS.map((b) => <button type="button" key={b} onClick={() => setBudget(b)} className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${budget === b ? 'bg-primary text-primary-foreground border-primary' : 'border-border'}`}>{b}</button>)}</div>
              </div>
              <div className="grid sm:grid-cols-2 gap-3">
                <Input required placeholder="Your name *" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                <Input required type="email" placeholder="Email *" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                <Input type="tel" placeholder="Phone number" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                <Input type="tel" placeholder="WhatsApp number" value={form.whatsapp} onChange={(e) => setForm({ ...form, whatsapp: e.target.value })} />
                <p className="sm:col-span-2 -mt-1 text-xs text-muted-foreground">* Phone or WhatsApp — at least one is required.</p>
              </div>
              <div>
                <p className="text-sm font-semibold mb-2">How should we reach you?</p>
                <div className="flex gap-2">{(['call', 'whatsapp', 'email'] as const).map((c) => <button type="button" key={c} onClick={() => setForm({ ...form, preferred_contact: c })} className={`rounded-full border px-4 py-1.5 text-xs font-semibold capitalize ${form.preferred_contact === c ? 'bg-primary text-primary-foreground border-primary' : 'border-border'}`}>{c}</button>)}</div>
              </div>
              <details className="rounded-2xl border border-border p-4 group">
                <summary className="cursor-pointer text-sm font-semibold">More about you <span className="text-muted-foreground font-normal">(optional)</span></summary>
                <div className="grid sm:grid-cols-2 gap-3 mt-3">
                  <Input type="number" min={10} max={110} placeholder="Age" value={form.age} onChange={(e) => setForm({ ...form, age: e.target.value })} />
                  <select value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })} className="h-10 rounded-md border border-input bg-background px-3 text-sm"><option value="">Gender</option><option>Male</option><option>Female</option><option>Other</option><option>Prefer not to say</option></select>
                  <Input placeholder="Company / brand" value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} />
                  <Input inputMode="numeric" placeholder="PIN code" value={form.pincode} onChange={(e) => setForm({ ...form, pincode: e.target.value })} />
                  <Input placeholder="Address / city" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className="sm:col-span-2" />
                </div>
              </details>
              <Textarea rows={4} placeholder="Describe your idea in a few lines…" value={form.details} onChange={(e) => setForm({ ...form, details: e.target.value })} />
              <Button type="submit" disabled={busy} className="w-full h-12 rounded-full gradient-fire-strong text-primary-foreground font-bold">
                {busy ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Booking…</> : date && time ? `Book ${date.toDateString()} · ${time}` : 'Book my free call'}
              </Button>
            </section>
          </form>
        )}
      </main>
      <Footer />
    </div>
  );
}
