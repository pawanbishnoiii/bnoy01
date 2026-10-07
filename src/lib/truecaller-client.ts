export const TRUECALLER_STORAGE_KEY = 'bnoy_truecaller';
export type TruecallerAttempt = { requestId: string; proof: string; expiresAt?: string; startedAt?: number; deepLink?: string };
export function readTruecallerAttempt(): TruecallerAttempt | null {
  try {
    const raw = sessionStorage.getItem(TRUECALLER_STORAGE_KEY);
    if (!raw) return null;
    const value = JSON.parse(raw);
    if (typeof value.requestId !== 'string' || !/^[a-f\d-]{36}$/i.test(value.requestId) || typeof value.proof !== 'string' || value.proof.length < 64) return null;
    if (value.expiresAt && Date.parse(value.expiresAt) <= Date.now()) return null;
    return value;
  } catch { return null; }
}