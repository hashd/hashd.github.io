# Blog Revamp Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the Jekyll blog at `kiran.danduprolu.com` as an Astro static site on a side branch (`astro-rebuild`) and cut over to `master`, preserving all existing post URLs.

**Architecture:** Astro 4.x static-only site. Markdown/MDX content collections with strict zod schemas. System-font typography, vanilla CSS + CSS variables, GitHub-light syntax highlighting via Shiki in CSS-variables mode. Motion via Web Animations API + Astro View Transitions. GitHub Pages deployment via `actions/deploy-pages@v4`. Pages source flips from `gh-pages` branch to GitHub Actions during cutover.

**Tech Stack:** Astro 4.x · MDX · TypeScript (strict) · Shiki · rehype-mermaid · satori (OG images) · Giscus · Buttondown · GA4 · pnpm · Prettier · ESLint · linkinator · GitHub Actions Pages deploy

**Spec:** `docs/superpowers/specs/2026-04-18-blog-revamp-design.md`

---

## Conventions for This Plan

- **Working tree:** all tasks run on the `astro-rebuild` branch unless a step says otherwise.
- **Package manager:** `pnpm`. `corepack enable` is run once in Task 3; every later command uses `pnpm`.
- **Commits:** commit message style matches existing repo history — imperative mood, short summary line, optional body. Commits are **unsigned** (`--no-gpg-sign`) due to existing authorization for this repo.
- **Test surface:** there are no unit tests. Each task's "test" is one or more of: `pnpm astro check`, `pnpm astro build`, `pnpm validate:posts`, `pnpm dev` + visual smoke check, `pnpm linkcheck`. Treat a failing build as a red test.
- **Every step is a single action.** A "step" is 2-5 minutes of work.

---

## File Structure (target on `astro-rebuild`)

```
.github/workflows/deploy.yml            # Pages Actions deployment
astro.config.mjs                        # trailingSlash: always; build.format: directory
package.json                            # pnpm + astro + deps
tsconfig.json                           # strict TS, astro paths
.prettierrc.json, .prettierignore
.eslintrc.json, .eslintignore
.lintstagedrc.json
FUTURE_VISION.md                        # deferred ideas
scripts/
  validate-posts.ts                     # slug-uniqueness + image-ref checks
  extract-archived-urls.ts              # reads legacy/_posts, emits URL list for linkinator
  preview.md                            # visual smoke checklist
src/
  content/
    config.ts                           # zod collection schema
    posts/                              # 6 migrated .md posts
    pages/
      projects.md                       # migrated from legacy/projects.md
  lib/
    posts.ts                            # getLivePosts / getArchivedPosts / getAllPublishedPosts / slug helpers
    readTime.ts                         # words / 250 wpm
  layouts/
    BaseLayout.astro                    # <html>, <head>, header, footer, ClientRouter
    PostLayout.astro                    # post chrome (title, byline, back-link, next/prev, Giscus)
    PageLayout.astro                    # static MDX pages
  components/
    SiteHeader.astro
    SiteFooter.astro
    PostCard.astro
    ArchivedRibbon.astro
    TagPill.astro
    Prose.astro                         # <article> wrapper + typography
    CopyCodeButton.astro
    Giscus.astro
    NewsletterBlock.astro
    MermaidBlock.astro                  # thin wrapper for rehype-mermaid output
    GA4.astro                           # gtag snippet, env-gated
    OgImage.tsx                         # satori template for per-post OG (server-only)
  pages/
    index.astro
    writing/index.astro
    [...slug].astro                     # /YYYY/MM/slug/ routes
    tags/index.astro
    tags/[tag].astro
    projects.astro
    newsletter.astro
    404.astro
    og/[...slug].png.ts                 # OG image endpoint
  styles/
    tokens.css                          # colors, spacing, type scale, motion tokens
    global.css                          # reset + element defaults + layout shells
    prose.css                           # article body typography
    shiki.css                           # CSS-variables theme for github-light
    motion.css                          # keyframes, prefers-reduced-motion guard
public/
  CNAME                                 # copy of repo CNAME
  favicon.ico
  logo.png
  images/                               # migrated image assets
  resume/                               # pre-built resume SPA kept intact
  about/                                # pre-built about SPA kept intact (content re-authoring deferred)
legacy/                                 # full pre-rebuild Jekyll tree
```

---

## PHASE 1 — Bootstrap the branch

### Task 1: Create the `astro-rebuild` branch

**Files:**
- No file changes yet.

- [ ] **Step 1: Confirm current branch is `master` and tree is clean**

Run: `git status && git rev-parse --abbrev-ref HEAD`
Expected: `nothing to commit, working tree clean` and `master`.

- [ ] **Step 2: Create and switch to the `astro-rebuild` branch**

Run: `git checkout -b astro-rebuild`
Expected: `Switched to a new branch 'astro-rebuild'`.

- [ ] **Step 3: Push the branch to origin**

Run: `git push -u origin astro-rebuild`
Expected: remote branch created, tracking set.

### Task 2: Move the Jekyll tree into `legacy/`

**Files:**
- Move everything except `.git`, `.gitignore`, `docs/`, `CNAME`, `.editorconfig` into `legacy/`.

- [ ] **Step 1: Create the `legacy/` directory**

Run: `mkdir legacy`

- [ ] **Step 2: Move Jekyll sources into `legacy/`**

Run:
```bash
git mv _config.yml _includes _layouts _posts _sass about assets feed.xml images index.html projects.md resume style.scss 404.md LICENSE.txt README.md legacy/
```
Expected: no errors. `git status` shows many renames.

- [ ] **Step 3: Verify structure**

Run: `ls -1`
Expected: `CNAME  docs  legacy` (plus `.editorconfig`, `.gitignore`).

- [ ] **Step 4: Commit**

```bash
git add -A
git commit --no-gpg-sign -m "Move Jekyll tree into legacy/ for Astro rebuild"
```

### Task 3: Set up pnpm + scaffold Astro at repo root

**Files:**
- Create: `package.json`, `astro.config.mjs`, `tsconfig.json`
- Modify: `.gitignore`

- [ ] **Step 1: Enable corepack and pin pnpm**

Run: `corepack enable && corepack prepare pnpm@9.12.3 --activate`
Expected: `pnpm@9.12.3 activated`.

- [ ] **Step 2: Create an initial `package.json`**

Write `package.json`:
```json
{
  "name": "kiran-blog",
  "type": "module",
  "private": true,
  "packageManager": "pnpm@9.12.3",
  "scripts": {
    "dev": "astro dev",
    "start": "astro dev",
    "build": "pnpm validate:posts && astro build",
    "preview": "astro preview",
    "astro": "astro",
    "check": "astro check",
    "validate:posts": "tsx scripts/validate-posts.ts",
    "linkcheck": "linkinator ./dist --silent --recurse --skip 'https?://(?!kiran\\.danduprolu\\.com).*'",
    "format": "prettier --write .",
    "lint": "eslint . --ext .ts,.astro,.tsx,.jsx,.mjs"
  }
}
```

- [ ] **Step 3: Install Astro core + required integrations**

Run:
```bash
pnpm add -D astro@^4.16.0 @astrojs/mdx@^3.1.9 @astrojs/sitemap@^3.2.1 @astrojs/check@^0.9.4 typescript@^5.6.3 tsx@^4.19.2
pnpm add -D shiki@^1.22.2 rehype-mermaid@^2.1.0 @resvg/resvg-js@^2.6.2 satori@^0.11.3 satori-html@^0.3.2
pnpm add -D prettier@^3.3.3 prettier-plugin-astro@^0.14.1 eslint@^9.14.0 eslint-plugin-astro@^1.3.1 lint-staged@^15.2.10 simple-git-hooks@^2.11.1 linkinator@^6.1.2
```
Expected: all install cleanly, `pnpm-lock.yaml` produced.

- [ ] **Step 4: Update `.gitignore` for Astro**

Append to `.gitignore`:
```
# Astro
dist/
.astro/
node_modules/
.env
.env.local
.env.*.local
```

- [ ] **Step 5: Create the Astro config**

Write `astro.config.mjs`:
```js
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import rehypeMermaid from 'rehype-mermaid';

export default defineConfig({
  site: 'https://kiran.danduprolu.com',
  trailingSlash: 'always',
  build: { format: 'directory' },
  output: 'static',
  integrations: [
    mdx(),
    sitemap({ filter: (page) => !page.includes('/og/') }),
  ],
  markdown: {
    shikiConfig: {
      theme: 'github-light',
      defaultColor: false,
      wrap: true,
    },
    rehypePlugins: [[rehypeMermaid, { strategy: 'inline-svg' }]],
  },
  vite: {
    server: { watch: { ignored: ['**/legacy/**'] } },
  },
});
```

- [ ] **Step 6: Create `tsconfig.json`**

Write `tsconfig.json`:
```json
{
  "extends": "astro/tsconfigs/strict",
  "include": [".astro/types.d.ts", "**/*"],
  "exclude": ["dist", "legacy", "node_modules"]
}
```

- [ ] **Step 7: Scaffold minimum source tree**

Run:
```bash
mkdir -p src/pages src/content/posts src/content/pages src/layouts src/components src/lib src/styles scripts public
```

- [ ] **Step 8: Add a placeholder homepage so `astro build` succeeds**

Write `src/pages/index.astro`:
```astro
---
---
<html lang="en">
  <head><meta charset="utf-8" /><title>kiran.danduprolu.com</title></head>
  <body><p>scaffolded</p></body>
</html>
```

- [ ] **Step 9: Build to verify Astro boots**

Run: `pnpm astro build`
Expected: builds cleanly into `./dist/`, no errors.

- [ ] **Step 10: Commit**

```bash
git add -A
git commit --no-gpg-sign -m "Scaffold Astro 4.x with pnpm, MDX, sitemap, Shiki config"
```

---

## PHASE 2 — Content model, filter helpers, validator

### Task 4: Content collection schema

**Files:**
- Create: `src/content/config.ts`

- [ ] **Step 1: Write the content collection schema**

Write `src/content/config.ts`:
```ts
import { defineCollection, z } from 'astro:content';

const posts = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    description: z.string().min(1, 'description is required for OG + meta'),
    date: z.date(),
    updated: z.date().optional(),
    tags: z.array(z.string()).default([]),
    draft: z.boolean().default(false),
    featured: z.boolean().default(false),
    archived: z.boolean().default(false),
    ogImage: z.string().optional(),
    slug: z.string().optional(),
  }),
});

const pages = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    description: z.string().min(1),
  }),
});

export const collections = { posts, pages };
```

- [ ] **Step 2: Verify `astro check` accepts the config**

Run: `pnpm astro check`
Expected: no type errors.

- [ ] **Step 3: Commit**

```bash
git add src/content/config.ts
git commit --no-gpg-sign -m "Add content collection schema with zod validation"
```

### Task 5: Read-time helper

**Files:**
- Create: `src/lib/readTime.ts`

- [ ] **Step 1: Write the read-time helper**

Write `src/lib/readTime.ts`:
```ts
const WORDS_PER_MINUTE = 250;

export function readTimeMinutes(markdownBody: string): number {
  const words = markdownBody
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(Boolean).length;
  return Math.max(1, Math.round(words / WORDS_PER_MINUTE));
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/readTime.ts
git commit --no-gpg-sign -m "Add read-time helper (250 wpm, strips code blocks)"
```

### Task 6: Centralized post-filter helpers

**Files:**
- Create: `src/lib/posts.ts`

- [ ] **Step 1: Write the filter helpers**

Write `src/lib/posts.ts`:
```ts
import { getCollection, type CollectionEntry } from 'astro:content';

export type Post = CollectionEntry<'posts'>;

export function postHref(post: Post): string {
  const date = post.data.date;
  const year = date.getUTCFullYear().toString();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const slug = post.data.slug ?? post.slug.replace(/^\d{4}-\d{2}-\d{2}-/, '');
  return `/${year}/${month}/${slug}/`;
}

function sortByDateDesc(a: Post, b: Post) {
  return b.data.date.getTime() - a.data.date.getTime();
}

export async function getAllPublishedPosts(): Promise<Post[]> {
  const all = await getCollection('posts', ({ data }) => data.draft !== true);
  return all.sort(sortByDateDesc);
}

export async function getLivePosts(): Promise<Post[]> {
  const all = await getAllPublishedPosts();
  return all.filter((p) => !p.data.archived);
}

export async function getArchivedPosts(): Promise<Post[]> {
  const all = await getAllPublishedPosts();
  return all.filter((p) => p.data.archived);
}

export async function getFeaturedLivePosts(): Promise<Post[]> {
  return (await getLivePosts()).filter((p) => p.data.featured);
}

export async function getAdjacentLivePosts(current: Post): Promise<{
  prev: Post | null;
  next: Post | null;
}> {
  if (current.data.archived) return { prev: null, next: null };
  const live = await getLivePosts();
  const idx = live.findIndex((p) => p.id === current.id);
  if (idx === -1) return { prev: null, next: null };
  return {
    prev: idx < live.length - 1 ? live[idx + 1] : null,
    next: idx > 0 ? live[idx - 1] : null,
  };
}

export async function getAllTagsWithCounts(): Promise<
  Array<{ tag: string; count: number }>
> {
  const all = await getAllPublishedPosts();
  const counts = new Map<string, number>();
  for (const p of all) {
    for (const t of p.data.tags) counts.set(t, (counts.get(t) ?? 0) + 1);
  }
  return Array.from(counts.entries())
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag));
}
```

- [ ] **Step 2: Verify with `astro check`**

Run: `pnpm astro check`
Expected: no type errors.

- [ ] **Step 3: Commit**

```bash
git add src/lib/posts.ts
git commit --no-gpg-sign -m "Centralize post filtering and URL derivation in src/lib/posts.ts"
```

### Task 7: `validate-posts.ts` (slug uniqueness + image integrity)

**Files:**
- Create: `scripts/validate-posts.ts`

- [ ] **Step 1: Write the validator**

Write `scripts/validate-posts.ts`:
```ts
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
```

- [ ] **Step 2: Install `gray-matter`**

Run: `pnpm add -D gray-matter@^4.0.3`

- [ ] **Step 3: Run it against the empty posts dir to confirm it passes**

Run: `pnpm validate:posts`
Expected: `[validate-posts] ok (0 posts checked)`.

- [ ] **Step 4: Commit**

```bash
git add scripts/validate-posts.ts package.json pnpm-lock.yaml
git commit --no-gpg-sign -m "Add validate-posts script (slug uniqueness, image integrity)"
```

### Task 8: `extract-archived-urls.ts` for linkinator parity check

**Files:**
- Create: `scripts/extract-archived-urls.ts`

- [ ] **Step 1: Write the extractor**

Write `scripts/extract-archived-urls.ts`:
```ts
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
```

- [ ] **Step 2: Verify it prints 6 URLs**

Run: `pnpm tsx scripts/extract-archived-urls.ts`
Expected: 6 lines, one per archived post, e.g. `/2015/09/why-elixir/`.

- [ ] **Step 3: Commit**

```bash
git add scripts/extract-archived-urls.ts
git commit --no-gpg-sign -m "Add extract-archived-urls script for linkinator parity pass"
```

---

## PHASE 3 — Migrate content

### Task 9: Migrate posts from `legacy/_posts/` into `src/content/posts/`

**Files:**
- Create: `src/content/posts/2015-07-12-keep-them-consistent.md`
- Create: `src/content/posts/2015-07-26-tco.md`
- Create: `src/content/posts/2015-08-04-understanding-elixir-types.md`
- Create: `src/content/posts/2015-08-30-experience-with-elixir.md`
- Create: `src/content/posts/2015-09-04-why-elixir.md`
- Create: `src/content/posts/2016-06-23-fun-with-classes-in-ES6.md`

- [ ] **Step 1: Copy each post, preserving the filename**

Run:
```bash
cp legacy/_posts/2015-07-12-keep-them-consistent.md src/content/posts/
cp legacy/_posts/2015-07-26-tco.md src/content/posts/
cp legacy/_posts/2015-08-04-understanding-elixir-types.md src/content/posts/
cp legacy/_posts/2015-08-30-experience-with-elixir.md src/content/posts/
cp legacy/_posts/2015-09-04-why-elixir.md src/content/posts/
cp legacy/_posts/2016-06-23-fun-with-classes-in-ES6.md src/content/posts/
```

- [ ] **Step 2: Rewrite frontmatter for each post**

For every file in `src/content/posts/`, replace its frontmatter with the new schema. Derive `date` from the filename, keep the `title` text as-is, remove `layout: post` and `author: Kiran`, add `description`, `tags`, `archived: true`. Example for `2015-09-04-why-elixir.md`:

```yaml
---
title: "Why Elixir?"
description: "A note on why a Rails developer became curious about Elixir, and what it took to stay."
date: 2015-09-04
tags: [elixir, functional]
archived: true
---
```

Apply the same structure to all six. Descriptions and tags per post:

| File                                          | tags                    | description                                                                                 |
| --------------------------------------------- | ----------------------- | ------------------------------------------------------------------------------------------- |
| `2015-07-12-keep-them-consistent.md`          | `[javascript, api]`     | "Notes on keeping API surfaces consistent when an interface keeps growing."                 |
| `2015-07-26-tco.md`                           | `[compilers, elixir]`   | "Why some recursion is cheap and some isn't — with a detour through the BEAM."              |
| `2015-08-04-understanding-elixir-types.md`    | `[elixir, types]`       | "The type system in Elixir is quiet, but careful. Here is how I learned to read it."        |
| `2015-08-30-experience-with-elixir.md`        | `[elixir, functional]`  | "Field notes on building with Elixir after the Programming Elixir book."                    |
| `2015-09-04-why-elixir.md`                    | `[elixir, functional]`  | "A note on why a Rails developer became curious about Elixir, and what it took to stay."    |
| `2016-06-23-fun-with-classes-in-ES6.md`       | `[javascript]`          | "JavaScript classes are syntactic sugar — but some of the flavor is surprising."            |

- [ ] **Step 3: Rewrite any `/assets/...` or `{{ site.url }}` references in post bodies**

Run: `grep -rn "{{ site.url }}\|/assets/" src/content/posts/ || echo "(none)"`
For each hit, replace `{{ site.url }}...` with the absolute site-relative path and `/assets/images/...` with `/images/...`. If no hits, proceed.

- [ ] **Step 4: Run the validator**

Run: `pnpm validate:posts`
Expected: `[validate-posts] ok (6 posts checked)`.

- [ ] **Step 5: Run astro check to confirm schema passes**

Run: `pnpm astro check`
Expected: no content errors.

- [ ] **Step 6: Commit**

```bash
git add src/content/posts
git commit --no-gpg-sign -m "Migrate 6 legacy posts into Astro content collection (archived: true)"
```

### Task 10: Migrate images into `public/images/`

**Files:**
- Create: `public/images/` (populated)
- Create: `public/logo.png`, `public/favicon.ico`

- [ ] **Step 1: Move image directories**

Run:
```bash
mkdir -p public/images
cp -R legacy/images/. public/images/ 2>/dev/null || true
cp -R legacy/assets/images/. public/images/ 2>/dev/null || true
cp legacy/assets/images/favicon.ico public/favicon.ico 2>/dev/null || true
cp legacy/assets/images/logo.png public/logo.png 2>/dev/null || true
```

- [ ] **Step 2: Verify `validate-posts` still passes (catches any missing image refs)**

Run: `pnpm validate:posts`
Expected: `[validate-posts] ok (6 posts checked)`.

- [ ] **Step 3: Commit**

```bash
git add public/
git commit --no-gpg-sign -m "Migrate image assets into public/"
```

### Task 11: Migrate projects page

**Files:**
- Create: `src/content/pages/projects.md`

- [ ] **Step 1: Copy `legacy/projects.md` body**

Run:
```bash
cp legacy/projects.md src/content/pages/projects.md
```

- [ ] **Step 2: Rewrite frontmatter**

Replace the frontmatter block at the top of `src/content/pages/projects.md` with:
```yaml
---
title: "Projects"
description: "Things I've built or am building."
---
```
Remove any Jekyll-specific keys (`layout`, `permalink`, etc.). Leave the body intact.

- [ ] **Step 3: Commit**

```bash
git add src/content/pages/projects.md
git commit --no-gpg-sign -m "Migrate projects page into content collection"
```

### Task 12: Keep existing about / resume SPAs under `public/`

**Note to implementer:** the current `/about/` and `/resume/` are pre-built React SPAs (no source in-tree). Rather than re-author content blind, ship the existing bundles under `public/about/` and `public/resume/`. Content re-authoring into MDX is deferred to `FUTURE_VISION.md`.

**Files:**
- Create: `public/about/` (copy of legacy about SPA)
- Create: `public/resume/` (copy of legacy resume SPA)

- [ ] **Step 1: Copy the pre-built about/resume SPAs**

Run:
```bash
mkdir -p public/about public/resume
cp -R legacy/about/. public/about/
cp -R legacy/resume/. public/resume/
```

- [ ] **Step 2: Verify `dist` build still succeeds**

Run: `pnpm astro build`
Expected: builds; `dist/about/index.html` and `dist/resume/index.html` exist (copied from `public/`).

- [ ] **Step 3: Commit**

```bash
git add public/about public/resume
git commit --no-gpg-sign -m "Preserve pre-built about and resume SPAs under public/"
```

### Task 13: Copy CNAME into `public/`

**Files:**
- Create: `public/CNAME`

- [ ] **Step 1: Copy CNAME**

Run: `cp CNAME public/CNAME`

- [ ] **Step 2: Verify it survives the build**

Run: `pnpm astro build && cat dist/CNAME`
Expected: `kiran.danduprolu.com`.

- [ ] **Step 3: Commit**

```bash
git add public/CNAME
git commit --no-gpg-sign -m "Copy CNAME into public/ so Actions deploy preserves custom domain"
```

### Task 14: Add `FUTURE_VISION.md`

**Files:**
- Create: `FUTURE_VISION.md`

- [ ] **Step 1: Write the deferred-ideas log**

Write `FUTURE_VISION.md`:
```markdown
# Future Vision

Running log of ideas deferred from the 2026 blog revamp.

## Shipped-later candidates

- **Client-side search** via Pagefind. Defer until post count makes scanning /writing/ painful (~15+ posts).
- **RSS feed** (`/feed.xml`). Defer until someone asks or until the first newsletter issue reuses the RSS as source.
- **Dark mode**. Intentionally not shipped in the v2 revamp. Revisit once the identity is settled.
- **About / Resume re-authored into MDX**. Current v2 preserves the pre-built React SPAs under `public/about/` and `public/resume/`. Rewrite to MDX when touching those pages next.
- **Interactive experiments / demos** — MDX-embedded React islands for post-level interactivity (e.g., algorithm visualizers, code sandboxes).
```

- [ ] **Step 2: Commit**

```bash
git add FUTURE_VISION.md
git commit --no-gpg-sign -m "Add FUTURE_VISION.md to track deferred ideas"
```

---

## PHASE 4 — Design tokens & base styles

### Task 15: Design tokens

**Files:**
- Create: `src/styles/tokens.css`

- [ ] **Step 1: Write tokens**

Write `src/styles/tokens.css`:
```css
:root {
  /* Colors (GitHub light) */
  --bg:           #ffffff;
  --bg-subtle:    #f6f8fa;
  --surface:      #ffffff;
  --border:       #d0d7de;
  --border-muted: #d8dee4;
  --text:         #1f2328;
  --text-muted:   #656d76;
  --text-faint:   #8c959f;
  --accent:       #0969da;
  --accent-warm:  #bc4c00;
  --shadow-sm: 0 1px 2px rgba(31,35,40,0.04), 0 0 0 1px rgba(31,35,40,0.04);
  --shadow-md: 0 8px 24px rgba(31,35,40,0.08);

  /* Tag palette */
  --tag-blue-bg:     #ddf4ff;  --tag-blue-fg:     #0969da;
  --tag-green-bg:    #dafbe1;  --tag-green-fg:    #1a7f37;
  --tag-yellow-bg:   #fff8c5;  --tag-yellow-fg:   #9a6700;
  --tag-orange-bg:   #fff1e5;  --tag-orange-fg:   #bc4c00;
  --tag-purple-bg:   #fbefff;  --tag-purple-fg:   #8250df;

  /* Typography */
  --font-sans: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif;
  --font-mono: ui-monospace, "SF Mono", Menlo, Consolas, monospace;

  /* Spacing scale */
  --sp-1:  4px;  --sp-2:  8px;  --sp-3: 12px;  --sp-4: 16px;
  --sp-5: 24px;  --sp-6: 32px;  --sp-7: 48px;  --sp-8: 72px;  --sp-9: 112px;

  /* Type scale */
  --fs-xs: 13px; --fs-sm: 15px; --fs-md: 17px; --fs-lg: 20px;
  --fs-xl: 24px; --fs-2xl: 32px; --fs-3xl: 48px;

  /* Layout */
  --content-max: 760px;
  --chrome-max:  960px;

  /* Motion */
  --ease-out:    cubic-bezier(0.22, 1, 0.36, 1);
  --ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1);
  --dur-fast: 140ms;
  --dur-mid:  280ms;
  --dur-slow: 520ms;
}
```

- [ ] **Step 2: Commit**

```bash
git add src/styles/tokens.css
git commit --no-gpg-sign -m "Add design tokens (GitHub-light palette, type scale, motion)"
```

### Task 16: Global styles + reset + layout shells

**Files:**
- Create: `src/styles/global.css`

- [ ] **Step 1: Write the global stylesheet**

Write `src/styles/global.css`:
```css
@import "./tokens.css";

*, *::before, *::after { box-sizing: border-box; }
html, body { margin: 0; padding: 0; }
html { scroll-padding-top: 72px; }
body {
  background: var(--bg);
  color: var(--text);
  font-family: var(--font-sans);
  font-size: var(--fs-md);
  line-height: 1.65;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

a { color: var(--accent); text-decoration: none; }
a:hover { text-decoration: underline; }

img, svg { max-width: 100%; height: auto; }

:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
  border-radius: 4px;
}

.chrome  { max-width: var(--chrome-max);  margin: 0 auto; padding: 0 var(--sp-5); }
.content { max-width: var(--content-max); margin: 0 auto; padding: 0 var(--sp-5); }

.section-title {
  display: flex; align-items: baseline; justify-content: space-between;
  border-bottom: 1px solid var(--border);
  padding-bottom: var(--sp-3);
  margin: var(--sp-8) 0 var(--sp-5);
}
.section-title h2 {
  margin: 0; font-size: var(--fs-sm); font-weight: 600;
  letter-spacing: 0.04em; text-transform: uppercase;
}
.section-title .see-all { font-size: var(--fs-xs); color: var(--text-muted); }
.section-title .see-all:hover { color: var(--accent); }
```

- [ ] **Step 2: Commit**

```bash
git add src/styles/global.css
git commit --no-gpg-sign -m "Add global CSS: reset, body defaults, layout shells"
```

### Task 17: Prose typography

**Files:**
- Create: `src/styles/prose.css`

- [ ] **Step 1: Write prose styles**

Write `src/styles/prose.css`:
```css
.prose {
  max-width: 68ch;
  color: var(--text);
  font-size: var(--fs-md);
  line-height: 1.7;
}
.prose > * + * { margin-top: var(--sp-4); }
.prose h1 { font-size: var(--fs-2xl); font-weight: 700; letter-spacing: -0.02em; margin-top: var(--sp-7); }
.prose h2 { font-size: var(--fs-xl); font-weight: 700; letter-spacing: -0.01em; margin-top: var(--sp-6); }
.prose h3 { font-size: var(--fs-lg); font-weight: 600; margin-top: var(--sp-5); }
.prose p  { margin-top: var(--sp-4); }
.prose a  {
  color: var(--accent);
  background-image: linear-gradient(var(--accent), var(--accent));
  background-position: 0 100%;
  background-repeat: no-repeat;
  background-size: 0% 1px;
  transition: background-size var(--dur-fast) var(--ease-out);
}
.prose a:hover { background-size: 100% 1px; text-decoration: none; }

.prose blockquote {
  border-left: 2px solid var(--border);
  padding-left: var(--sp-4);
  color: var(--text-muted);
  font-style: italic;
}

.prose ul, .prose ol { padding-left: var(--sp-5); }
.prose li + li { margin-top: var(--sp-2); }

.prose code:not(pre code) {
  font-family: var(--font-mono);
  font-size: 0.9em;
  background: var(--bg-subtle);
  padding: 2px 6px;
  border-radius: 4px;
}
.prose pre {
  background: var(--bg-subtle);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: var(--sp-4);
  overflow-x: auto;
  font-family: var(--font-mono);
  font-size: 14px;
  line-height: 1.6;
  position: relative;
}

.prose hr { border: 0; border-top: 1px solid var(--border); margin: var(--sp-6) 0; }

.prose img {
  display: block;
  margin: var(--sp-5) 0;
  border-radius: 8px;
  border: 1px solid var(--border-muted);
}

.prose table {
  width: 100%;
  border-collapse: collapse;
  font-size: var(--fs-sm);
}
.prose th, .prose td {
  border-bottom: 1px solid var(--border-muted);
  padding: var(--sp-2) var(--sp-3);
  text-align: left;
}
.prose th { background: var(--bg-subtle); font-weight: 600; }
```

- [ ] **Step 2: Commit**

```bash
git add src/styles/prose.css
git commit --no-gpg-sign -m "Add prose typography for article body"
```

### Task 18: Shiki CSS-variables theme

**Files:**
- Create: `src/styles/shiki.css`

- [ ] **Step 1: Write the theme stylesheet**

Write `src/styles/shiki.css`:
```css
/* github-light via CSS variables (shiki defaultColor: false) */
.astro-code { background: var(--bg-subtle); color: var(--text); }
.astro-code .token.keyword,
.astro-code .k { color: #cf222e; }
.astro-code .token.function,
.astro-code .fn,
.astro-code .entity.name.function { color: #8250df; }
.astro-code .token.string,
.astro-code .s,
.astro-code .string { color: #0a3069; }
.astro-code .token.comment,
.astro-code .com,
.astro-code .comment { color: #6e7781; font-style: italic; }
.astro-code .token.number,
.astro-code .num,
.astro-code .constant { color: #0550ae; }
.astro-code .variable, .astro-code .v { color: #953800; }
.astro-code .punctuation { color: var(--text-muted); }
```

- [ ] **Step 2: Commit**

```bash
git add src/styles/shiki.css
git commit --no-gpg-sign -m "Add Shiki CSS-variables stylesheet for github-light"
```

### Task 19: Motion keyframes + reduced-motion guard

**Files:**
- Create: `src/styles/motion.css`

- [ ] **Step 1: Write motion stylesheet**

Write `src/styles/motion.css`:
```css
@keyframes rise {
  from { opacity: 0; transform: translateY(6px); }
  to   { opacity: 1; transform: translateY(0); }
}
@keyframes underline-in {
  from { transform: scaleX(0); transform-origin: left; }
  to   { transform: scaleX(1); transform-origin: left; }
}

.reveal-target { opacity: 0; transform: translateY(12px);
  transition: opacity var(--dur-mid) var(--ease-out), transform var(--dur-mid) var(--ease-out); }
.reveal-target.revealed { opacity: 1; transform: translateY(0); }

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.001ms !important;
    animation-delay:    0ms       !important;
    transition-duration: 0.001ms  !important;
  }
  .reveal-target { opacity: 1; transform: none; }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/styles/motion.css
git commit --no-gpg-sign -m "Add motion keyframes and prefers-reduced-motion guard"
```

---

## PHASE 5 — Components

### Task 20: `SiteHeader.astro`, `SiteFooter.astro`, `GA4.astro`, `BaseLayout.astro`

**Files:**
- Create: `src/components/SiteHeader.astro`
- Create: `src/components/SiteFooter.astro`
- Create: `src/components/GA4.astro`
- Create: `src/layouts/BaseLayout.astro`
- Modify: `src/pages/index.astro`

- [ ] **Step 1: Write `SiteHeader.astro`**

Write `src/components/SiteHeader.astro`:
```astro
---
const navItems: Array<{ href: string; label: string }> = [
  { href: '/writing/', label: 'Writing' },
  { href: '/tags/',    label: 'Tags' },
  { href: '/projects/', label: 'Projects' },
  { href: '/resume/',   label: 'Resume' },
  { href: '/about/',    label: 'About' },
];
const { pathname } = Astro.url;
---
<header class="site-header" id="siteHeader">
  <div class="chrome header-inner">
    <a class="brand" href="/">
      <span class="avatar" aria-hidden="true"></span>
      <span class="brand-text">
        <span class="brand-name">Kiran Danduprolu</span>
        <span class="brand-sub">Engineer · backend &amp; systems</span>
      </span>
    </a>
    <nav class="primary" aria-label="Primary">
      {navItems.map((i) => (
        <a href={i.href} class={pathname.startsWith(i.href) ? 'active' : ''}>{i.label}</a>
      ))}
    </nav>
  </div>
</header>

<style>
  .site-header {
    position: sticky; top: 0; z-index: 10;
    background: var(--bg);
    border-bottom: 1px solid transparent;
    transition: box-shadow var(--dur-mid) var(--ease-out), border-color var(--dur-mid) var(--ease-out);
  }
  .site-header.scrolled { box-shadow: var(--shadow-sm); border-bottom-color: var(--border); }
  .header-inner { display: flex; align-items: center; gap: var(--sp-4); padding: var(--sp-4) 0; }
  .brand { display: flex; align-items: center; gap: var(--sp-3); color: var(--text); }
  .brand:hover { text-decoration: none; }
  .brand:hover .avatar { transform: rotate(-6deg) scale(1.08); }
  .avatar {
    width: 36px; height: 36px; border-radius: 50%;
    background: linear-gradient(135deg, #0969da 0%, #8250df 100%);
    box-shadow: inset 0 0 0 1px rgba(0,0,0,0.06);
    transition: transform var(--dur-fast) var(--ease-spring);
  }
  .brand-text { display: flex; flex-direction: column; }
  .brand-name { font-weight: 600; font-size: var(--fs-sm); }
  .brand-sub  { font-size: var(--fs-xs); color: var(--text-muted); }
  nav.primary { margin-left: auto; display: flex; gap: 2px; }
  nav.primary a {
    position: relative; color: var(--text-muted); font-weight: 500;
    font-size: 14px; padding: var(--sp-2) var(--sp-3); border-radius: 6px;
    transition: color var(--dur-fast) var(--ease-out), background var(--dur-fast) var(--ease-out);
  }
  nav.primary a:hover { color: var(--text); background: var(--bg-subtle); text-decoration: none; }
  nav.primary a.active { color: var(--text); }
  nav.primary a.active::after {
    content: ''; position: absolute; left: var(--sp-3); right: var(--sp-3); bottom: 2px;
    height: 2px; background: #fd8c73; border-radius: 1px;
    animation: underline-in var(--dur-mid) var(--ease-out) both;
  }
</style>
```

- [ ] **Step 2: Write `SiteFooter.astro`**

Write `src/components/SiteFooter.astro`:
```astro
---
const year = new Date().getUTCFullYear();
---
<footer>
  <div class="chrome footer-inner">
    <div>© {year} Kiran Danduprolu</div>
    <div class="links">
      <a href="https://github.com/hashd">GitHub</a>
      <a href="https://twitter.com/_hash_d">Twitter</a>
      <a href="mailto:kirandanduprolu@gmail.com">Email</a>
    </div>
  </div>
</footer>
<style>
  footer {
    margin-top: var(--sp-9); padding: var(--sp-7) 0;
    border-top: 1px solid var(--border);
    color: var(--text-muted); font-size: var(--fs-xs);
  }
  .footer-inner { display: flex; justify-content: space-between; gap: var(--sp-4); }
  .links a { color: var(--text-muted); margin-right: var(--sp-4); }
  .links a:hover { color: var(--accent); }
</style>
```

- [ ] **Step 3: Write `GA4.astro`**

Write `src/components/GA4.astro`:
```astro
---
const id = import.meta.env.PUBLIC_GA_ID;
---
{id && (
  <>
    <script is:inline async src={`https://www.googletagmanager.com/gtag/js?id=${id}`}></script>
    <script is:inline define:vars={{ id }}>
      window.dataLayer = window.dataLayer || [];
      function gtag(){ dataLayer.push(arguments); }
      gtag('js', new Date());
      gtag('config', id);
    </script>
  </>
)}
```

- [ ] **Step 4: Write `BaseLayout.astro`**

Write `src/layouts/BaseLayout.astro`:
```astro
---
import '../styles/global.css';
import '../styles/motion.css';
import '../styles/shiki.css';
import { ClientRouter } from 'astro:transitions';
import SiteHeader from '../components/SiteHeader.astro';
import SiteFooter from '../components/SiteFooter.astro';
import GA4 from '../components/GA4.astro';

interface Props {
  title: string;
  description: string;
  ogImage?: string;
}
const { title, description, ogImage } = Astro.props;
const canonical = new URL(Astro.url.pathname, Astro.site).toString();
const og = ogImage ?? new URL('/og/default.png', Astro.site).toString();
---
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>{title}</title>
    <meta name="description" content={description} />
    <link rel="canonical" href={canonical} />
    <meta property="og:title" content={title} />
    <meta property="og:description" content={description} />
    <meta property="og:image" content={og} />
    <meta property="og:url" content={canonical} />
    <meta property="og:type" content="website" />
    <meta name="twitter:card" content="summary_large_image" />
    <link rel="icon" href="/favicon.ico" />
    <ClientRouter />
    <GA4 />
  </head>
  <body>
    <SiteHeader />
    <main><slot /></main>
    <SiteFooter />
    <script>
      (() => {
        const header = document.getElementById('siteHeader');
        if (!header) return;
        let ticking = false;
        const onScroll = () => {
          if (ticking) return;
          ticking = true;
          requestAnimationFrame(() => {
            header.classList.toggle('scrolled', window.scrollY > 8);
            ticking = false;
          });
        };
        document.addEventListener('scroll', onScroll, { passive: true });
      })();
    </script>
  </body>
</html>
```

- [ ] **Step 5: Update the placeholder homepage to use the layout**

Overwrite `src/pages/index.astro`:
```astro
---
import BaseLayout from '../layouts/BaseLayout.astro';
---
<BaseLayout title="Kiran Danduprolu" description="Notes on systems, types, and the craft of code.">
  <div class="content"><h1>Homepage placeholder</h1></div>
</BaseLayout>
```

- [ ] **Step 6: Build**

Run: `pnpm astro build`
Expected: build succeeds.

- [ ] **Step 7: Commit**

```bash
git add src/layouts/BaseLayout.astro src/components/SiteHeader.astro src/components/SiteFooter.astro src/components/GA4.astro src/pages/index.astro
git commit --no-gpg-sign -m "Add BaseLayout with header/footer, ClientRouter, GA4 env-gated snippet"
```

### Task 21: `TagPill.astro`

**Files:**
- Create: `src/components/TagPill.astro`

- [ ] **Step 1: Write the component**

Write `src/components/TagPill.astro`:
```astro
---
interface Props { tag: string; href?: string; }
const { tag, href } = Astro.props;
const palette = ['blue', 'green', 'yellow', 'orange', 'purple'] as const;
let hash = 0;
for (let i = 0; i < tag.length; i++) hash = (hash * 31 + tag.charCodeAt(i)) >>> 0;
const color = palette[hash % palette.length];
const Tag = href ? 'a' : 'span';
---
<Tag href={href} class:list={[ 'tag', `tag--${color}` ]}>{tag}</Tag>
<style>
  .tag {
    display: inline-block;
    font-size: 11px; padding: 2px 10px; border-radius: 999px;
    font-weight: 500;
    transition: transform var(--dur-fast) var(--ease-spring);
  }
  a.tag:hover { text-decoration: none; transform: scale(1.06); }
  .tag--blue   { background: var(--tag-blue-bg);   color: var(--tag-blue-fg); }
  .tag--green  { background: var(--tag-green-bg);  color: var(--tag-green-fg); }
  .tag--yellow { background: var(--tag-yellow-bg); color: var(--tag-yellow-fg); }
  .tag--orange { background: var(--tag-orange-bg); color: var(--tag-orange-fg); }
  .tag--purple { background: var(--tag-purple-bg); color: var(--tag-purple-fg); }
</style>
```

- [ ] **Step 2: Commit**

```bash
git add src/components/TagPill.astro
git commit --no-gpg-sign -m "Add TagPill component with deterministic color palette"
```

### Task 22: `PostCard.astro`

**Files:**
- Create: `src/components/PostCard.astro`

- [ ] **Step 1: Write the component**

Write `src/components/PostCard.astro`:
```astro
---
import type { Post } from '../lib/posts';
import { postHref } from '../lib/posts';
import TagPill from './TagPill.astro';

interface Props { post: Post; featured?: boolean; }
const { post, featured = false } = Astro.props;
const href = postHref(post);
const dateStr = post.data.date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
---
<a class:list={[ 'post-card', 'reveal-target', featured && 'featured' ]} href={href}>
  <h3 class="post-title">{post.data.title}</h3>
  <p class="post-excerpt">{post.data.description}</p>
  <div class="post-meta">
    {post.data.tags.map((t) => <TagPill tag={t} href={`/tags/${t}/`} />)}
    <span class="date">{dateStr}</span>
  </div>
</a>

<style>
  .post-card {
    display: block; color: inherit;
    border: 1px solid var(--border); border-radius: 10px;
    padding: var(--sp-4) var(--sp-5); background: var(--surface);
    transition: border-color var(--dur-fast) var(--ease-out),
                box-shadow var(--dur-mid) var(--ease-out),
                transform var(--dur-fast) var(--ease-out);
  }
  .post-card.featured { padding: var(--sp-5) var(--sp-6); }
  .post-card:hover {
    border-color: rgba(9,105,218,0.4);
    box-shadow: var(--shadow-md);
    transform: translateY(-1px);
    text-decoration: none;
  }
  .post-card:hover .post-title { color: var(--accent); }
  .post-title { margin: 0; font-size: var(--fs-lg); font-weight: 600; letter-spacing: -0.01em;
    transition: color var(--dur-fast) var(--ease-out); }
  .post-excerpt { margin: var(--sp-2) 0 0; font-size: 14px; color: var(--text); line-height: 1.55; }
  .post-meta { margin-top: var(--sp-3); display: flex; align-items: center; gap: var(--sp-2); flex-wrap: wrap; }
  .date { font-size: 12px; color: var(--text-muted); margin-left: var(--sp-1); }
</style>
```

- [ ] **Step 2: Commit**

```bash
git add src/components/PostCard.astro
git commit --no-gpg-sign -m "Add PostCard with hover micro-interaction and reveal-target class"
```

### Task 23: `ArchivedRibbon.astro`

**Files:**
- Create: `src/components/ArchivedRibbon.astro`

- [ ] **Step 1: Write the component**

Write `src/components/ArchivedRibbon.astro`:
```astro
---
interface Props { date: Date; }
const { date } = Astro.props;
const formatted = date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
---
<div class="archived-ribbon">
  <em>Originally published {formatted}. Preserved as-is.</em>
</div>
<style>
  .archived-ribbon {
    margin: var(--sp-3) 0 var(--sp-5);
    padding: var(--sp-2) var(--sp-3);
    border-left: 2px solid var(--accent-warm);
    background: var(--bg-subtle);
    color: var(--text-muted);
    font-size: var(--fs-sm);
  }
</style>
```

- [ ] **Step 2: Commit**

```bash
git add src/components/ArchivedRibbon.astro
git commit --no-gpg-sign -m "Add ArchivedRibbon component for migrated posts"
```

### Task 24: `Prose.astro`

**Files:**
- Create: `src/components/Prose.astro`

- [ ] **Step 1: Write the wrapper**

Write `src/components/Prose.astro`:
```astro
---
import '../styles/prose.css';
---
<article class="prose"><slot /></article>
```

- [ ] **Step 2: Commit**

```bash
git add src/components/Prose.astro
git commit --no-gpg-sign -m "Add Prose wrapper (article element + prose.css)"
```

### Task 25: `CopyCodeButton.astro`

**Files:**
- Create: `src/components/CopyCodeButton.astro`

- [ ] **Step 1: Write the enhancement**

Write `src/components/CopyCodeButton.astro`:
```astro
<script>
  function enhanceCodeBlocks() {
    const blocks = document.querySelectorAll('.prose pre');
    blocks.forEach((pre) => {
      if (pre.querySelector('.copy-btn')) return;
      const btn = document.createElement('button');
      btn.className = 'copy-btn';
      btn.type = 'button';
      btn.textContent = 'Copy';
      btn.addEventListener('click', async () => {
        const code = pre.querySelector('code')?.innerText ?? pre.innerText;
        try {
          await navigator.clipboard.writeText(code);
          btn.textContent = 'Copied ✓';
          btn.classList.add('copied');
        } catch { btn.textContent = 'Copy failed'; }
        setTimeout(() => { btn.textContent = 'Copy'; btn.classList.remove('copied'); }, 1400);
      });
      pre.appendChild(btn);
    });
  }
  document.addEventListener('astro:page-load', enhanceCodeBlocks);
</script>

<style is:global>
  .prose pre .copy-btn {
    position: absolute; top: 8px; right: 8px;
    background: var(--surface); border: 1px solid transparent; color: var(--text-muted);
    font-size: 12px; padding: 4px 10px; border-radius: 6px; cursor: pointer; opacity: 0;
    transition: opacity var(--dur-fast) var(--ease-out), border-color var(--dur-fast) var(--ease-out), color var(--dur-fast) var(--ease-out);
  }
  .prose pre:hover .copy-btn { opacity: 1; border-color: var(--border); }
  .prose pre .copy-btn:hover { color: var(--text); }
  .prose pre .copy-btn.copied { color: #1a7f37; border-color: #1a7f37; }
</style>
```

- [ ] **Step 2: Commit**

```bash
git add src/components/CopyCodeButton.astro
git commit --no-gpg-sign -m "Add CopyCodeButton progressive enhancement for code blocks"
```

### Task 26: `Giscus.astro`

**Files:**
- Create: `src/components/Giscus.astro`

- [ ] **Step 1: Write the component**

Write `src/components/Giscus.astro`:
```astro
---
/*
 * Giscus IDs are committed — they ship to the client anyway.
 * Replace the placeholder repo-id / category-id with values produced
 * by https://giscus.app after Discussions is enabled on the repo (Task 34).
 */
const GISCUS_REPO = 'hashd/github-blog';
const GISCUS_REPO_ID = 'REPLACE_AT_WIRE_UP';
const GISCUS_CATEGORY = 'General';
const GISCUS_CATEGORY_ID = 'REPLACE_AT_WIRE_UP';
---
<section class="giscus-root" aria-label="Comments">
  <script
    src="https://giscus.app/client.js"
    data-repo={GISCUS_REPO}
    data-repo-id={GISCUS_REPO_ID}
    data-category={GISCUS_CATEGORY}
    data-category-id={GISCUS_CATEGORY_ID}
    data-mapping="pathname"
    data-strict="1"
    data-reactions-enabled="1"
    data-emit-metadata="0"
    data-input-position="top"
    data-theme="light"
    data-lang="en"
    data-loading="lazy"
    crossorigin="anonymous"
    async
  ></script>
</section>
<style>
  .giscus-root { margin-top: var(--sp-7); }
</style>
```

- [ ] **Step 2: Commit**

```bash
git add src/components/Giscus.astro
git commit --no-gpg-sign -m "Add Giscus component (IDs filled in integration task)"
```

### Task 27: `NewsletterBlock.astro`

**Files:**
- Create: `src/components/NewsletterBlock.astro`

- [ ] **Step 1: Write the block**

Write `src/components/NewsletterBlock.astro`:
```astro
---
interface Props { variant?: 'full' | 'compact'; }
const { variant = 'full' } = Astro.props;
const user = import.meta.env.PUBLIC_BUTTONDOWN_USER ?? 'kirandanduprolu';
const action = `https://buttondown.email/api/emails/embed-subscribe/${user}`;
---
<aside class:list={[ 'nl', `nl--${variant}` ]}>
  <div class="nl-copy">
    <h3>The occasional dispatch</h3>
    <p>Long-form posts, maybe once a month. No spam.</p>
  </div>
  <form class="nl-form" action={action} method="post">
    <input type="email" name="email" required placeholder="you@example.com" aria-label="Email" />
    <button type="submit" class="btn">Subscribe →</button>
  </form>
</aside>

<style>
  .nl {
    margin: var(--sp-7) 0 0;
    border: 1px solid var(--border); border-radius: 10px;
    padding: var(--sp-5) var(--sp-6);
    display: flex; align-items: center; justify-content: space-between; gap: var(--sp-5);
    background: radial-gradient(120% 200% at 100% 0%, rgba(9,105,218,0.05), rgba(9,105,218,0) 55%), var(--bg);
  }
  .nl--compact { padding: var(--sp-4) var(--sp-5); gap: var(--sp-4); }
  .nl h3 { margin: 0 0 4px; font-size: var(--fs-md); font-weight: 600; }
  .nl p  { margin: 0; color: var(--text-muted); font-size: 14px; }
  .nl-form { display: flex; gap: var(--sp-2); }
  .nl-form input {
    padding: 10px 12px; border: 1px solid var(--border); border-radius: 8px;
    font-size: 14px; font-family: inherit; min-width: 200px;
  }
  .btn {
    display: inline-flex; align-items: center; gap: var(--sp-2);
    padding: 10px 16px; border-radius: 8px; background: var(--accent);
    color: white; font-weight: 500; font-size: 14px; border: none; cursor: pointer;
    box-shadow: 0 1px 0 rgba(31,35,40,0.1), inset 0 1px 0 rgba(255,255,255,0.15);
    transition: transform var(--dur-fast) var(--ease-out), box-shadow var(--dur-fast) var(--ease-out), background var(--dur-fast) var(--ease-out);
  }
  .btn:hover { background: #0860c7; box-shadow: 0 4px 12px rgba(9,105,218,0.25); transform: translateY(-1px); }
  .btn:active { transform: translateY(0); }
</style>
```

- [ ] **Step 2: Commit**

```bash
git add src/components/NewsletterBlock.astro
git commit --no-gpg-sign -m "Add NewsletterBlock with Buttondown embed form"
```

---

## PHASE 6 — Pages

### Task 28: Homepage `src/pages/index.astro`

**Files:**
- Modify: `src/pages/index.astro`

- [ ] **Step 1: Replace the placeholder homepage**

Overwrite `src/pages/index.astro`:
```astro
---
import BaseLayout from '../layouts/BaseLayout.astro';
import PostCard from '../components/PostCard.astro';
import { getLivePosts, getArchivedPosts, getFeaturedLivePosts } from '../lib/posts';

const featured = await getFeaturedLivePosts();
const live = (await getLivePosts()).filter((p) => !featured.includes(p)).slice(0, 6 - featured.length);
const archived = (await getArchivedPosts()).slice(0, 3);
---
<BaseLayout title="Kiran Danduprolu" description="Notes on systems, types, and the craft of code.">
  <div class="content">
    <section class="hero">
      <div class="intro-label">kiran.danduprolu.com</div>
      <h1>Notes on systems, types,<br/>and the craft of code.</h1>
      <p class="lede">A writing-forward corner of the internet. Mostly backend, occasionally functional, sometimes a yak getting shaved in public.</p>
    </section>

    <div class="section-title">
      <h2>Latest</h2>
      <a class="see-all" href="/writing/">All writing →</a>
    </div>

    <div class="cards">
      {featured.map((p) => <PostCard post={p} featured />)}
      {live.map((p) => <PostCard post={p} />)}
      {live.length === 0 && featured.length === 0 && (
        <p class="empty">New posts coming soon. In the meantime, the archive is below.</p>
      )}
    </div>

    {archived.length > 0 && (
      <>
        <div class="section-title">
          <h2>From the archive</h2>
          <a class="see-all" href="/writing/">See all →</a>
        </div>
        <div class="cards archive">
          {archived.map((p) => <PostCard post={p} />)}
        </div>
      </>
    )}
  </div>
</BaseLayout>

<style>
  .hero { padding: var(--sp-8) 0 var(--sp-5); }
  .intro-label { font-size: 12px; letter-spacing: 2px; text-transform: uppercase; color: var(--text-faint);
    animation: rise var(--dur-slow) var(--ease-out) 40ms both; }
  .hero h1 { margin: 10px 0 var(--sp-3); font-size: 40px; font-weight: 700; letter-spacing: -0.02em; line-height: 1.15;
    animation: rise var(--dur-slow) var(--ease-out) 120ms both; }
  .hero .lede { margin: 0; max-width: 560px; color: var(--text-muted); font-size: 18px;
    animation: rise var(--dur-slow) var(--ease-out) 200ms both; }
  .cards { display: grid; gap: var(--sp-3); }
  .cards.archive { opacity: 0.9; }
  .empty { color: var(--text-muted); }
</style>

<script>
  function wireReveal() {
    const cards = Array.from(document.querySelectorAll('.cards .reveal-target'));
    cards.forEach((el, i) => ((el as HTMLElement).style.transitionDelay = `${Math.min(i, 3) * 60}ms`));
    const io = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          entry.target.classList.add('revealed');
          io.unobserve(entry.target);
        }
      }
    }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });
    cards.forEach((c) => io.observe(c));
    cards.slice(0, 2).forEach((c) => c.classList.add('revealed'));
  }
  document.addEventListener('astro:page-load', wireReveal);
</script>
```

- [ ] **Step 2: Build and visually smoke test**

Run: `pnpm dev` in another terminal, visit `http://localhost:4321/`.
Expected: hero stagger animates; archive strip shows 3 posts.

- [ ] **Step 3: Commit**

```bash
git add src/pages/index.astro
git commit --no-gpg-sign -m "Implement homepage: hero, latest, archive strip"
```

### Task 29: `/writing/` index

**Files:**
- Create: `src/pages/writing/index.astro`

- [ ] **Step 1: Write the page**

Write `src/pages/writing/index.astro`:
```astro
---
import BaseLayout from '../../layouts/BaseLayout.astro';
import PostCard from '../../components/PostCard.astro';
import TagPill from '../../components/TagPill.astro';
import { getLivePosts, getArchivedPosts, getAllTagsWithCounts } from '../../lib/posts';

const live = await getLivePosts();
const archived = await getArchivedPosts();
const tags = await getAllTagsWithCounts();
---
<BaseLayout title="Writing · Kiran Danduprolu" description="Everything I've written.">
  <div class="content">
    <h1 class="page-title">Writing</h1>

    {tags.length > 0 && (
      <div class="tag-row">
        {tags.map((t) => <TagPill tag={`${t.tag} · ${t.count}`} href={`/tags/${t.tag}/`} />)}
      </div>
    )}

    {live.length > 0 && (
      <div class="section cards">
        {live.map((p) => <PostCard post={p} />)}
      </div>
    )}

    {archived.length > 0 && (
      <details class="archive-fold" open={live.length === 0}>
        <summary>Archive ({archived.length})</summary>
        <div class="cards archive">
          {archived.map((p) => <PostCard post={p} />)}
        </div>
      </details>
    )}
  </div>
</BaseLayout>

<style>
  .page-title { margin: var(--sp-7) 0 var(--sp-3); font-size: var(--fs-2xl); font-weight: 700; letter-spacing: -0.02em; }
  .tag-row { display: flex; flex-wrap: wrap; gap: var(--sp-2); margin-bottom: var(--sp-6); }
  .cards { display: grid; gap: var(--sp-3); }
  .cards.archive { opacity: 0.9; margin-top: var(--sp-4); }
  .archive-fold { margin-top: var(--sp-7); border-top: 1px solid var(--border); padding-top: var(--sp-5); }
  .archive-fold summary {
    font-size: var(--fs-sm); color: var(--text-muted); font-weight: 600;
    cursor: pointer; user-select: none; padding: var(--sp-2) 0;
  }
</style>
```

- [ ] **Step 2: Build and smoke test**

Run: `pnpm astro build && pnpm preview`; visit `/writing/`.

- [ ] **Step 3: Commit**

```bash
git add src/pages/writing/index.astro
git commit --no-gpg-sign -m "Implement /writing/ index with tag row and collapsed archive fold"
```

### Task 30: Post page

**Files:**
- Create: `src/pages/[...slug].astro`
- Create: `src/layouts/PostLayout.astro`

- [ ] **Step 1: Write `PostLayout.astro`**

Write `src/layouts/PostLayout.astro`:
```astro
---
import BaseLayout from './BaseLayout.astro';
import Prose from '../components/Prose.astro';
import TagPill from '../components/TagPill.astro';
import ArchivedRibbon from '../components/ArchivedRibbon.astro';
import NewsletterBlock from '../components/NewsletterBlock.astro';
import Giscus from '../components/Giscus.astro';
import CopyCodeButton from '../components/CopyCodeButton.astro';
import type { Post } from '../lib/posts';
import { postHref } from '../lib/posts';
import { readTimeMinutes } from '../lib/readTime';

interface Props {
  post: Post;
  body: string;
  prev: Post | null;
  next: Post | null;
}
const { post, body, prev, next } = Astro.props;
const dateStr = post.data.date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
const rt = readTimeMinutes(body);
const ogUrl = new URL(`/og${postHref(post)}.png`, Astro.site).toString();
---
<BaseLayout title={`${post.data.title} · Kiran Danduprolu`} description={post.data.description} ogImage={ogUrl}>
  <div class="content post-chrome">
    <a class="back" href="/writing/">← All writing</a>
    <h1 class="post-title">{post.data.title}</h1>
    <div class="byline">
      <span>{dateStr}</span>
      <span>·</span>
      <span>{rt} min read</span>
      {post.data.tags.length > 0 && <span>·</span>}
      <span class="tags">
        {post.data.tags.map((t) => <TagPill tag={t} href={`/tags/${t}/`} />)}
      </span>
    </div>
    {post.data.archived && <ArchivedRibbon date={post.data.date} />}
    <Prose><slot /></Prose>
    {(prev || next) && !post.data.archived && (
      <nav class="prev-next">
        {prev
          ? <a class="pn" href={postHref(prev)}>← {prev.data.title}</a>
          : <span />}
        {next
          ? <a class="pn next" href={postHref(next)}>{next.data.title} →</a>
          : <span />}
      </nav>
    )}
    <NewsletterBlock variant="compact" />
    <Giscus />
    <CopyCodeButton />
  </div>
</BaseLayout>

<style>
  .post-chrome { padding: var(--sp-7) 0; }
  .back { font-size: var(--fs-sm); color: var(--text-muted); display: inline-block; margin-bottom: var(--sp-5); }
  .post-title { font-size: var(--fs-3xl); line-height: 1.1; letter-spacing: -0.02em; margin: 0 0 var(--sp-3); }
  .byline { color: var(--text-muted); font-size: var(--fs-sm); display: flex; gap: var(--sp-2); align-items: center; flex-wrap: wrap; }
  .byline .tags { display: inline-flex; gap: var(--sp-2); }
  .prev-next {
    display: flex; justify-content: space-between; gap: var(--sp-4);
    margin: var(--sp-7) 0 0;
    padding: var(--sp-5) 0;
    border-top: 1px solid var(--border);
  }
  .pn { color: var(--text); font-weight: 500; }
  .pn.next { text-align: right; margin-left: auto; }
</style>
```

- [ ] **Step 2: Write the dynamic route**

Write `src/pages/[...slug].astro`:
```astro
---
import PostLayout from '../layouts/PostLayout.astro';
import { getAllPublishedPosts, getAdjacentLivePosts, postHref } from '../lib/posts';
import type { GetStaticPaths } from 'astro';

export const getStaticPaths: GetStaticPaths = async () => {
  const posts = await getAllPublishedPosts();
  return posts.map((post) => ({
    params: { slug: postHref(post).replace(/^\/|\/$/g, '') },
    props: { post },
  }));
};

const { post } = Astro.props;
const { Content, rawContent } = await post.render();
const { prev, next } = await getAdjacentLivePosts(post);
---
<PostLayout post={post} body={rawContent()} prev={prev} next={next}>
  <Content />
</PostLayout>
```

- [ ] **Step 3: Build and confirm the 6 archived posts render at their legacy URLs**

Run: `pnpm astro build && ls dist/2015/09/why-elixir/`
Expected: `index.html` exists.

- [ ] **Step 4: Commit**

```bash
git add src/layouts/PostLayout.astro src/pages/[...slug].astro
git commit --no-gpg-sign -m "Implement post route /YYYY/MM/slug/ with archived ribbon and next/prev"
```

### Task 31: Tags pages

**Files:**
- Create: `src/pages/tags/index.astro`
- Create: `src/pages/tags/[tag].astro`

- [ ] **Step 1: Write `tags/index.astro`**

Write `src/pages/tags/index.astro`:
```astro
---
import BaseLayout from '../../layouts/BaseLayout.astro';
import TagPill from '../../components/TagPill.astro';
import { getAllTagsWithCounts } from '../../lib/posts';

const tags = await getAllTagsWithCounts();
---
<BaseLayout title="Tags · Kiran Danduprolu" description="Browse posts by tag.">
  <div class="content">
    <h1 class="page-title">Tags</h1>
    <div class="grid">
      {tags.map((t) => (
        <a class="tag-card" href={`/tags/${t.tag}/`}>
          <TagPill tag={t.tag} />
          <span class="count">{t.count} {t.count === 1 ? 'post' : 'posts'}</span>
        </a>
      ))}
    </div>
  </div>
</BaseLayout>
<style>
  .page-title { margin: var(--sp-7) 0 var(--sp-5); font-size: var(--fs-2xl); font-weight: 700; letter-spacing: -0.02em; }
  .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: var(--sp-3); }
  .tag-card {
    display: flex; align-items: center; justify-content: space-between;
    padding: var(--sp-3) var(--sp-4);
    border: 1px solid var(--border); border-radius: 10px;
    color: var(--text);
    transition: border-color var(--dur-fast) var(--ease-out), transform var(--dur-fast) var(--ease-spring);
  }
  .tag-card:hover { border-color: rgba(9,105,218,0.4); transform: translateY(-1px); text-decoration: none; }
  .count { font-size: 12px; color: var(--text-muted); }
</style>
```

- [ ] **Step 2: Write `tags/[tag].astro`**

Write `src/pages/tags/[tag].astro`:
```astro
---
import BaseLayout from '../../layouts/BaseLayout.astro';
import PostCard from '../../components/PostCard.astro';
import { getAllPublishedPosts, getAllTagsWithCounts } from '../../lib/posts';
import type { GetStaticPaths } from 'astro';

export const getStaticPaths: GetStaticPaths = async () => {
  const tags = await getAllTagsWithCounts();
  return tags.map((t) => ({ params: { tag: t.tag } }));
};

const { tag } = Astro.params;
const posts = (await getAllPublishedPosts()).filter((p) => p.data.tags.includes(tag!));
---
<BaseLayout title={`#${tag} · Kiran Danduprolu`} description={`Posts tagged ${tag}.`}>
  <div class="content">
    <h1 class="page-title">#{tag}</h1>
    <div class="cards">
      {posts.map((p) => <PostCard post={p} />)}
    </div>
  </div>
</BaseLayout>
<style>
  .page-title { margin: var(--sp-7) 0 var(--sp-5); font-size: var(--fs-2xl); font-weight: 700; letter-spacing: -0.02em; }
  .cards { display: grid; gap: var(--sp-3); }
</style>
```

- [ ] **Step 3: Build and verify**

Run: `pnpm astro build && ls dist/tags/`
Expected: `index/` and one directory per tag.

- [ ] **Step 4: Commit**

```bash
git add src/pages/tags
git commit --no-gpg-sign -m "Implement /tags/ index and /tags/:tag/ pages"
```

### Task 32: Projects, Newsletter, 404

**Files:**
- Create: `src/layouts/PageLayout.astro`
- Create: `src/pages/projects.astro`
- Create: `src/pages/newsletter.astro`
- Create: `src/pages/404.astro`

Note: `/about/` and `/resume/` are served from `public/about/` and `public/resume/` respectively — no Astro pages needed for those routes.

- [ ] **Step 1: Write `PageLayout.astro`**

Write `src/layouts/PageLayout.astro`:
```astro
---
import BaseLayout from './BaseLayout.astro';
import Prose from '../components/Prose.astro';

interface Props { title: string; description: string; }
const { title, description } = Astro.props;
---
<BaseLayout title={`${title} · Kiran Danduprolu`} description={description}>
  <div class="content" style="padding: var(--sp-7) 0;">
    <h1 class="page-title">{title}</h1>
    <Prose><slot /></Prose>
  </div>
</BaseLayout>
<style>
  .page-title { margin: 0 0 var(--sp-5); font-size: var(--fs-2xl); font-weight: 700; letter-spacing: -0.02em; }
</style>
```

- [ ] **Step 2: Write `projects.astro`**

Write `src/pages/projects.astro`:
```astro
---
import PageLayout from '../layouts/PageLayout.astro';
import { getEntry } from 'astro:content';
const entry = await getEntry('pages', 'projects');
const { Content } = await entry!.render();
---
<PageLayout title={entry!.data.title} description={entry!.data.description}>
  <Content />
</PageLayout>
```

- [ ] **Step 3: Write `newsletter.astro`**

Write `src/pages/newsletter.astro`:
```astro
---
import BaseLayout from '../layouts/BaseLayout.astro';
import NewsletterBlock from '../components/NewsletterBlock.astro';
---
<BaseLayout title="Newsletter · Kiran Danduprolu" description="Subscribe to the occasional dispatch.">
  <div class="content" style="padding: var(--sp-7) 0;">
    <h1 class="page-title">Subscribe</h1>
    <p class="lede">The occasional dispatch — long-form posts, once every month or two.</p>
    <NewsletterBlock />
  </div>
</BaseLayout>
<style>
  .page-title { margin: 0 0 var(--sp-3); font-size: var(--fs-2xl); font-weight: 700; letter-spacing: -0.02em; }
  .lede { color: var(--text-muted); font-size: 18px; max-width: 560px; }
</style>
```

- [ ] **Step 4: Write `404.astro`**

Write `src/pages/404.astro`:
```astro
---
import BaseLayout from '../layouts/BaseLayout.astro';
---
<BaseLayout title="Not found · Kiran Danduprolu" description="The page you were looking for doesn't exist.">
  <div class="content" style="padding: var(--sp-8) 0; text-align: center;">
    <h1 style="font-size: 72px; margin: 0; letter-spacing: -0.02em;">404</h1>
    <p style="color: var(--text-muted); font-size: 18px;">That page wandered off.</p>
    <p><a href="/">← Back home</a></p>
  </div>
</BaseLayout>
```

- [ ] **Step 5: Build and verify all pages**

Run: `pnpm astro build`
Check:
- `dist/projects/index.html` exists.
- `dist/about/index.html` exists (from public/).
- `dist/resume/index.html` exists (from public/).
- `dist/newsletter/index.html` exists.
- `dist/404.html` exists.

- [ ] **Step 6: Commit**

```bash
git add src/layouts/PageLayout.astro src/pages/projects.astro src/pages/newsletter.astro src/pages/404.astro
git commit --no-gpg-sign -m "Add projects, newsletter, 404 pages (about/resume served from public/)"
```

---

## PHASE 7 — Integrations

### Task 33: OG image endpoint

**Files:**
- Create: `src/components/OgImage.tsx`
- Create: `src/pages/og/[...slug].png.ts`
- Create: `public/og/default.png`

- [ ] **Step 1: Create the satori template**

Write `src/components/OgImage.tsx`:
```tsx
export function ogTemplate(title: string, subtitle: string) {
  return {
    type: 'div',
    props: {
      style: {
        height: '100%', width: '100%',
        display: 'flex', flexDirection: 'column',
        justifyContent: 'space-between', padding: '60px',
        background: '#ffffff', color: '#1f2328',
        fontFamily: 'system-ui',
      },
      children: [
        {
          type: 'div', props: {
            style: { fontSize: 18, letterSpacing: 3, color: '#8c959f', textTransform: 'uppercase' },
            children: 'kiran.danduprolu.com',
          },
        },
        {
          type: 'div', props: {
            style: { display: 'flex', flexDirection: 'column', gap: 16 },
            children: [
              { type: 'div', props: { style: { fontSize: 64, fontWeight: 700, letterSpacing: -1, lineHeight: 1.1 }, children: title } },
              { type: 'div', props: { style: { fontSize: 24, color: '#656d76' }, children: subtitle } },
            ],
          },
        },
        {
          type: 'div', props: {
            style: { display: 'flex', alignItems: 'center', gap: 14 },
            children: [
              { type: 'div', props: { style: { width: 36, height: 36, borderRadius: 18, background: 'linear-gradient(135deg,#0969da,#8250df)' } } },
              { type: 'div', props: { style: { fontSize: 20, fontWeight: 600 }, children: 'Kiran Danduprolu' } },
            ],
          },
        },
      ],
    },
  };
}
```

- [ ] **Step 2: Create the OG endpoint**

Write `src/pages/og/[...slug].png.ts`:
```ts
import type { APIRoute, GetStaticPaths } from 'astro';
import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';
import { getAllPublishedPosts, postHref } from '../../lib/posts';
import { ogTemplate } from '../../components/OgImage';

export const getStaticPaths: GetStaticPaths = async () => {
  const posts = await getAllPublishedPosts();
  return posts.map((p) => ({
    params: { slug: postHref(p).replace(/^\/|\/$/g, '') },
    props: { title: p.data.title, description: p.data.description },
  }));
};

export const GET: APIRoute = async ({ props }) => {
  const { title, description } = props as { title: string; description: string };
  try {
    const svg = await satori(ogTemplate(title, description) as any, {
      width: 1200, height: 630,
      fonts: [],
    });
    const png = new Resvg(svg).render().asPng();
    return new Response(png, { headers: { 'Content-Type': 'image/png' } });
  } catch (err) {
    console.warn('[og] generation failed, using fallback', err);
    const res = await fetch(new URL('/og/default.png', import.meta.env.SITE));
    return new Response(await res.arrayBuffer(), { headers: { 'Content-Type': 'image/png' } });
  }
};
```

- [ ] **Step 3: Create a static fallback OG image**

Run:
```bash
mkdir -p public/og
cp public/images/logo.png public/og/default.png
```
(This is a placeholder. Replace with a proper 1200×630 PNG later.)

- [ ] **Step 4: Build and confirm OG PNGs are generated**

Run: `pnpm astro build && ls dist/og/2015/09/`
Expected: `why-elixir.png` (or similar) exists and `file` reports it as PNG.

- [ ] **Step 5: Commit**

```bash
git add src/components/OgImage.tsx src/pages/og public/og
git commit --no-gpg-sign -m "Generate per-post OG images via satori/resvg with fallback"
```

### Task 34: Giscus wiring

**Files:**
- Modify: `src/components/Giscus.astro`

- [ ] **Step 1: Enable Discussions on the repo**

Manual step: on github.com, open the repo's Settings → General → Features, tick **Discussions**. Then visit https://giscus.app, enter the repo, pick category "General" (or create "Comments"), and copy the generated `data-repo-id` and `data-category-id`.

- [ ] **Step 2: Replace the placeholder IDs**

Edit `src/components/Giscus.astro`: replace `GISCUS_REPO_ID = 'REPLACE_AT_WIRE_UP'` and `GISCUS_CATEGORY_ID = 'REPLACE_AT_WIRE_UP'` with the real values from giscus.app.

- [ ] **Step 3: Verify on a post page (dev)**

Run: `pnpm dev` and visit any post, scroll to bottom.
Expected: Giscus iframe loads.

- [ ] **Step 4: Commit**

```bash
git add src/components/Giscus.astro
git commit --no-gpg-sign -m "Wire Giscus with real repo/category IDs"
```

---

## PHASE 8 — Tooling & CI

### Task 35: Prettier + ESLint + lint-staged + git hooks

**Files:**
- Create: `.prettierrc.json`, `.prettierignore`, `.eslintrc.json`, `.eslintignore`, `.lintstagedrc.json`
- Modify: `package.json`

- [ ] **Step 1: Write prettier config**

Write `.prettierrc.json`:
```json
{
  "semi": true,
  "singleQuote": true,
  "trailingComma": "all",
  "printWidth": 100,
  "plugins": ["prettier-plugin-astro"],
  "overrides": [{ "files": "*.astro", "options": { "parser": "astro" } }]
}
```

Write `.prettierignore`:
```
dist/
.astro/
node_modules/
pnpm-lock.yaml
legacy/
public/about/
public/resume/
```

- [ ] **Step 2: Install ESLint parser deps and write ESLint config**

Run:
```bash
pnpm add -D astro-eslint-parser@^1.1.0 @typescript-eslint/parser@^8.12.2
```

Write `.eslintrc.json`:
```json
{
  "root": true,
  "extends": ["eslint:recommended", "plugin:astro/recommended"],
  "parserOptions": { "ecmaVersion": "latest", "sourceType": "module" },
  "overrides": [
    { "files": ["*.astro"], "parser": "astro-eslint-parser", "parserOptions": { "parser": "@typescript-eslint/parser", "extraFileExtensions": [".astro"] } },
    { "files": ["*.ts", "*.tsx"], "parser": "@typescript-eslint/parser" }
  ],
  "ignorePatterns": ["dist", ".astro", "node_modules", "legacy", "public/about", "public/resume"]
}
```

Write `.eslintignore`:
```
dist
.astro
node_modules
legacy
public/about
public/resume
```

- [ ] **Step 3: Write `.lintstagedrc.json`**

Write `.lintstagedrc.json`:
```json
{
  "*.{ts,tsx,js,mjs,astro,md,mdx,css,json}": ["prettier --write"]
}
```

- [ ] **Step 4: Wire `simple-git-hooks`**

Edit `package.json` to add the `prepare` script and hook config. Merge into the existing JSON:
```json
{
  "scripts": {
    "prepare": "simple-git-hooks"
  },
  "simple-git-hooks": {
    "pre-commit": "pnpm lint-staged"
  }
}
```

Run:
```bash
pnpm install
pnpm exec simple-git-hooks
```
Expected: hook installed.

- [ ] **Step 5: Format the repo once**

Run: `pnpm format`
Expected: a few files reformatted cleanly.

- [ ] **Step 6: Commit**

```bash
git add .prettierrc.json .prettierignore .eslintrc.json .eslintignore .lintstagedrc.json package.json pnpm-lock.yaml
git commit --no-gpg-sign -m "Add Prettier, ESLint, lint-staged, and pre-commit hook"
```

### Task 36: GitHub Actions deploy workflow

**Files:**
- Create: `.github/workflows/deploy.yml`

- [ ] **Step 1: Write the workflow**

Write `.github/workflows/deploy.yml`:
```yaml
name: Deploy
on:
  push:
    branches: [master]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: false

jobs:
  build:
    runs-on: ubuntu-latest
    env:
      PUBLIC_GA_ID: ${{ vars.PUBLIC_GA_ID }}
      PUBLIC_BUTTONDOWN_USER: ${{ vars.PUBLIC_BUTTONDOWN_USER }}
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with: { version: 9.12.3 }
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: pnpm
      - run: pnpm install --frozen-lockfile
      - run: pnpm astro check
      - run: pnpm validate:posts
      - run: pnpm astro build
      - run: pnpm linkcheck
      - uses: actions/upload-pages-artifact@v3
        with:
          path: ./dist
  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - id: deployment
        uses: actions/deploy-pages@v4
```

- [ ] **Step 2: Commit**

```bash
git add .github/workflows/deploy.yml
git commit --no-gpg-sign -m "Add GitHub Pages deploy workflow with validate-posts + linkcheck"
```

---

## PHASE 9 — Pre-cutover verification

### Task 37: Full local verification pass

**Files:**
- None (verification only).

- [ ] **Step 1: Clean build**

Run:
```bash
rm -rf dist .astro node_modules/.vite
pnpm install --frozen-lockfile
pnpm astro check
pnpm validate:posts
pnpm astro build
```
Expected: all pass.

- [ ] **Step 2: Run linkinator against the full archived URL list**

Run:
```bash
pnpm tsx scripts/extract-archived-urls.ts > /tmp/archived-urls.txt
pnpm linkcheck
while read url; do
  test -f "dist${url}index.html" && echo "OK  $url" || echo "MISS $url";
done < /tmp/archived-urls.txt
```
Expected: 6 × `OK`; linkinator exits 0.

- [ ] **Step 3: Preview server + manual smoke**

Run: `pnpm preview`
Visit and eyeball each route:
- `/` — hero, latest, archive strip.
- `/writing/` — tag chips, archive fold.
- `/2015/09/why-elixir/` — archived ribbon, prose, no next/prev, Giscus.
- `/tags/`, `/tags/elixir/`.
- `/projects/` — MDX content.
- `/about/` and `/resume/` — pre-built SPAs load.
- `/newsletter/` — Buttondown form.
- `/404.html` — 404.
- `/does-not-exist/` — also renders the 404.

- [ ] **Step 4: Lighthouse pass**

Run Lighthouse in Chromium against `/` and one post. Target ≥ 95 on all four axes.

- [ ] **Step 5: Commit any polish fixes**

```bash
git status
git add -A
git commit --no-gpg-sign -m "Post-verification polish"
```
(Skip this step if `git status` is clean.)

---

## PHASE 10 — Cutover

### Task 38: Flip Pages source to GitHub Actions

**Files:**
- None (repo settings).

- [ ] **Step 1: Flip Pages source**

Manual step on github.com: repo Settings → Pages → Source. Change "Deploy from a branch" to "GitHub Actions". Save.

- [ ] **Step 2: Confirm custom domain is still set to `kiran.danduprolu.com`**

If the custom domain field is blank, re-enter it.

### Task 39: Open the cutover PR

**Files:**
- None.

- [ ] **Step 1: Push latest `astro-rebuild`**

Run: `git push origin astro-rebuild`

- [ ] **Step 2: Open PR**

Run:
```bash
gh pr create --base master --head astro-rebuild \
  --title "Blog revamp: Astro rebuild with legacy archive preserved" \
  --body "$(cat <<'EOF'
## Summary
- Full-reset rebuild of kiran.danduprolu.com on Astro 4.x (spec: docs/superpowers/specs/2026-04-18-blog-revamp-design.md).
- Jekyll tree preserved under legacy/.
- All 6 existing posts migrated and flagged archived: true; URLs preserved.
- Pages deployment moves to GitHub Actions (source flipped in repo settings).

## Test plan
- [ ] CI passes (astro check, validate-posts, astro build, linkcheck).
- [ ] /2015/09/why-elixir/ resolves live (URL parity).
- [ ] /about/ and /resume/ SPAs still load from public/.
- [ ] /feed.xml returns 404 (RSS intentionally dropped).
EOF
)"
```

Expected: PR URL returned.

### Task 40: Merge and verify

**Files:**
- None.

- [ ] **Step 1: Wait for CI to pass**

Run: `gh pr checks --watch`

- [ ] **Step 2: Squash-merge to master**

Run: `gh pr merge --squash --delete-branch=false`
(Keep the `astro-rebuild` branch for a safety window.)

- [ ] **Step 3: Watch the Actions deploy on master**

Run: `gh run watch`
Expected: `Deploy` completes successfully.

- [ ] **Step 4: Verify live site**

Open https://kiran.danduprolu.com/ and https://kiran.danduprolu.com/2015/09/why-elixir/.

- [ ] **Step 5: Delete the stale `gh-pages` branch**

Run: `git push origin --delete gh-pages && git fetch --prune`

- [ ] **Step 6: Confirm custom domain binding + TLS**

Open repo Settings → Pages; verify `kiran.danduprolu.com` is set and TLS is Enforced.

- [ ] **Step 7: Delete `astro-rebuild` branch (after 24–72h safety window)**

Run:
```bash
git push origin --delete astro-rebuild
git branch -D astro-rebuild
```

---

## Self-Review

**Spec coverage:**
- Stack (Astro + MDX + Shiki CSS-vars + rehype-mermaid + satori + Giscus + GA4 + Buttondown + sitemap) → Tasks 3, 33, 34, plus PostLayout, GA4, NewsletterBlock.
- URL scheme (/, /writing/, /YYYY/MM/slug/, /tags/, /tags/:tag/, /about/, /projects/, /resume/, /newsletter/, /404.html, /sitemap-index.xml; /feed.xml removed) → Tasks 28–32. Sitemap via integration config (Task 3 Step 5).
- Astro config hard requirements (trailingSlash: always, build.format: directory) → Task 3 Step 5.
- Content model with zod → Task 4.
- Slug derivation → Task 6 (`postHref`).
- `src/lib/posts.ts` as single filter surface → Task 6.
- `scripts/validate-posts.ts` (slug uniqueness + image integrity) → Task 7.
- Visual design tokens + prose + shiki + motion → Tasks 15–19.
- Components (Header, Footer, GA4, PostCard, TagPill, Prose, CopyCodeButton, Giscus, NewsletterBlock, ArchivedRibbon) → Tasks 20–27.
- Pages (home, /writing/, post, tags, projects, newsletter, 404) → Tasks 28–32. /about/ and /resume/ preserved as SPAs → Task 12.
- OG images with fallback → Task 33.
- Pages source migration (CNAME → public/, flip source, delete gh-pages) → Tasks 13, 38, 40.
- CI workflow (validate-posts + astro check + build + linkinator + deploy) → Task 36.
- FUTURE_VISION.md → Task 14.
- Rollback path (revert merge commit; legacy/ retained) → captured in Task 40 flow.

No gaps found.

**Placeholder scan:** no "TBD"/"TODO". The only deferred values are Giscus `REPLACE_AT_WIRE_UP` (explicitly replaced in Task 34) and the OG default PNG (Task 33 Step 3 provides a concrete starter action).

**Type consistency:** `getLivePosts`, `getArchivedPosts`, `getAllPublishedPosts`, `getFeaturedLivePosts`, `getAdjacentLivePosts`, `getAllTagsWithCounts`, `postHref` are defined in Task 6 and referenced consistently across Tasks 28–33.

---
