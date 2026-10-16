import { describe, expect, it } from 'vitest';
import { normalizeSiteUrl, normalizeWhatsapp, normalizeOptionalLink } from '@/lib/settings-normalize';

describe('settings normalisers', () => {
  it('adds https to a bare domain and strips trailing slash', () => {
    expect(normalizeSiteUrl('bnoyservices.vercel.app/')).toBe('https://bnoyservices.vercel.app');
  });
  it('upgrades http to https', () => {
    expect(normalizeSiteUrl('http://example.com')).toBe('https://example.com');
  });
  it('rejects a value without a domain', () => {
    expect(() => normalizeSiteUrl('localhost')).toThrow();
  });
  it('accepts WhatsApp numbers with spaces, dashes and brackets', () => {
    expect(normalizeWhatsapp('+91 (98765) 43-210')).toBe('+919876543210');
  });
  it('rejects a too-short WhatsApp number', () => {
    expect(() => normalizeWhatsapp('12345')).toThrow();
  });
  it('prefixes social links missing a scheme', () => {
    expect(normalizeOptionalLink('github.com/bnoy')).toBe('https://github.com/bnoy');
  });
});