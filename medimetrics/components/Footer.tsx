'use client';

export function Footer() {
  function openConsent(e: React.MouseEvent) {
    e.preventDefault();
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('mm:open-consent'));
    }
  }

  return (
    <footer className="border-t">
      <div className="mx-auto max-w-6xl px-6 py-8 text-sm text-slate-600">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <p>© {new Date().getFullYear()} MediMetrics. All rights reserved.</p>
          <div className="flex flex-wrap items-center gap-4">
            <a href="/legal/tos">Terms</a>
            <a href="/legal/privacy">Privacy</a>
            <a href="/legal/baa">BAA</a>
            <a href="#cookies" onClick={openConsent}>Manage Cookies</a>
          </div>
        </div>
      </div>
    </footer>
  );
}