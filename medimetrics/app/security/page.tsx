export default function Security() {
  return (
    <main className="mx-auto max-w-6xl px-6 py-16">
      <h1 className="text-4xl font-bold">Security & Compliance</h1>
      <p className="mt-4 text-slate-600">HIPAA‑aligned controls with BAAs, encryption, and auditability.</p>
      <div className="mt-10 grid gap-6 md:grid-cols-2">
        <div className="rounded-2xl border p-6">
          <h2 className="text-xl font-semibold">Controls</h2>
          <ul className="mt-3 list-disc pl-6 text-sm text-slate-600">
            <li>Encryption at rest & in transit</li>
            <li>RBAC with 2FA and SSO</li>
            <li>Audit logs and anomaly detection</li>
            <li>Backups, DR, and monitoring</li>
          </ul>
        </div>
        <div className="rounded-2xl border p-6">
          <h2 className="text-xl font-semibold">Data Flow</h2>
          <p className="mt-2 text-sm text-slate-600">DICOM ingest → temporary processing → explainable results → reports → export to EHR/PACS.</p>
          <div className="mt-4 rounded-xl border p-4 text-xs text-slate-500">[Insert architecture SVG here]</div>
        </div>
      </div>
    </main>
  );
}