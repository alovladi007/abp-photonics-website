import Link from 'next/link';

export function Navbar() {
  return (
    <header className="sticky top-0 z-40 w-full border-b bg-white/70 backdrop-blur">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
        <Link href="/" className="font-semibold">MediMetrics</Link>
        <div className="flex items-center gap-6 text-sm">
          <Link href="/solutions">Solutions</Link>
          <Link href="/security">Security</Link>
          <Link href="/pricing">Pricing</Link>
          <Link href="/blog">Blog</Link>
          <Link href="/contact" className="rounded-xl bg-slate-900 px-4 py-2 text-white">Request a demo</Link>
        </div>
      </nav>
    </header>
  );
}