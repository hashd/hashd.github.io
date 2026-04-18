# kiran.danduprolu.com

Source for [kiran.danduprolu.com](https://kiran.danduprolu.com) — a writing-forward personal site built on Astro.

## Stack

- **[Astro](https://astro.build) 4.x**, static-only output
- **Markdown / MDX** content via Astro content collections (zod-validated)
- **Vanilla CSS** with CSS variables; GitHub-light palette
- **[Shiki](https://shiki.style)** syntax highlighting (`github-light`, CSS-variables mode)
- **[satori](https://github.com/vercel/satori) + [resvg](https://github.com/yisibl/resvg-js)** for per-post Open Graph images
- **[Giscus](https://giscus.app)** comments, **GA4** analytics, **[Buttondown](https://buttondown.email)** newsletter
- **pnpm**, **Prettier**, **ESLint**, **lint-staged**, **simple-git-hooks**, **[linkinator](https://github.com/JustinBeckwith/linkinator)**
- Deployed to **GitHub Pages** via GitHub Actions

## Local development

Requirements:

- **Node.js 20+** (the repo is tested against Node 20 in CI; Node 22+ works locally)
- **[corepack](https://github.com/nodejs/corepack)** enabled so the pinned pnpm version is used automatically

```bash
corepack enable
pnpm install
pnpm dev          # local dev server at http://localhost:4321
```

Production-equivalent commands:

```bash
pnpm build        # runs validate:posts, then astro build
pnpm preview      # serves ./dist at http://localhost:4321
pnpm linkcheck    # boots preview + crawls every page
pnpm check        # astro check (TypeScript + content schemas)
```

## Scripts reference

| Script                | What it does                                                   |
| --------------------- | -------------------------------------------------------------- |
| `pnpm dev`            | Astro dev server with hot reload                               |
| `pnpm build`          | `validate:posts` → `astro build`; emits `dist/`                |
| `pnpm preview`        | Serves `dist/` locally                                         |
| `pnpm check`          | TypeScript + Astro content-collection diagnostics              |
| `pnpm validate:posts` | Fails the build on duplicate slugs or missing image references |
| `pnpm linkcheck`      | Boots preview server, crawls internal links with linkinator    |
| `pnpm format`         | Prettier write across the repo                                 |
| `pnpm lint`           | ESLint across `.ts` / `.tsx` / `.astro` / `.mjs`               |

## Repo layout

```
.github/workflows/deploy.yml    Pages deploy workflow (+ PR CI)
astro.config.mjs                trailingSlash: always, build.format: directory
src/
  content/
    config.ts                   zod schema for posts + pages collections
    posts/                      .md / .mdx posts (frontmatter-driven)
    pages/                      static MDX pages (projects, …)
  lib/
    posts.ts                    getLivePosts / getArchivedPosts / postHref / …
    readTime.ts                 words-per-minute estimate
  layouts/                      BaseLayout, PostLayout, PageLayout
  components/                   SiteHeader, PostCard, Prose, Giscus, …
  pages/
    index.astro                 homepage
    writing/index.astro         all writing (current + archive fold)
    [...slug].astro             dynamic post routes /YYYY/MM/slug/
    tags/{index,[tag]}.astro    tag index + per-tag
    og/[...slug].png.ts         per-post OG PNG generator
    projects.astro, newsletter.astro, 404.astro
  styles/                       tokens, global, prose, shiki, motion
scripts/
  validate-posts.ts             build-time slug + image integrity check
  extract-archived-urls.ts      prints the legacy URL list (linkinator parity)
public/
  CNAME                         custom-domain binding for GitHub Pages
  favicon.ico, logo.png
  images/                       post images
  og/default.png                fallback OG image
  about/                        pre-built About SPA (served verbatim)
  resume/                       pre-built Resume SPA (served verbatim)
legacy/                         pre-rebuild Jekyll tree, kept as a safety net
docs/superpowers/
  specs/2026-04-18-blog-revamp-design.md
  plans/2026-04-18-blog-revamp.md
FUTURE_VISION.md                deferred ideas (search, RSS, dark mode, …)
```

## Writing a post

1. Create `src/content/posts/YYYY-MM-DD-my-slug.md`.
2. Minimal frontmatter:

   ```yaml
   ---
   title: 'Post title'
   description: 'One-sentence summary (required — used for OG + meta).'
   date: 2026-05-01
   tags: [tag-one, tag-two]
   ---
   ```

3. Optional frontmatter:

   | Field      | Type     | Notes                                                 |
   | ---------- | -------- | ----------------------------------------------------- |
   | `updated`  | `date`   | Shown in byline when set                              |
   | `draft`    | `bool`   | `true` excludes the post from collections and sitemap |
   | `featured` | `bool`   | `true` gives a wider card on the homepage             |
   | `archived` | `bool`   | Shows the "Preserved as-is" ribbon; hides next/prev   |
   | `ogImage`  | `string` | Override the auto-generated OG image                  |

4. Write the body in Markdown / MDX.
5. `pnpm build` — zod validation + the validator fail fast on missing description, slug collisions, or broken image refs.

The post renders at `/YYYY/MM/slug/`, derived from the filename's date prefix.

## Deployment

Pushes to `master` trigger the GitHub Actions workflow at `.github/workflows/deploy.yml`:

1. `pnpm install --frozen-lockfile`
2. `pnpm astro check` (types + schemas)
3. `pnpm validate:posts` (slug uniqueness + image integrity)
4. `pnpm astro build` (static output)
5. `pnpm linkcheck` (preview server + linkinator crawl)
6. Upload `dist/` as the Pages artifact
7. Deploy via `actions/deploy-pages@v4`

Pull requests against `master` run steps 1–5 (but don't deploy), so regressions show up in checks before merge.

### First-time Pages source flip

On first cutover, flip the repo's Pages source from "Deploy from a branch" (legacy `gh-pages`) to "GitHub Actions" in **Settings → Pages**. `public/CNAME` keeps the custom domain binding stable across the flip.

### Environment / variables

Set these as repo **Actions variables** (not secrets — they ship to the client):

- `PUBLIC_GA_ID` — GA4 measurement ID, e.g. `G-XXXXXXXXXX`. Unset = no analytics.
- `PUBLIC_BUTTONDOWN_USER` — your Buttondown username. Unset = form falls back to a default handle.

Giscus IDs are currently committed as `REPLACE_AT_WIRE_UP` placeholders in `src/components/Giscus.astro`. After enabling **Discussions** on the repo and running through [giscus.app](https://giscus.app), replace the two placeholder IDs with the values it generates.

## Deferred / future work

See [`FUTURE_VISION.md`](./FUTURE_VISION.md). Not shipping in v2: RSS, dark mode, client-side search, MDX re-authoring of about/resume, interactive post embeds.

## License

Prose (content under `src/content/`) is © Kiran Danduprolu, all rights reserved. Code is MIT — see [`LICENSE.txt`](./legacy/LICENSE.txt) (retained in the legacy tree).
