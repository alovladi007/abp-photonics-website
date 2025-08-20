import { PricingTable, Plan } from '@/components/PricingTable';

const plans: Plan[] = [
  { name: 'Starter', price: '$99/mo', features: ['2 seats', '50GB storage', '$0.05/inference‑minute'], cta: '/api/checkout?plan=starter' },
  { name: 'Pro', price: '$499/mo', features: ['10 seats', '500GB', '$0.04/inference‑minute', 'SSO optional'], cta: '/api/checkout?plan=pro' },
  { name: 'Enterprise', price: 'Custom', features: ['Volume pricing', 'BAA workflows', 'Dedicated support'], cta: '/contact' }
];

export default function Pricing() {
  return (
    <main className="mx-auto max-w-6xl px-6 py-16">
      <h1 className="text-4xl font-bold">Pricing</h1>
      <PricingTable plans={plans} />
      <section className="mt-16">
        <h2 className="text-2xl font-semibold">FAQs</h2>
        <ul className="mt-4 list-disc pl-6 text-slate-600">
          <li>Is this a medical device? For investigational/clinical decision support; regulated use requires appropriate clearances.</li>
          <li>Where is data stored? In HIPAA‑eligible AWS regions you select.</li>
        </ul>
      </section>
    </main>
  );
}