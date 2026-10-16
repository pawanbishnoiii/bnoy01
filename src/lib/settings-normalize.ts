/** Browser-safe settings normalisers shared by Admin Settings and tests. */
export function normalizeSiteUrl(input?: string | null): string | null {
  let value = String(input ?? '').trim().replace(/\s+/g, '');
  if (!value) return null;
  if (/^http:\/\//i.test(value)) value = value.replace(/^http:\/\//i, 'https://');
  if (!/^https:\/\//i.test(value)) value = `https://${value.replace(/^\/+/, '')}`;
  let parsed: URL;
  try { parsed = new URL(value); } catch { throw new Error('Live site URL is not a valid web address.'); }
  if (!parsed.hostname.includes('.')) throw new Error('Live site URL needs a full domain, like example.com.');
  return parsed.origin;
}

export function normalizeWhatsapp(input?: string | null): string | null {
  const raw = String(input ?? '').trim();
  if (!raw) return null;
  const plus = raw.startsWith('+') || raw.startsWith('00');
  const digits = raw.replace(/\D/g, '').replace(/^00/, '');
  if (digits.length < 8 || digits.length > 15) throw new Error('WhatsApp number must contain 8-15 digits, with an optional + country code.');
  return plus ? `+${digits}` : digits;
}

/** Optional link fields: empty → null, bare domains get https://. */
export function normalizeOptionalLink(input?: string | null): string | null {
  const value = String(input ?? '').trim();
  if (!value) return null;
  if (/^(https?:|mailto:|tel:|\/)/i.test(value)) return value;
  return `https://${value}`;
}