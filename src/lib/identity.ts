import { parsePhoneNumberFromString, type CountryCode } from 'libphonenumber-js';
export function normalizePhone(value: string, country?: string) {
  const raw = value.trim();
  const phone = parsePhoneNumberFromString(raw.startsWith('+') ? raw : country ? raw : `+${raw}`, country?.toUpperCase() as CountryCode | undefined);
  if (!phone?.isValid()) throw new Error('A valid international phone number is required.');
  return { phone: phone.number as string, countryCode: `+${phone.countryCallingCode}` };
}
export const normalizedEmail = (email: string) => email.trim().toLowerCase();