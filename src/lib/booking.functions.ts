import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware';

export const SLOTS = ['10:00', '11:00', '12:00', '14:00', '15:00', '16:00', '17:00', '18:00'];

export const getTakenSlots = createServerFn({ method: 'GET' })
  .inputValidator((d) => z.object({ date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/) }).parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
    const { data: rows } = await supabaseAdmin.from('bookings').select('booking_time').eq('booking_date', data.date).neq('status', 'cancelled');
    return (rows || []).map((r) => r.booking_time);
  });

const bookingSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.string().trim().email().max(160),
  phone: z.string().trim().max(20).optional().default(''),
  project_type: z.enum(['web', 'app', 'automation', 'software', 'windows', 'other']),
  budget: z.string().max(40).optional().default(''),
  details: z.string().trim().max(2000).optional().default(''),
  booking_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  booking_time: z.enum(SLOTS as [string, ...string[]]),
});

export const createBooking = createServerFn({ method: 'POST' })
  .inputValidator((d) => bookingSchema.parse(d))
  .handler(async ({ data }) => {
    const today = new Date().toISOString().slice(0, 10);
    if (data.booking_date < today) throw new Error('Please pick a future date.');
    const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
    const { data: row, error } = await supabaseAdmin.from('bookings').insert({ ...data, email: data.email.toLowerCase() }).select('id').single();
    if (error) throw new Error(error.code === '23505' ? 'That time was just booked. Please pick another slot.' : 'Booking could not be saved.');
    const { getTheme, renderEmail, sendMail } = await import('./mailer.server');
    const theme = await getTheme();
    let emailed = false;
    if (theme.booking_enabled) {
      const rows: [string, string][] = [['Date', data.booking_date], ['Time', `${data.booking_time} IST`], ['Project', data.project_type], ['Budget', data.budget || '—']];
      const r = await sendMail(data.email, 'Your call with Bnoy Studios is booked', renderEmail(theme, { title: 'Your call is booked!', intro: `Hi ${data.name}, thanks for sharing your idea. We will call you at the time below and plan how to turn it into real software.`, rows }), 'booking');
      emailed = r.sent;
      const admin = process.env['SMTP_USER'];
      if (admin) await sendMail(admin, `New booking: ${data.name} (${data.booking_date} ${data.booking_time})`, renderEmail(theme, { title: 'New call booking', intro: data.details || 'No details given.', rows: [...rows, ['Name', data.name], ['Email', data.email], ['Phone', data.phone || '—']] }), 'booking-admin');
    }
    return { id: row.id, emailed };
  });

async function assertAdmin(ctx: { supabase: any; userId: string }) {
  const { data } = await ctx.supabase.rpc('has_role', { _user_id: ctx.userId, _role: 'admin' });
  if (!data) throw new Error('Forbidden');
}

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
    const { getTheme, renderEmail, sendMail } = await import('./mailer.server');
    const theme = await getTheme();
    if (!theme.signup_enabled) return { sent: false };
    return sendMail(p.email, 'Welcome to Bnoy Studios', renderEmail(theme, { title: `Welcome${p.name ? ', ' + p.name : ''}!`, intro: 'Your account is ready. Explore ready-made projects or book a free call to build your own idea.', cta: { label: 'Book a free call', url: 'https://bnoy01.lovable.app/call' } }), 'welcome');
  });
