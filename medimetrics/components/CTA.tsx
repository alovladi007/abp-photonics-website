import Link from 'next/link';

export function CTA() {
  return (
    <section className="mt-16 rounded-2xl border p-8 text-center">
      <h2 className="text-2xl font-semibold">Ready to accelerate reads?</h2>
      <p className="mt-2 text-slate-600">Start a pilot or explore the demo environment.</p>
      <div className="mt-6 flex justify-center gap-4">
        <Link href="/contact" className="rounded-xl bg-slate-900 px-6 py-3 text-white">Request a demo</Link>
        <Link href="/pricing" className="rounded-xl border px-6 py-3">See pricing</Link>
      </div>
    </section>
  );
}