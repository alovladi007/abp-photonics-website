import './globals.css';
import { Metadata } from 'next';
import Script from 'next/script';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { AnalyticsProvider } from '@/components/AnalyticsProvider';
import { CookieConsent } from '@/components/CookieConsent';

export const metadata: Metadata = {
  title: 'MediMetrics — Medical Imaging AI',
  description: 'Explainable AI for medical imaging with HIPAA-aligned controls.',
  openGraph: {
    title: 'MediMetrics — Medical Imaging AI',
    description: 'Explainable AI for medical imaging with HIPAA-aligned controls.',
    url: process.env.BASE_URL ?? 'http://localhost:3000',
    siteName: 'MediMetrics'
  },
  metadataBase: new URL(process.env.BASE_URL ?? 'http://localhost:3000')
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const gaId = process.env.GA4_MEASUREMENT_ID;
  return (
    <html lang="en">
      <body className="min-h-screen bg-white text-slate-900 antialiased">
        {/* GA4 loader (fires but respects Consent Mode updates in AnalyticsProvider) */}
        {gaId && (
          <>
            <Script src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`} strategy="afterInteractive" />
            <Script id="ga4-init" strategy="afterInteractive">{`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);} 
              gtag('js', new Date());
              gtag('config', '${gaId}', { anonymize_ip: true });
            `}</Script>
          </>
        )}
        <AnalyticsProvider />
        <CookieConsent />
        <Navbar />
        <div className="min-h-[calc(100vh-200px)]">{children}</div>
        <Footer />
        {/* JSON-LD */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'SoftwareApplication',
              name: 'MediMetrics',
              applicationCategory: 'Medical',
              operatingSystem: 'Web',
              offers: { '@type': 'Offer', price: '99', priceCurrency: 'USD' }
            })
          }}
        />
      </body>
    </html>
  );
}