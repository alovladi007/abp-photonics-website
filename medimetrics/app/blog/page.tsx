import Link from 'next/link';
import fs from 'node:fs';
import path from 'node:path';

export default function BlogIndex() {
  const dir = path.join(process.cwd(), 'content', 'blog');
  let posts: string[] = [];
  
  try {
    if (fs.existsSync(dir)) {
      posts = fs.readdirSync(dir).filter(f => f.endsWith('.mdx'));
    }
  } catch (error) {
    console.error('Error reading blog directory:', error);
  }
  
  return (
    <main className="mx-auto max-w-6xl px-6 py-16">
      <h1 className="text-4xl font-bold">Blog</h1>
      {posts.length > 0 ? (
        <ul className="mt-6 space-y-3">
          {posts.map((f) => {
            const slug = f.replace(/\.mdx$/, '');
            return (
              <li key={slug}>
                <Link href={`/blog/${slug}`} className="text-brand-600 underline">{slug}</Link>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="mt-6 text-slate-600">No blog posts available yet.</p>
      )}
    </main>
  );
}