'use client';
import { useState } from 'react';

const faqs = [
  {
    q: 'Is this a medical device?',
    a: 'For investigational/clinical decision support; regulated use requires appropriate clearances.'
  },
  {
    q: 'Where is data stored?',
    a: 'In HIPAA‑eligible AWS regions you select.'
  }
];

export function FAQ() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <section className="mt-16">
      <h2 className="text-2xl font-semibold">FAQ</h2>
      <div className="mt-6 divide-y">
        {faqs.map((f, i) => (
          <div key={f.q} className="py-4">
            <button onClick={() => setOpen(open === i ? null : i)} className="flex w-full items-center justify-between text-left">
              <span className="font-medium">{f.q}</span>
              <span>{open === i ? '−' : '+'}</span>
            </button>
            {open === i && <p className="mt-2 text-sm text-slate-600">{f.a}</p>}
          </div>
        ))}
      </div>
    </section>
  );
}