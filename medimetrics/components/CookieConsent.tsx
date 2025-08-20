'use client';
import { useEffect, useState } from 'react';
import { getConsent, setConsent, hasConsent, inGDPRRegion } from '@/lib/consent';

export function CookieConsent() {
  const [open, setOpen] = useState(false);
  const [analytics, setAnalytics] = useState(false);
  const [marketing, setMarketing] = useState(false);

  useEffect(() => {
    const exists = hasConsent();
    const c = getConsent();
    setAnalytics(c.analytics);
    setMarketing(c.marketing);

    // Auto-open in GDPR regions if no prior choice
    if (!exists && inGDPRRegion()) setOpen(true);

    const handler = () => setOpen(true);
    window.addEventListener('mm:open-consent', handler);
    return () => window.removeEventListener('mm:open-consent', handler);
  }, []);

  if (!open) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 border-t bg-white/95 p-4 backdrop-blur">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <p className="text-sm text-slate-700">
          We use cookies to provide essential site functionality and optional analytics. You can change your choices anytime.
        </p>
        <div className="flex flex-col items-stretch gap-2 md:flex-row md:items-center">
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={analytics} onChange={e => setAnalytics(e.target.checked)} /> Analytics
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={marketing} onChange={e => setMarketing(e.target.checked)} /> Marketing
          </label>
          <button
            className="rounded-lg border px-4 py-2 text-sm"
            onClick={() => {
              setConsent({ analytics: false, marketing: false });
              setOpen(false);
              location.reload();
            }}
          >Decline</button>
          <button
            className="rounded-lg bg-slate-900 px-4 py-2 text-sm text-white"
            onClick={() => {
              setConsent({ analytics, marketing });
              setOpen(false);
              location.reload();
            }}
          >Save</button>
        </div>
      </div>
    </div>
  );
}