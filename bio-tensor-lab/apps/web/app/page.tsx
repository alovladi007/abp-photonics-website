import Link from "next/link";

export default function MarketingHome() {
  return (
    <main className="min-h-dvh">
      <section className="mx-auto max-w-6xl px-6 py-20">
        <h1 className="text-5xl font-semibold tracking-tight">BioTensor Lab</h1>
        <p className="mt-4 text-lg text-neutral-600 dark:text-neutral-300">
          Stream EEG/ECG/HRV, run explainable AI, and deliver clinician-grade insights with HIPAA-ready controls.
        </p>
        <div className="mt-8 flex gap-4">
          <Link href="/app" className="rounded-xl px-5 py-3 bg-black text-white dark:bg-white dark:text-black">Launch App</Link>
          <Link href="/security" className="rounded-xl px-5 py-3 border">Security & Compliance</Link>
          <Link href="/app/stream" className="rounded-xl px-5 py-3 border">Live Stream Demo</Link>
        </div>
      </section>
    </main>
  );
}