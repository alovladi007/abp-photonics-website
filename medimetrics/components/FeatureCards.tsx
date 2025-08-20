export function FeatureCards() {
  const items = [
    { title: 'Faster triage', desc: 'Prioritize critical findings with configurable thresholds.' },
    { title: 'Explainable results', desc: 'Grad‑CAM overlays, thumbnails, versioned reports.' },
    { title: 'Easy integration', desc: 'DICOMweb/Orthanc, FHIR export, PDF reports.' },
    { title: 'Enterprise‑ready', desc: 'SSO (SAML/OIDC), 2FA, audit queries, Prometheus metrics.' }
  ];
  return (
    <section className="mt-16 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
      {items.map(i => (
        <div key={i.title} className="rounded-2xl border p-6 shadow-sm">
          <h3 className="font-semibold">{i.title}</h3>
          <p className="mt-2 text-sm text-slate-600">{i.desc}</p>
        </div>
      ))}
    </section>
  );
}