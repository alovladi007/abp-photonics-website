export function TrustBar() {
  const items = [
    'BAA on AWS',
    'PHI minimization',
    'Encrypted at rest & in transit',
    'RBAC & audit logs',
    'OHIF viewer integration'
  ];
  return (
    <section className="mt-10 grid grid-cols-1 gap-2 rounded-2xl border p-4 text-sm text-slate-600 md:grid-cols-5">
      {items.map(i => (
        <div key={i} className="text-center">{i}</div>
      ))}
    </section>
  );
}