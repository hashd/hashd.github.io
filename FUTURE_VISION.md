# Future Vision

A running log of ideas deferred from the 2026 blog revamp. Not a commitment —
a checklist to steal from when the itch strikes.

Organized so that items near the top are cheap + high payoff; items near the
bottom are larger or more speculative.

---

## Content features

- **RSS feed** (`/feed.xml`). Dropped at v2. Revisit the moment someone asks, or
  when the first newsletter issue wants to reuse RSS as source. Astro has a
  one-line integration (`@astrojs/rss`).
- **Client-side search** via [Pagefind](https://pagefind.app). Cheap to add
  (~50 KB worth), but pointless until there are enough posts to scan awkwardly
  (~15+). Wire it up when the `/writing/` page stops fitting above the fold.
- **Dark mode**. Intentionally not shipped in v2 — the identity is still
  forming. Revisit once the palette feels locked in. Remember the anti-
  glassmorphism guardrail stays: no translucent surfaces.
- **Series / part-of relationships**. Schema field (`series: { name, order }`)
  for multi-part posts so the post page can render a breadcrumb
  ("Part 2 of 4 · Elixir deep dive"). Add when the first 3-part post lands.
- **`updated` pulse**. When a post's `updated` field is set, flash a subtle
  underline-sweep on the date byline on first paint (`--accent-warm`). Tiny
  signal that the post is maintained, not frozen.

## Design / sophistication moves

Flagged by the designer adversarial review. None shipped in v2; each is cheap
and high-identity when ready.

- **Reading serif for `<Prose>`** only. Variable subset (Source Serif 4 or
  Newsreader, ~25 KB gzipped), at ~18/1.7 for the article body. Keep the
  system sans stack for chrome, cards, and meta. This is the single biggest
  quality bump for a writing-forward site.
- **Personal accent color**, used in exactly three places. Keep GitHub Primer
  as the neutral bones; introduce `--signature` (warm, e.g. `#c2410c`) for
  the active-nav underline, hero wordmark, and end-of-post dinkus. One color,
  three places, always — that's how palettes become identity.
- **Post-page as a designed object**: pull-quote component (serif, left-border
  in `--signature`), drop-cap on first paragraph, dinkus (`* * *`) as SVG
  section-break, 2 px progress-rail at the top tracking scroll. Makes the
  read feel like an issue, not a template slot.
- **Featured-post treatment**. Today `featured: true` just picks a slightly
  wider card. Give it a real layout: 2-column (title + excerpt + pull-quote
  on left; OG image or build-time gradient swatch on right, hairline rules
  above/below).
- **Signature assets**. A low-contrast index column down the homepage list
  (`01 / 02 / 03 …` in mono, `--text-faint`), and a hand-set SVG wordmark next
  to the brand (1 px stroke, `KD` initials).
- **Retire all-caps uppercase section labels** ("LATEST", "FROM THE ARCHIVE")
  — dated. Replace with sentence-case `h2` + a short terminated rule in
  `--accent-warm`.
- **Code-block chrome**. Replace the bare language label with a small
  language glyph (SVG, 12 px, monochrome) plus a filename when provided
  (`lib/walk.ex`). Adds editorial texture on technical posts.

## Tooling / hardening

Flagged during implementation reviews.

- **Extract shared slug derivation** to `src/lib/slug.ts`. Today `deriveSlug`
  and `derivePath` exist in `scripts/validate-posts.ts`; `postHref` in
  `src/lib/posts.ts` computes the same thing. They agree now but will drift.
  Factor them out before the next route-construction site appears.
- **Expand the image-integrity regex** in `scripts/validate-posts.ts`:
  - Catch HTML `<img src="/images/...">` (legacy Jekyll posts and raw-HTML
    fragments).
  - Catch MDX `<Image src="/images/...">` and JSX variants.
  - Strip trailing `"title"` suffixes in standard markdown image syntax.
  - URL-decode paths (`%20` → space) before `existsSync`.
- **Check `ogImage` frontmatter path exists on disk**. One more
  `existsSync` call in the validator; closes a silent-broken-share failure
  mode.
- **Validate slug URL-safety** in the zod schema:
  `slug: z.string().regex(/^[a-z0-9][a-z0-9-]*$/).optional()`. Same for
  tag names. Today a tag with spaces or unicode would produce broken routes.
- **Accumulate validator errors** instead of throwing on the first bad
  `date`. A build that reports all problems at once is friendlier than one
  that drips them in.
- **`readTime` accuracy**: strip inline code spans (`` `foo` ``) and markdown
  link URLs (keep link text) before counting words. Fixes over-counting on
  code-heavy / link-heavy posts.
- **Giscus graceful degradation**. Today the component renders a loud setup
  error if `GISCUS_REPO_ID` contains the `REPLACE_AT_WIRE_UP` sentinel. Guard
  the render so placeholder IDs silently no-op.
- **`GA4.astro` prettier compatibility**. The file is in `.prettierignore`
  because `prettier-plugin-astro` can't parse `arguments` inside an
  inline-script's `define:vars` block. Find a rewrite that's both
  gtag-compatible and prettier-parseable, then remove the ignore.
- **`astro check` memory for `public/`**. Currently `public/` is in the
  tsconfig `exclude` list because the minified legacy React SPAs under
  `public/about/` and `public/resume/` OOM the check. If / when those SPAs
  get re-authored to MDX (see below), the exclude can come off.

## Deployment / observability

- **PR preview deploys**. The current workflow runs CI on PRs but doesn't
  produce a previewable URL. Add a Cloudflare Pages / Netlify preview
  workflow so review can happen against a real deployed build rather than
  localhost.
- **Lighthouse CI**. Replace the "manual Lighthouse before cutover" step
  with an automated `lhci autorun` job scoped to a throttled mobile profile
  (p75 cold-cache LCP < 2.0 s on Moto G4). The current budget
  ("LCP < 1.2 s warm cache on localhost") is too easy to pass without
  saying anything useful.
- **Accessibility CI**. Add `axe-core` / `pa11y-ci` against a handful of
  representative pages (home, post, tag, archive, 404). Low setup cost,
  catches contrast + focus regressions early.
- **Internal linkinator expansion**. Today the check runs against the
  preview server; widen it to verify the full archived-URL list from
  `scripts/extract-archived-urls.ts` on every build, so URL parity with
  Jekyll is asserted continuously.

## Content model expansion

Schema fields the spec explicitly deferred. Add a field the first time a post
actually needs it — don't pre-add.

- `canonical: z.string().url().optional()` — for cross-posts to Substack,
  dev.to, Medium.
- `cover: z.string().optional()` — distinct from `ogImage`; a hero image
  for the post page itself.
- `noindex: z.boolean().default(false)` — for drafts published publicly,
  link-only pages, and retired posts.
- `related: z.array(z.string()).optional()` — manual "related posts"
  pointers, with a sensible tag-intersection fallback.

## Pages to re-author

- **About / Resume in MDX**. The v2 site ships the legacy React SPAs under
  `public/about/` and `public/resume/`. These are pre-built bundles with no
  source in-tree — ergonomically bad, stylistically inconsistent with the
  rest of the site, and an `astro check` landmine. Re-author both as MDX
  under `src/content/pages/` using the `PageLayout` template when the itch
  strikes. On re-authoring, remove the `public/about/` and `public/resume/`
  trees and the tsconfig `public` exclude.

## Speculative / far-future

- **Interactive post embeds** — MDX React islands for algorithm visualizers,
  code sandboxes, live graphs. The Astro stack supports this (`output:
'static'` + client directives); waiting on the first post that needs it.
- **Book notes / reading log**. Separate content collection, own landing
  page, likely a grid of covers + quotes rather than a post list. Different
  content model from posts.
- **Playgrounds**. A `/playground/` section for small demos kept separate
  from the writing stream.
- **Webmentions / ActivityPub**. If the IndieWeb / Fediverse gets interesting
  again, first-party webmention receipt + ActivityPub actor endpoint. Not a
  v2 concern; the giscus + newsletter setup is the social layer today.

---

When you pick something up from here: move it into the spec/plan directory
under `docs/superpowers/specs/` as a new design doc, brainstorm scope, and
ship. Delete the entry from this file once shipped.
