# Blog Revamp — Design Spec

**Date:** 2026-04-18
**Author:** Kiran Danduprolu
**Site:** kiran.danduprolu.com
**Status:** Approved for implementation planning

## Summary

A full-reset rebuild of the decade-old Jekyll blog at `kiran.danduprolu.com`. The new
site is writing-forward with room for resume, projects, and social links. It is built
on Astro, styled after GitHub-light, elevated with purposeful motion (micro and macro),
and deployed via GitHub Pages on the same repo using a side-branch cutover.

Old posts are preserved verbatim under the same URLs and flagged as archived.

## Goals

- Replace the Jekyll + jekyll-mono site with a modern, polished, motion-rich Astro
  build that feels sophisticated without relying on glassmorphism.
- Keep the writing as the centerpiece; resume, projects, and socials are accessible
  but do not dominate.
- Preserve all existing post URLs so inbound links continue to resolve.
- Ship fast, low-JS, accessible pages with respect for `prefers-reduced-motion`.

## Non-Goals

- RSS feed (explicitly dropped).
- Dark mode (explicitly dropped; light-only).
- Client-side search at launch (tracked in `FUTURE_VISION.md`).
- Unit tests. Build-time schema + link checks are the test surface.
- Comments migration from Disqus. Giscus is a clean break.

## Direction Decisions

| Decision          | Choice                                                                |
| ----------------- | --------------------------------------------------------------------- |
| Revamp scope      | Full reset — new stack, new design, rethink the site                  |
| Site identity     | Writing-forward, with resume / projects / socials as supporting links |
| Stack             | Astro 4.x, static output, MDX                                         |
| Fate of old posts | Migrate all 6, redesign as an archive section; URLs preserved         |
| Visual direction  | GitHub Native (sans, card-per-post, pill tags) — elevated with motion |
| Implementation    | Side branch `astro-rebuild`, cut over at the end                      |
| Hosting           | GitHub Pages + existing `CNAME` (`kiran.danduprolu.com`)              |
| Comments          | Giscus (GitHub Discussions)                                           |
| Newsletter        | Buttondown                                                            |
| Analytics         | GA4                                                                   |
| Syntax theme      | Shiki with `github-light`                                             |
| Diagrams          | Mermaid, rendered at build time to static SVG                         |
| OG images         | Auto-generated per post at build time                                 |
| RSS / dark mode   | Dropped; noted in `FUTURE_VISION.md`                                  |
| Search            | Deferred; tracked in `FUTURE_VISION.md`                               |

## Architecture

### Stack

- **Astro 4.x**, `output: 'static'`.
- Content in Markdown / MDX; `@astrojs/mdx` integration for the occasional interactive
  embed.
- **Styling**: vanilla CSS with CSS variables. No Tailwind, no CSS-in-JS.
- **Typography**: system sans (`-apple-system, "Segoe UI", ...`) for body/UI;
  `ui-monospace, "SF Mono", Menlo, Consolas` for code. No external fonts.
- **Syntax highlighting**: Shiki with `github-light` theme, configured in
  **CSS-variables mode** (`defaultColor: false`, emit class names) so tokens get class
  names and the theme ships as a small stylesheet rather than inline
  `style="color:#..."` on every `<span>`. Keeps code-heavy posts lean.
- **Comments**: Giscus, mounted per post.
- **Analytics**: GA4 via `gtag`, gated on `PUBLIC_GA_ID` env var.
- **Newsletter**: Buttondown — a dedicated `/newsletter/` page plus a compact block in
  the footer of each post.
- **Diagrams**: `rehype-mermaid` renders at build time to static SVG (no runtime JS).
- **OG images**: build-time generation via `satori` / Astro's OG image pattern, one per
  post.
- **Sitemap**: `@astrojs/sitemap`.
- **Astro config hard requirements** (preserve URL parity with Jekyll):
  - `trailingSlash: 'always'`
  - `build.format: 'directory'`
  - Without both set, GitHub Pages will 404 on legacy inbound links of the form
    `/YYYY/MM/slug` (no trailing slash) and on `/YYYY/MM/slug.html` — Jekyll emitted
    these. Pin in `astro.config.mjs` and verify in the linkinator pass.

### URL Scheme

| Path                 | Purpose                                                    |
| -------------------- | ---------------------------------------------------------- |
| `/`                  | Homepage — hero + latest posts + archive strip             |
| `/writing/`          | All writing index (current + archived, archived collapsed) |
| `/YYYY/MM/slug/`     | Individual post (matches existing Jekyll permalinks)       |
| `/tags/`             | Tag index                                                  |
| `/tags/:tag/`        | Posts filtered by tag                                      |
| `/about/`            | About page (migrated)                                      |
| `/projects/`         | Projects page (migrated)                                   |
| `/resume/`           | Resume page with linked PDF (migrated)                     |
| `/newsletter/`       | Buttondown subscribe form                                  |
| `/404.html`          | Branded 404                                                |
| `/sitemap-index.xml` | Sitemap                                                    |
| `/feed.xml`          | **Removed**                                                |

### Repo Layout (on the `astro-rebuild` branch)

```
src/
  content/
    config.ts            # collection + zod schemas
    posts/               # .md / .mdx with frontmatter
    pages/               # about.md, projects.md, resume.md
  layouts/
    BaseLayout.astro
    PostLayout.astro
    PageLayout.astro
  components/
    SiteHeader.astro
    PostCard.astro
    TagPill.astro
    Giscus.astro
    NewsletterBlock.astro
    Prose.astro          # styled <article> wrapper for markdown
    CopyCodeButton.astro
  pages/
    index.astro
    writing/index.astro
    [...slug].astro      # dynamic route for /YYYY/MM/slug/
    tags/index.astro
    tags/[tag].astro
    about.astro
    projects.astro
    resume.astro
    newsletter.astro
    404.astro
  styles/
    tokens.css           # colors, spacing, typography scale
    global.css
    prose.css            # typography for article body
public/
  images/                # migrated from current assets/images + images/
  resume/                # PDF + existing resume build artifacts
  favicon.ico
legacy/                  # original Jekyll tree, moved aside during migration
astro.config.mjs
FUTURE_VISION.md         # deferred ideas (search, RSS, dark mode, etc.)
```

## Content Model

Posts live in an Astro content collection with a strict zod schema; malformed
frontmatter fails the build.

```ts
// src/content/config.ts
const posts = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    description: z.string(), // required; used for OG + meta
    date: z.date(),
    updated: z.date().optional(),
    tags: z.array(z.string()).default([]),
    draft: z.boolean().default(false),
    featured: z.boolean().default(false), // wider card on homepage
    archived: z.boolean().default(false), // true for 2015-16 posts
    ogImage: z.string().optional(), // override auto-generated OG
    slug: z.string().optional(), // override default slug
  }),
});
```

**Slug derivation** for `[...slug].astro`: post filenames are `YYYY-MM-DD-foo.md`
(matching the existing Jekyll convention). The `[...slug].astro` route splits the
date prefix off the filename (or off the `date` frontmatter field when the two
disagree; `date` wins) and produces `/YYYY/MM/foo/` — for example, the file
`src/content/posts/2015-09-04-why-elixir.md` with `date: 2015-09-04` renders at
`/2015/09/why-elixir/`. A post that sets an explicit `slug` override replaces the
`foo` segment; the `/YYYY/MM/` prefix always comes from `date`.

**Filter helpers are centralized** in `src/lib/posts.ts`. Every page consumes
`getLivePosts()` / `getArchivedPosts()` / `getAllPublishedPosts()` from this module
— no page calls `getCollection('posts')` and filters inline. This guarantees that
`draft: true` is excluded everywhere and that the archived/live partition is
consistent across homepage, `/writing/`, next/prev, sitemap, and OG metadata.

**Slug uniqueness and image integrity** are enforced by `scripts/validate-posts.ts`,
run as an npm script before `astro build` (and wired into CI). It fails the build
if:

- Two posts resolve to the same `/YYYY/MM/slug/` path (silent last-write-wins is
  otherwise catastrophic — you lose a post with no warning).
- A post references an image path under `public/images/` that does not exist on
  disk.

Read time is computed at build time from word count at 250 wpm. `description` is
required — this forces deliberate summaries for OG cards. `draft: true` posts are
excluded from collection queries and from the sitemap.

All images flow through `astro:assets` (`<Image>`) for responsive `srcset` and lazy
loading. Existing image trees migrate wholesale; inline references in old posts are
rewritten where needed.

## Visual Design System

### Color Tokens (light only)

```css
--bg: #ffffff;
--bg-subtle: #f6f8fa; /* section bands, code block background */
--surface: #ffffff;
--border: #d0d7de;
--border-muted: #d8dee4;
--text: #1f2328;
--text-muted: #656d76;
--text-faint: #8c959f;
--accent: #0969da; /* primary links, CTAs */
--accent-warm: #bc4c00; /* occasional emphasis */
--shadow-sm: 0 1px 2px rgba(31, 35, 40, 0.04), 0 0 0 1px rgba(31, 35, 40, 0.04);
--shadow-md: 0 8px 24px rgba(31, 35, 40, 0.08);
```

Tag pill palette mirrors GitHub primer labels (blue / green / yellow / orange / purple).

**Anti-glassmorphism guardrails**: no `backdrop-filter`, no translucent surfaces, no
frosted nav. Depth comes from solid surfaces + 1px borders + tight shadows + motion.

### Typography

- Body: 17px / 1.65 line-height / max-width ≈ 68ch for prose.
- Headings: weight 700, tight tracking `-0.01em`.
- Scale: 13 / 15 / 17 / 20 / 24 / 32 / 48 (≈1.25 ratio).
- Spacing grid: 4 / 8 / 12 / 16 / 24 / 32 / 48 / 72 / 112.

### Layout

- Content column caps at **760px** for body text.
- Site chrome (header, footer) caps at **960px**.
- Viewport still flexes on mobile. No edge-to-edge layouts on wide screens.

### Motion System

Shared motion tokens:

```css
--ease-out: cubic-bezier(0.22, 1, 0.36, 1);
--ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1);
--dur-fast: 140ms;
--dur-mid: 280ms;
--dur-slow: 520ms;
```

All motion is gated by `@media (prefers-reduced-motion: reduce)` — animations collapse
to ~0ms.

**Macro animations**

- **View Transitions** (Astro `<ClientRouter />`): header persists, main column
  crossfades on navigation. Post titles share `view-transition-name` between list and
  post page so titles hand off across navigation.
- **Hero reveal** on homepage: intro label → H1 → lede stagger in (40–200ms delays,
  fade + 6px rise).
- **Scroll reveals** for post cards below the fold via `IntersectionObserver`; cards
  above the fold render pre-revealed to avoid flash.
- **Card reorder** when arriving at `/tags/:tag/` from `/writing/` or `/tags/`:
  Astro View Transitions animate shared `view-transition-name` cards into their new
  positions, producing a FLIP-like reorder. (Pure server-rendered navigation — no
  client-side filtering.)

**Micro-interactions**

- Post cards: on hover, border shifts to `rgba(9,105,218,0.4)`, shadow lifts
  `--shadow-sm` → `--shadow-md`, title goes `--accent`, card translates `-1px`.
- Tag pills: hover scales to `1.06` using `--ease-spring`.
- Body links: underline draws in left-to-right via `background-image` (no layout shift).
- Focus rings: 2px `--accent` outline, 2px offset.
- Buttons: 1px depress on press; shadow collapse on active.
- Copy-code button: fades in on code-block hover; ticks to success state on click.
- Header: gains `--shadow-sm` + border after 8px scroll (rAF-debounced).

**Library decision**

- Primary: Web Animations API + CSS. No framework.
- Pull **Motion One** (~4 KB) only if the FLIP reorder gets fiddly by hand.

## Page Specs

### `/` — Homepage

- Hero block: name, tagline, two-sentence lede.
- "Latest" section: up to 6 most recent non-archived posts as cards.
- Posts with `featured: true` render as a wider card at the top of the list (subtle
  emphasis; not a giant hero).
- "From the archive" strip at the bottom: up to 3 archived posts in a denser layout,
  clearly labeled. Links to `/writing/`.
- Footer: socials, current year.

### `/writing/` — All Writing Index

- Chronological list of all posts.
- Archived posts grouped under a collapsed "Archive" section (expands inline, no page
  load).
- Row of tag chips near the top linking to `/tags/:tag/`. Navigation uses View
  Transitions; there is no client-side filtering on this page.

### `/YYYY/MM/slug/` — Post Page

- Back-link ("← All writing") pinned at the top of the content column.
- Title (large, tight tracking), byline line: date · read time · tags.
- If `archived: true`: a small ribbon under the title —
  _"Originally published [date]. Preserved as-is."_
- Article body via `<Prose>`: generous measure, Shiki code blocks with copy button,
  inline footnotes, Mermaid diagrams.
- Next/prev navigation at the bottom: shown only on non-archived posts, and only
  traverses other non-archived posts chronologically. Archived posts do not show
  next/prev (they stand alone as preserved artifacts).
- Compact newsletter block.
- Giscus below.

### `/tags/` and `/tags/:tag/`

- `/tags/`: grid of tags, each with post count. Hover = spring scale (consistent with
  inline pills).
- `/tags/:tag/`: same card layout as homepage, showing posts that include the tag.
  Server-rendered; shared `view-transition-name` on cards produces a FLIP-like
  reorder when arriving from `/writing/` or `/tags/`.

### `/about/`, `/projects/`, `/resume/`

- Static MDX pages, same typography, minimal chrome.
- `/resume/` retains the existing PDF asset in `public/resume/`.

### `/newsletter/`

- One-page subscribe form via Buttondown embed, matching the newsletter block's palette.

### `/404.html`

- Consistent with site chrome, a small easter-egg line, link back home.

## Migration Plan

1. Create `astro-rebuild` branch off `master`.
2. Move the entire Jekyll tree into `legacy/` on that branch.
3. Scaffold Astro at the repo root; wire up content collections, layouts, components,
   tokens. Pin `trailingSlash: 'always'` and `build.format: 'directory'` in
   `astro.config.mjs`.
4. Migrate the 6 posts from `legacy/_posts/` into `src/content/posts/`:
   - Keep date-prefixed filenames.
   - Rewrite frontmatter to match the new schema. `description` is required — write
     one per post.
   - Set `archived: true` on all 6.
   - Rewrite `/assets/...` and `{{ site.url }}` references to plain absolute paths.
5. Migrate `/about/`, `/projects/`, `/resume/` content and linked assets (resume PDF
   into `public/resume/`).
6. Migrate favicon and logo into `public/`.
7. Copy the existing `CNAME` into `public/CNAME` so the custom-domain binding
   survives the first Actions deploy.
8. Wire Giscus (Discussions enabled on this repo).
9. Wire GA4 via `PUBLIC_GA_ID`.
10. Wire Buttondown embed via `PUBLIC_BUTTONDOWN_USER`.
11. Add `FUTURE_VISION.md` at repo root to log deferred ideas (search, RSS, dark mode,
    and anything else that comes up).
12. Run `scripts/validate-posts.ts` (slug uniqueness, image refs), `astro build`,
    and linkinator against `/dist`. Because URLs are preserved, no redirects are
    needed for old inbound links — but the linkinator pass must include the full
    archived URL list extracted from `legacy/_posts/` to prove parity.
13. In repo Settings → Pages, flip the deployment source from "Deploy from a
    branch" to "GitHub Actions". Do this before merging so the first push to
    `master` actually triggers the Actions-based deploy.
14. Squash-merge `astro-rebuild` → `master`.
15. After the first successful Actions deploy, delete the remote `gh-pages`
    branch (`git push origin --delete gh-pages`) so the stale Pages source can't
    race with the new one. Confirm the custom domain + TLS binding are still
    healthy.
16. Optional follow-up commit to delete `legacy/` after a release of safety-net time.

## Hosting & Deployment

- **GitHub Pages**, existing `CNAME` (`kiran.danduprolu.com`) preserved.

### Pages source migration (must happen before cutover)

The current repo deploys from a branch-based Pages source (`origin/gh-pages` exists
as a remote branch). The new site uses the Actions-based Pages deployment. If both
are active at cutover, the Action races with stale `gh-pages` content and can
either no-op or regress the live site. Migration steps, executed in order:

1. On the `astro-rebuild` branch, copy `CNAME` into `public/CNAME` so the Astro
   build emits it into `/dist/` on every deploy. (Without this step the first
   Actions deploy replaces the branch content and the custom domain is lost.)
2. Before merging `astro-rebuild` → `master`, flip the repo's Pages source from
   "Deploy from a branch" to "GitHub Actions" in repo Settings → Pages.
3. After the first successful Actions deploy on `master`, delete the remote
   `gh-pages` branch (`git push origin --delete gh-pages`) so the stale source is
   gone. Local stale refs can be pruned with `git remote prune origin`.
4. Verify the custom domain binding and TLS certificate are still set on the Pages
   settings page after the source switch — the `CNAME` file in `/dist/` should
   keep this stable, but confirm.

### Actions workflow

- `.github/workflows/deploy.yml` runs `astro build` on push to `master` and
  deploys `/dist` via `actions/deploy-pages@v4`. Includes the
  `scripts/validate-posts.ts` step and linkinator against `/dist` before deploy.
- Client-visible env vars (`PUBLIC_GA_ID`, `PUBLIC_BUTTONDOWN_USER`, Giscus repo/ID) are
  plain workflow vars — they ship to the client anyway, so they are not secrets.

## Tooling & Quality Gates

- `pnpm` for package management.
- TypeScript `strict`; content collections are zod-typed.
- Prettier with `prettier-plugin-astro`.
- ESLint with `eslint-plugin-astro`.
- `lint-staged` pre-commit: Prettier + `astro check` on staged files.
- CI (GitHub Actions): `astro check`, `astro build`, internal link check via
  `linkinator` against `/dist`. Build fails on any broken internal link.

## Testing Approach

- **No unit tests** — this codebase is templates and styles; tests would be ceremony
  without coverage value.
- **Build-time checks are the test surface**:
  - Zod schema validation on every post (missing / malformed frontmatter fails build).
  - `scripts/validate-posts.ts` (duplicate `/YYYY/MM/slug/` routes, missing image
    references under `public/images/`).
  - `astro check` (template + type errors).
  - Internal link check via `linkinator` against `/dist` (broken refs fail build).
    Configured with `--recurse=false` and skip patterns for outbound hosts so the
    check stays on internal links.
- **Visual smoke checklist** at `scripts/preview.md`: home, post, tag, archive, 404,
  projects, resume.
- **Manual Lighthouse pass** before cutover — target 95+ on all four axes.

## Error Handling & Edge Cases

- Missing `description` in frontmatter → build fails (deliberate).
- `draft: true` → excluded from collections and sitemap.
- Giscus fails to load (rate limit, offline) → quietly degrades, no layout shift.
- GA4 not configured locally → `gtag` snippet is conditional on env var; dev builds
  are clean.
- OG image generation fails for a post → fallback OG image + build warning.
- Mermaid parse error → build fails with the offending block's location.

## Performance Budget

- CSS: single file, ~10 KB gzipped.
- JS: Astro view transitions + sticky header + reveal observer + copy button.
  Combined target < 5 KB gzipped.
- No external fonts.
- LCP target < 1.2s on a warm cache for the homepage.

## Rollback

- `master` stays untouched until the final merge. If anything goes sideways post-merge,
  `git revert` the merge commit and the Jekyll site is live again.
- `legacy/` directory is kept for at least one release window post-launch before
  deletion.

## Deferred (tracked in FUTURE_VISION.md)

- Client-side search via Pagefind.
- RSS feed.
- Dark mode.
- Any future interactive experiments (playgrounds, demos).
