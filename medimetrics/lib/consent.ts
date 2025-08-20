export type Consent = { analytics: boolean; marketing: boolean };
const KEY = 'mm_consent';

export function getConsent(): Consent {
  if (typeof window === 'undefined') return { analytics: false, marketing: false };
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : { analytics: false, marketing: false };
  } catch {
    return { analytics: false, marketing: false };
  }
}

export function hasConsent(): boolean {
  if (typeof window === 'undefined') return false;
  return !!localStorage.getItem(KEY);
}

export function setConsent(c: Consent) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(KEY, JSON.stringify(c));
  document.cookie = `${KEY}=${encodeURIComponent(JSON.stringify(c))};path=/;max-age=15552000`; // 180 days
}

/**
 * Best-effort client-only region detection for GDPR jurisdictions (EU/EEA + UK).
 * This is heuristic — for production, prefer server-side geolocation at the edge.
 */
export function inGDPRRegion(): boolean {
  if (typeof navigator === 'undefined') return true; // default conservative
  const GDPR_COUNTRIES = new Set([
    'AT','BE','BG','HR','CY','CZ','DK','EE','FI','FR','DE','GR','HU','IS','IE','IT','LV','LI','LT','LU','MT','NL','NO','PL','PT','RO','SK','SI','ES','SE','GB'
  ]);
  const langs = navigator.languages || [navigator.language];
  for (const l of langs) {
    const m = /-([A-Z]{2})$/.exec(l);
    if (m && GDPR_COUNTRIES.has(m[1])) return true;
  }
  try {
    // Some browsers expose a locale with region via Intl
    // @ts-ignore
    const loc = Intl.DateTimeFormat().resolvedOptions().locale as string;
    const m2 = /-([A-Z]{2})$/.exec(loc || '');
    if (m2 && GDPR_COUNTRIES.has(m2[1])) return true;
  } catch {}
  return false;
}