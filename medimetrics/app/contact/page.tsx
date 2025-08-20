'use client';
import { useState } from 'react';

export default function Contact() {
  const [s, setS] = useState<'idle' | 'ok' | 'err' | 'fallback'>('idle');
  const onSubmit = async (e: any) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const payload = {
      name: fd.get('name'),
      email: fd.get('email'),
      message: fd.get('message')
    };

    // Try HubSpot first if configured
    const portal = process.env.NEXT_PUBLIC_HUBSPOT_PORTAL_ID || process.env.HUBSPOT_PORTAL_ID;
    const form = process.env.NEXT_PUBLIC_HUBSPOT_FORM_ID || process.env.HUBSPOT_FORM_ID;

    if (portal && form) {
      const r = await fetch(`https://api.hsforms.com/submissions/v3/integration/submit/${portal}/${form}` , {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fields: [
            { name: 'email', value: payload.email },
            { name: 'firstname', value: payload.name },
            { name: 'message', value: payload.message }
          ]
        })
      });
      if (r.ok) { setS('ok'); return; }
    }

    // Fallback: serverless email
    const res = await fetch('/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    setS(res.ok ? 'fallback' : 'err');
  };

  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="text-3xl font-bold">Request a demo</h1>
      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        <input name="name" placeholder="Name" className="w-full rounded-xl border p-3" required />
        <input name="email" type="email" placeholder="Work email" className="w-full rounded-xl border p-3" required />
        <textarea name="message" placeholder="What problems are you solving?" className="w-full rounded-xl border p-3" rows={6} />
        <button className="rounded-xl bg-slate-900 px-6 py-3 text-white">Submit</button>
        {s === 'ok' && <p className="text-green-600">Thanks — we'll be in touch (HubSpot).</p>}
        {s === 'fallback' && <p className="text-green-600">Thanks — we've emailed the team.</p>}
        {s === 'err' && <p className="text-red-600">Something went wrong.</p>}
      </form>
    </main>
  );
}