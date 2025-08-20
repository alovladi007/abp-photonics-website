import { TrustBar } from '@/components/TrustBar';
import { FeatureCards } from '@/components/FeatureCards';
import { CTA } from '@/components/CTA';
import { Hero } from '@/components/Hero';

export default function Home() {
  return (
    <main className="mx-auto max-w-6xl px-6 py-16">
      <Hero />
      <TrustBar />
      <FeatureCards />
      <CTA />
    </main>
  );
}