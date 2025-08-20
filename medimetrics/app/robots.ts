import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const base = process.env.BASE_URL ?? 'http://localhost:3000';
  return {
    rules: {
      userAgent: '*',
      allow: '/'
    },
    sitemap: `${base}/sitemap.xml`
  };
}