import fs from 'node:fs';
import path from 'node:path';
import { notFound } from 'next/navigation';
import dynamic from 'next/dynamic';

export default function Post({ params }: { params: { slug: string } }) {
  const file = path.join(process.cwd(), 'content', 'blog', `${params.slug}.mdx`);
  
  if (!fs.existsSync(file)) return notFound();
  
  // For now, just show a placeholder
  // In production, you'd use MDX loader here
  return (
    <main className="prose mx-auto max-w-3xl px-6 py-16">
      <h1>{params.slug}</h1>
      <p>Blog post content would be loaded here from MDX files.</p>
    </main>
  );
}