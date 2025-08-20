'use client';
import { useEffect, useState } from 'react';
import posthog from 'posthog-js';
import { getConsent } from '@/lib/consent';

/**
 * Initializes analytics AFTER user consent.
 * - PostHog feature flags enabled for A/B tests
 * - GA4 Consent Mode updated according to preferences
 */
export function AnalyticsProvider() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const consent = getConsent();

    // Google Consent Mode
    if (typeof window !== 'undefined') {
      // @ts-ignore
      window.dataLayer = window.dataLayer || [];
      function gtag(){
        // @ts-ignore
        window.dataLayer.push(arguments);
      }
      // Default denied; update per consent
      // @ts-ignore
      gtag('consent', 'update', {
        ad_user_data: 'denied',
        ad_personalization: 'denied',
        analytics_storage: consent.analytics ? 'granted' : 'denied',
        ad_storage: consent.marketing ? 'granted' : 'denied'
      });
    }

    // PostHog
    if (consent.analytics && process.env.NEXT_PUBLIC_POSTHOG_KEY) {
      posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
        api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://app.posthog.com',
        capture_pageview: true,
        persistence: 'cookie'
      });
    } else if (typeof posthog !== 'undefined' && posthog.opt_out_capturing) {
      posthog.opt_out_capturing();
    }

    setReady(true);
  }, []);

  return null;
}