import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware';
import { bookingSchema, SLOTS, validateBookingTime } from './booking-validation';
import { parsePhoneNumberFromString } from 'libphonenumber-js';

export { SLOTS } from './booking-validation';

const recentBookings = new Map<string, number[]>();
function checkProcessRateLimit(identity: string) {
  const cutoff = Date.now() - 60 * 60_000;
  const attempts = (recentBookings.get(identity) || []).filter(time => time > cutoff);
  if (attempts.length >= 3) throw new Error('Too many booking requests. Please try again in an hour.');
  attempts.push(Date.now());
  recentBookings.set(identity, attempts);
}

export const getTakenSlots = createServerFn({ method: 'GET' })
  .inputValidator((d) => z.object({ date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/) }).parse(d))
  .handler(async ({ data }) => {
    const { supabasePublic } = await import('@/integrations/supabase/client.server');
    const rpc = await supabasePublic.rpc('get_taken_booking_slots', { requested_date: data.date });
    if (!rpc.error) return (rpc.data || []).map((row: { booking_time: string }) => row.booking_time);
    const fallback = await supabasePublic.from('bookings').select('booking_time').eq('booking_date', data.date);
    return (fallback.data || []).map((row) => row.booking_time);
  });

export const createBooking = createServerFn({ method: 'POST' })
  .inputValidator((d) => bookingSchema.parse(d))
  .handler(async ({ data }) => {
    validateBookingTime(data.booking_date, data.booking_time);
    const { supabasePublic } = await import('@/integrations/supabase/client.server');
    const email = data.email ? data.email.toLowerCase() : null;
    const phone = data.preferred_contact === 'call' ? parsePhoneNumberFromString(data.phone, 'IN')?.number || '' : '';
    const whatsapp = data.preferred_contact === 'whatsapp' ? parsePhoneNumberFromString(data.whatsapp, 'IN')?.number || '' : '';
    checkProcessRateLimit(email || phone || whatsapp);
    const payload = { ...data, email: email || '', company: data.customer_type === 'company' ? data.company : '', phone, whatsapp };
    const rpc = await supabasePublic.rpc('submit_booking', { payload });
    let bookingId = typeof rpc.data === 'string' ? rpc.data : crypto.randomUUID();
    let error = rpc.error;
    if (rpc.error?.code === 'PGRST202' || rpc.error?.code === '42883') {
      const fallback = await supabasePublic.from('bookings').insert({ ...payload, id: bookingId });
      error = fallback.error;
    }
    if (error) throw new Error(error.code === '23505' ? 'That time was just booked. Please pick another slot.' : 'Booking could not be saved. Apply the latest booking SQL migration in Supabase.');
    let emailed = false;
    try {
    const { getTheme, renderEmail, sendMail } = await import('./mailer.server');
    const theme = await getTheme();
    if (theme.booking_enabled) {
      const rows: [string, string][] = [['Date', data.booking_date], ['Time', `${data.booking_time} IST`], ['Project', data.project_type], ['Budget', data.budget || '—']];
      if (email) {
        const r = await sendMail(email, 'Welcome — your Bnoy Studios booking request', renderEmail(theme, { title: 'Thanks for your booking request', intro: `Hi ${data.name}, welcome to Bnoy Studios. Your request is saved. Our team will review it and confirm your appointment. Your preferred contact channel is ${data.preferred_contact}.`, rows }), 'booking-welcome');
        emailed = r.sent;
      }
      const admin = process.env['SMTP_USER'];
      if (admin) await sendMail(admin, `New booking: ${data.name} (${data.booking_date} ${data.booking_time})`, renderEmail(theme, { title: 'New call booking', intro: data.details || 'No details given.', rows: [...rows, ['Name', data.name], ['Email', data.email || '—'], ['Phone', data.phone || '—'], ['WhatsApp', data.whatsapp || '—'], ['Age', data.age ? String(data.age) : '—'], ['Gender', data.gender || '—'], ['Address', [data.address, data.pincode].filter(Boolean).join(' ') || '—'], ['Company', data.company || '—'], ['Prefers', data.preferred_contact]] }), 'booking-admin');
    }
    } catch { /* The booking remains saved even if the email service is unavailable. */ }
    return { id: bookingId, emailed };
  });

async function assertAdmin(ctx: { supabase: any; userId: string }) {
  const { data } = await ctx.supabase.rpc('has_role', { _user_id: ctx.userId, _role: 'admin' });
  if (!data) throw new Error('Forbidden');
}

export const confirmBooking = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { data: booking, error } = await context.supabase.from('bookings').select('*').eq('id', data.id).single();
    if (error || !booking) throw new Error('Booking not found.');
    if (booking.status === 'cancelled' || booking.status === 'done') throw new Error('This booking cannot be confirmed.');
    if (booking.confirmation_sent_at) return { sent: true, alreadySent: true };
    const { getTheme, renderEmail, sendMail } = await import('./mailer.server');
    const theme = await getTheme();
    if (!booking.email) throw new Error('This booking has no secondary email. Confirm it through the selected contact channel.');
    const result = await sendMail(booking.email, 'Your Bnoy Studios appointment is confirmed', renderEmail(theme, { title: 'Your appointment is confirmed', intro: `Hi ${booking.name}, we have confirmed your appointment. We will reach you through ${booking.preferred_contact || 'your chosen contact channel'}.`, rows: [['Date', booking.booking_date], ['Time', `${booking.booking_time} IST`], ['Project', booking.project_type]] }), 'booking-confirmation');
    if (result.sent) {
      const { error: updateError } = await context.supabase.from('bookings').update({ status: 'confirmed', confirmation_sent_at: new Date().toISOString() }).eq('id', booking.id);
      if (updateError) throw new Error('Email sent, but booking status could not update. Refresh before retrying.');
    }
    return { ...result, alreadySent: false };
  });

export const sendTestEmail = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ to: z.string().email() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { getTheme, renderEmail, sendMail } = await import('./mailer.server');
    const theme = await getTheme();
    return sendMail(data.to, 'Test email from Bnoy Studios', renderEmail(theme, { title: 'Email is working 🎉', intro: 'This is a test of your email design and Gmail sender.', cta: { label: 'Visit website', url: 'https://bnoy01.lovable.app' } }), 'test');
  });

export const announceProduct = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ title: z.string().max(160), url: z.string().url() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { getTheme, renderEmail, sendMail } = await import('./mailer.server');
    const theme = await getTheme();
    if (!theme.product_enabled) return { sent: 0 };
    const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
    const { data: users } = await supabaseAdmin.from('profiles').select('email,name').not('email', 'is', null).limit(500);
    let sent = 0;
    for (const u of users || []) {
      const r = await sendMail(u.email!, `New on Bnoy Studios: ${data.title}`, renderEmail(theme, { title: data.title, intro: `Hi ${u.name || 'there'}, we just launched something new.`, cta: { label: 'See it now', url: data.url } }), 'product');
      if (r.sent) sent++;
    }
    return { sent };
  });

export const sendWelcomeIfNeeded = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
    const { data: p } = await supabaseAdmin.from('profiles').select('email,name,welcome_email_sent').eq('id', context.userId).maybeSingle();
    if (!p?.email || p.welcome_email_sent || p.email.endsWith('.invalid')) return { sent: false };
    await supabaseAdmin.from('profiles').update({ welcome_email_sent: true }).eq('id', context.userId);
    const { sendWelcome } = await import('./email-link.functions');
    return sendWelcome(p.email, p.name || '');
  });
