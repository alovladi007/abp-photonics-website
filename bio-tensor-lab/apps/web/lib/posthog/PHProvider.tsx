"use client";
import posthog from "posthog-js";
import { useEffect, useState } from "react";

export function PHProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
    if (!key) return;
    posthog.init(key, { api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || "/ingest", capture_pageview: true });
    // simple region-aware consent mock (extend with GeoIP in real env)
    const inGDPR = false;
    posthog.set_consent({ analytics: !inGDPR, advertising: false });
    setReady(true);
    return () => { posthog?.reset(); };
  }, []);
  return <>{children}</>;
}