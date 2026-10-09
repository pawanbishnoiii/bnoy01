import { describe, expect, it } from 'vitest';
import { bookingSchema, validateBookingTime } from '@/lib/booking-validation';
const base = { name: 'Test Person', email: 'test@example.com', preferred_contact: 'email', project_type: 'web', booking_date: '2026-10-12', booking_time: '10:00' };
describe('booking validation', () => {
  it('allows email-only bookings', () => expect(bookingSchema.safeParse(base).success).toBe(true));
  it('requires the selected phone channel', () => {
    expect(bookingSchema.safeParse({ ...base, preferred_contact: 'call', whatsapp: '9876543210' }).success).toBe(false);
    expect(bookingSchema.safeParse({ ...base, preferred_contact: 'whatsapp', whatsapp: '9876543210' }).success).toBe(true);
  });
  it('requires company name only for a company', () => expect(bookingSchema.safeParse({ ...base, customer_type: 'company' }).success).toBe(false));
  it('rejects invalid PIN and out-of-range age', () => {
    expect(bookingSchema.safeParse({ ...base, pincode: '123' }).success).toBe(false);
    expect(bookingSchema.safeParse({ ...base, age: 5 }).success).toBe(false);
  });
  it('rejects past times, invalid dates and Sundays', () => {
    const now = new Date('2026-10-09T06:00:00Z');
    expect(() => validateBookingTime('2026-10-09','10:00',now)).toThrow();
    expect(() => validateBookingTime('2026-02-30','10:00',now)).toThrow();
    expect(() => validateBookingTime('2026-10-11','10:00',now)).toThrow();
    expect(() => validateBookingTime('2026-10-12','10:00',now)).not.toThrow();
  });
});