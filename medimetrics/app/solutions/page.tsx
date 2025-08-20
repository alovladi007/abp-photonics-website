export default function Solutions() {
  return (
    <main className="mx-auto max-w-6xl px-6 py-16">
      <h1 className="text-4xl font-bold">Solutions</h1>
      <p className="mt-4 text-slate-600">For Radiology groups and Clinics: problems → outcomes, model explainability, and integration paths.</p>
      <div className="mt-10 grid gap-6 md:grid-cols-2">
        <div className="rounded-2xl border p-6">
          <h2 className="text-xl font-semibold">Radiology</h2>
          <ul className="mt-3 list-disc pl-6 text-sm text-slate-600">
            <li>Triage queues with configurable thresholds</li>
            <li>Reader assist with Grad‑CAM overlays</li>
            <li>Versioned PDF reports & audit trail</li>
          </ul>
        </div>
        <div className="rounded-2xl border p-6">
          <h2 className="text-xl font-semibold">Clinics</h2>
          <ul className="mt-3 list-disc pl-6 text-sm text-slate-600">
            <li>Point‑of‑care quick look</li>
            <li>EHR/FHIR integration</li>
            <li>Role‑based access and logging</li>
          </ul>
        </div>
      </div>
    </main>
  );
}