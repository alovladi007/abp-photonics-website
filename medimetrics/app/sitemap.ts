import type { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.BASE_URL ?? 'http://localhost:3000';
  const now = new Date();
  return [
    '/', '/solutions', '/security', '/pricing', '/contact', '/blog'
  ].map(p => ({ url: `${base}${p}`, lastModified: now, changeFrequency: 'weekly', priority: 0.7 }));
}