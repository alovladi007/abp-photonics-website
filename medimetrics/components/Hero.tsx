'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import posthog from 'posthog-js';

/**
 * Uses PostHog feature flag `hero_variant` with values 'A' | 'B'.
 * Captures exposure + CTA clicks for stat-sig experiment analysis in PostHog.
 */
export function Hero() {
  const [variant, setVariant] = useState<'A' | 'B'>('A');

  useEffect(() => {
    if (typeof window !== 'undefined' && posthog && (posthog as any).onFeatureFlags) {
      posthog.onFeatureFlags(() => {
        const v = posthog.getFeatureFlag('hero_variant');
        const vv = v === 'B' ? 'B' : 'A';
        setVariant(vv);
        // Capture exposure with variant
        posthog.capture('hero_exposure', { variant: vv });
      });
    }
  }, []);

  const onDemoClick = () => {
    if (typeof window !== 'undefined' && posthog) {
      posthog.capture('cta_click', { variant, cta: 'demo' });
    }
  };
  
  const onTrialClick = () => {
    if (typeof window !== 'undefined' && posthog) {
      posthog.capture('cta_click', { variant, cta: 'trial' });
    }
  };

  if (variant === 'B') {
    return (
      <section className="text-center">
        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight">Accelerate Radiology Workflows with Explainable AI</h1>
        <p className="mt-4 text-lg text-slate-600">Reduce turnaround times with prioritized queues, Grad‑CAM overlays, and one‑click PDF reporting.</p>
        <div className="mt-8 flex justify-center gap-4">
          <Link href="/contact" onClick={onDemoClick} className="rounded-xl bg-slate-900 px-6 py-3 text-white">Request a demo</Link>
          <Link href="/pricing" onClick={onTrialClick} className="rounded-xl border px-6 py-3">Start free trial</Link>
        </div>
      </section>
    );
  }

  return (
    <section className="text-center">
      <h1 className="text-4xl md:text-6xl font-bold tracking-tight">MediMetrics™ — Medical Imaging AI you can trust.</h1>
      <p className="mt-4 text-lg text-slate-600">Detect findings, accelerate reads, and standardize reporting with Grad‑CAM explainability, audit logs, and HIPAA‑aligned controls.</p>
      <div className="mt-8 flex justify-center gap-4">
        <Link href="/contact" onClick={onDemoClick} className="rounded-xl bg-slate-900 px-6 py-3 text-white">Request a demo</Link>
        <Link href="/pricing" onClick={onTrialClick} className="rounded-xl border px-6 py-3">Start free trial</Link>
      </div>
    </section>
  );
}