import { z } from 'zod';
import { parsePhoneNumberFromString } from 'libphonenumber-js';

export const SLOTS = ['10:00', '11:00', '12:00', '14:00', '15:00', '16:00', '17:00', '18:00'] as const;
export const bookingSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.string().trim().max(160).optional().default(''),
  phone: z.string().trim().max(30).optional().default(''),
  whatsapp: z.string().trim().max(30).optional().default(''),
  age: z.number().int().min(10).max(110).optional(),
  gender: z.enum(['', 'Male', 'Female', 'Other', 'Prefer not to say']).optional().default(''),
  address: z.string().trim().max(300).optional().default(''),
  city: z.string().trim().max(120).optional().default(''),
  pincode: z.string().trim().regex(/^(\d{6})?$/, 'Enter a six-digit Indian PIN code.').optional().default(''),
  customer_type: z.enum(['personal', 'company']).optional().default('personal'),
  company: z.string().trim().max(120).optional().default(''),
  preferred_contact: z.enum(['call', 'whatsapp', 'email']).optional().default('call'),
  project_type: z.enum(['web', 'app', 'automation', 'software', 'windows', 'other']),
  budget: z.string().max(40).optional().default(''),
  details: z.string().trim().max(2000).optional().default(''),
  booking_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  booking_time: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Pick a valid time.'),
}).superRefine((v, ctx) => {
  if (v.customer_type === 'company' && !v.company) ctx.addIssue({ code: 'custom', path: ['company'], message: 'Enter your company name.' });
  if (v.preferred_contact !== 'email') {
    const key = v.preferred_contact === 'call' ? 'phone' : 'whatsapp';
    if (!parsePhoneNumberFromString(v[key], 'IN')?.isValid()) ctx.addIssue({ code: 'custom', path: [key], message: `Enter a valid ${key === 'phone' ? 'phone' : 'WhatsApp'} number.` });
  }
  if (v.preferred_contact === 'email' && !z.string().email().safeParse(v.email).success) {
    ctx.addIssue({ code: 'custom', path: ['email'], message: 'Enter a valid email address.' });
  }
  if (v.preferred_contact !== 'email' && v.email && !z.string().email().safeParse(v.email).success) {
    ctx.addIssue({ code: 'custom', path: ['email'], message: 'Enter a valid secondary email, or leave it blank.' });
  }
});

export function validateBookingTime(date: string, time: string, now = new Date()) {
  const start = new Date(`${date}T${time}:00+05:30`);
  if (!Number.isFinite(start.getTime()) || start.toISOString().slice(0, 10) !== date) throw new Error('Please pick a valid date.');
  if (new Date(`${date}T12:00:00+05:30`).getUTCDay() === 0) throw new Error('Sunday appointments are unavailable.');
  if (start <= now) throw new Error('Please pick a future date and time.');
}
