import { readdir, readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import matter from 'gray-matter';

const POSTS_DIR = resolve('src/content/posts');
const PUBLIC_DIR = resolve('public');

type PostRef = { file: string; date: Date; slug: string; body: string };

function deriveSlug(filename: string, frontmatterSlug?: string): string {
  return frontmatterSlug ?? filename.replace(/\.mdx?$/, '').replace(/^\d{4}-\d{2}-\d{2}-/, '');
}

function derivePath(date: Date, slug: string): string {
  const y = date.getUTCFullYear().toString();
  const m = String(date.getUTCMonth() + 1).padStart(2, '0');
  return `/${y}/${m}/${slug}/`;
}

async function readPosts(): Promise<PostRef[]> {
  const entries = await readdir(POSTS_DIR);
  const posts: PostRef[] = [];
  for (const entry of entries) {
    if (!entry.endsWith('.md') && !entry.endsWith('.mdx')) continue;
    const full = join(POSTS_DIR, entry);
    const raw = await readFile(full, 'utf8');
    const { data, content } = matter(raw);
    if (!(data.date instanceof Date)) {
      throw new Error(`[validate-posts] ${entry}: 'date' must parse to a Date.`);
    }
    const slug = deriveSlug(entry, data.slug as string | undefined);
    posts.push({ file: entry, date: data.date, slug, body: content });
  }
  return posts;
}

function checkSlugUniqueness(posts: PostRef[]): string[] {
  const paths = new Map<string, string[]>();
  for (const p of posts) {
    const key = derivePath(p.date, p.slug);
    if (!paths.has(key)) paths.set(key, []);
    paths.get(key)!.push(p.file);
  }
  const dups: string[] = [];
  for (const [key, files] of paths) {
    if (files.length > 1) {
      dups.push(`Duplicate route ${key} produced by: ${files.join(', ')}`);
    }
  }
  return dups;
}

function checkImageReferences(posts: PostRef[]): string[] {
  const missing: string[] = [];
  const imgRe = /!\[[^\]]*\]\((\/images\/[^)]+)\)/g;
  for (const p of posts) {
    let match: RegExpExecArray | null;
    while ((match = imgRe.exec(p.body)) !== null) {
      const ref = match[1];
      const diskPath = join(PUBLIC_DIR, ref);
      if (!existsSync(diskPath)) {
        missing.push(`${p.file} references missing image: ${ref}`);
      }
    }
  }
  return missing;
}

async function main() {
  const posts = await readPosts();
  const problems = [...checkSlugUniqueness(posts), ...checkImageReferences(posts)];
  if (problems.length) {
    console.error('[validate-posts] failures:');
    for (const line of problems) console.error('  - ' + line);
    process.exit(1);
  }
  console.log(`[validate-posts] ok (${posts.length} posts checked)`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
