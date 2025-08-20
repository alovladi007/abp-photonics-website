export type Plan = { name: string; price: string; features: string[]; cta: string };

export function PricingTable({ plans }: { plans: Plan[] }) {
  return (
    <div className="mt-8 grid gap-6 md:grid-cols-3">
      {plans.map((p) => (
        <div key={p.name} className="rounded-2xl border p-6 shadow-sm">
          <h3 className="text-xl font-semibold">{p.name}</h3>
          <p className="mt-2 text-2xl">{p.price}</p>
          <ul className="mt-4 space-y-1 text-sm text-slate-600">
            {p.features.map((f) => (
              <li key={f}>• {f}</li>
            ))}
          </ul>
          <a href={p.cta} className="mt-6 inline-block rounded-xl bg-slate-900 px-5 py-3 text-white">
            Select
          </a>
        </div>
      ))}
    </div>
  );
}