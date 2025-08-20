import fs from 'node:fs';
import path from 'node:path';
import { notFound } from 'next/navigation';
import dynamic from 'next/dynamic';

export default function Post({ params }: { params: { slug: string } }) {
  const file = path.join(process.cwd(), 'content', 'blog', `${params.slug}.mdx`);
  
  if (!fs.existsSync(file)) return notFound();
  
  // Dynamic import for MDX content
  const Mdx = dynamic(() => import(`@/content/blog/${params.slug}.mdx`).catch(() => {
    return () => <div>Error loading content</div>;
  }));
  
  return (
    <main className="prose mx-auto max-w-3xl px-6 py-16">
      <Mdx />
    </main>
  );
}