import { readdir } from 'node:fs/promises';
import { resolve } from 'node:path';

const LEGACY_POSTS = resolve('legacy/_posts');

async function main() {
  const entries = await readdir(LEGACY_POSTS);
  const urls: string[] = [];
  for (const e of entries) {
    if (!e.endsWith('.md')) continue;
    const m = e.match(/^(\d{4})-(\d{2})-\d{2}-(.+)\.md$/);
    if (!m) continue;
    const [, y, mo, slug] = m;
    urls.push(`/${y}/${mo}/${slug}/`);
  }
  for (const u of urls.sort()) console.log(u);
}

main().catch((err) => { console.error(err); process.exit(1); });
