# Changelog

All notable changes to ailegalguard.com are documented here.

## [2026-10-09] — Listing price updated to $100,000

- Changed `SITE.price` (`100000.00`) and `SITE.priceDisplay` (`$100,000`) in
  `src/consts.ts`. Every surface that renders the price pulls from these two fields:
  hero price chip, `Buy Now` CTA, pricing card, sticky mobile bar, exit-intent checklist
  offer, footer, FAQ answer, `mailto` subject/body, meta description, and the `Product`
  structured-data price.
- Removed the two remaining hardcoded `$9,997` strings in `/blog/` and the article
  template header; both now use `{SITE.priceDisplay}` so price changes stay one-line.
- Offer-form `placeholder="9997"` → `placeholder="100000"`; hero price dropped to
  `text-5xl` on mobile so the longer `$100,000 USD` string fits without overflow.
- Verified no `9,997` / `9997` strings remain in `dist/` (43 `$100,000` renders,
  7 `price: "100000.00"` schema values).

## [2026-10-09] — Comprehensive site optimization

### Technical foundation

- **Self-hosted fonts.** Replaced the render-blocking `fonts.googleapis.com` `@import`
  (CSS + font round-trips) with two self-hosted latin-subset variable WOFF2 files in
  `/fonts/` (`Inter`, `Space Grotesk`), `font-display: swap`, `<link rel="preload">` for
  both, and immutable edge caching. Removes a third-party dependency from the critical
  path and closes a privacy/consent gap.
- **Hero image delivery.** Cloudflare Images URLs now carry `width`/`height`/`quality`/
  `format` parameters (hero at `width=1920&quality=72`, OG at `1200x630`, touch icon at
  `180x180`) plus a `fetchpriority="high"` preload.
- **Preconnect** to `imagedelivery.net`.
- **Security headers** (`public/_headers`): added `Strict-Transport-Security` (1 year,
  includeSubDomains, preload), `Permissions-Policy`, and a `Content-Security-Policy`
  allowing only self + `static.cloudflareinsights.com`; retained `X-Frame-Options`,
  `X-Content-Type-Options`, `Referrer-Policy` and the canonical `Link` header.
- **Caching.** `/fonts/*` set to `public, max-age=31536000, immutable`; HTML responses are
  explicitly forced to `public, max-age=0, must-revalidate` in the Worker.
- **HTTPS enforcement** retained in the Worker (HTTP→HTTPS and `www`→apex, 301).
- **Sitemap / robots** regenerated: now 7 URLs (home, `/blog/`, 4 posts, `/privacy/`).
  `robots.txt` unchanged (allows crawling, points at the sitemap index).

### SEO

- Title tag now follows `[Domain Name] | Premium Domain for Sale | [Brand]`
  → `ailegalguard.com | Premium Domain for Sale | AI Legal Guard`.
- Meta description rewritten to lead with price, availability and a CTA; adds
  `max-image-preview:large` and an `author` meta.
- **Removed seller-authored `review` / `aggregateRating`** from the `Product` schema.
  Self-authored ratings violate Google's structured-data guidelines and risk a manual
  action.
- Added `FAQPage` schema backed by a new on-page FAQ section (`#faq`).
- Added `BlogPosting` + `BreadcrumbList` schema on every article, `Article` Open Graph
  type, and `article:published_time`.
- Blog post `<title>` tags capped at 70 characters via a dedicated `titleTag` field.
- Canonical URLs, `og:url` and trailing-slash policy verified across all 7 routes.
- Internal linking: nav, footer, homepage insights strip, related-posts block and
  breadcrumbs all cross-link the new content.

### Conversion rate optimization

- **Above the fold now shows price.** Added a ` $9,997 USD · AVAILABLE NOW` chip and a
  `Buy Now — $9,997` primary CTA in the hero; secondary CTA changed to `Make an Offer`.
- **CTA tiers by intent**: `Buy Now` (mailto with prefilled purchase order),
  `Make an Offer` (scrolls to the form), `Contact the seller directly`.
- **Trust signals** expanded: Escrow.com protected, instant push transfer, HTTPS secured,
  one-of-one asset, clean title, no renewals/lease/middlemen.
- **Sticky mobile purchase bar** (`StickyCta`) with price + Offer + Buy Now, safe-area
  aware, auto-hides on downward scroll.
- **Exit-intent email capture** (`ExitIntent`): desktop-only (never on touch devices, to
  avoid Google's intrusive-interstitial guidelines), shown at most once per session,
  honours `prefers-reduced-motion`, and delivers a real asset (the buyer's checklist)
  with an immediate direct link.
- **The inquiry form now actually works.** It previously faked submission with a 850ms
  timeout and discarded the data. It now POSTs to a new Worker endpoint.

### Backend (Cloudflare Workers, free plan)

- New `POST /api/inquiry` endpoint in `src/worker.ts`, storing records in a **Workers KV**
  namespace (`INQUIRIES`, 365-day TTL) — 1,000 writes/day and 100,000 reads/day on the
  Workers Free plan.
- Validation: JSON-only, 10 KB body cap, email format, required name for inquiries,
  20 field length caps.
- Abuse protection: same-origin check, honeypot field, minimum time-to-submit (1.5s),
  per-IP rate limit (1 write / 60s), `no-store` + `noindex` on API responses. Bots are
  answered with `201`/`200` but nothing is persisted, so quota cannot be drained.
- Optional `NOTIFY_WEBHOOK` secret: fire-and-forget forward of every stored record to an
  external endpoint via `ctx.waitUntil`, so submissions are not silently parked in KV.
- `wrangler.toml`: added the KV binding; bumped `compatibility_date` to `2026-09-15`;
  upgraded `wrangler` to `4.149.0`.

### Mobile friendliness

- All primary touch targets raised to ≥48px (`.tap` utility): nav CTAs, mobile menu
  toggle (was 40px), FAQ summaries, form controls, footer links.
- Nav breakpoint moved `md` → `lg` so five links plus two CTAs never collide.
- `input/select/textarea` pinned to 16px to prevent iOS focus-zoom; `min-h-[52px]` fields.
- Body gains bottom padding on mobile so the sticky bar never covers content; the bar uses
  `env(safe-area-inset-bottom)`.
- Mobile menu: scrollable, `aria-expanded`/`aria-modal`, Escape closes and restores focus,
  body scroll locked while open.
- No horizontal scrolling (`overflow-x-hidden` retained).

### Accessibility & validation

- Skip-to-content link, `:focus-visible` outlines, `aria-hidden` on decorative SVGs,
  labelled primary nav landmark, `role="status"` form feedback.
- Scroll reveal is opt-in: `.reveal` styles only apply once a `js` class is set on `<html>`,
  so content is never hidden without JavaScript, and all motion is disabled under
  `prefers-reduced-motion`.
- `npx html-validate "dist/**/*.html"` → **0 errors** (config in `.htmlvalidate.json`).
- `npx astro check` → **0 errors / 0 warnings / 0 hints**.
- `npx csstree-validator dist/_astro/*.css` → clean.
- Worker API exercised end-to-end against `wrangler dev`: 405 / 415 / 400 / 403 / honeypot
  / timing / 429 / 201 all verified, plus record persistence in local KV.

### Content (domain authority)

New `/blog/` section with an index page, per-post layout, and four launch articles:

1. `how-to-buy-a-domain-name-safely` — escrow, transfer locks, UDRP checks, red flags.
2. `premium-domain-valuation-guide` — the five valuation methods buyers actually use.
3. `premium-domain-investing` — `.com` durability, liquidity risk, honest returns.
4. `ai-law-regulation-2026` — the EU AI Act timeline after the Digital Omnibus
   (Regulation (EU) 2026/1744), verified against the Commission's implementation timeline.

Also added `/privacy/` (required for the new email capture) and reworked the 404-linked
nav/footer around the new content.

### Design

- Dark-only theme retained (light-mode toggle intentionally declined) — contrast,
  focus states and motion polished instead.
- Scroll-reveal fade-ins, hover elevation on cards, open/close rotation on FAQ summaries.
- Native `<details>` FAQ (works with zero JavaScript).
- Long-form `.article-body` typography for the blog.

### Deliberately **not** added

- **No fabricated social proof.** Fake view counters, fake "3 people viewing now" badges
  and invented testimonials were requested but would be deceptive and violate consumer
  protection rules; they were replaced with verifiable, factual trust signals.
- No marketplace search/filters — this is a single-asset listing, not an inventory.

### Not done here (requires owner action)

- **Read incoming inquiries** (stored in Workers KV):
  ```bash
  npx wrangler kv key list   --binding INQUIRIES --remote
  npx wrangler kv key get    --binding INQUIRIES --remote "inq:<timestamp>:<id>"
  npx wrangler kv key delete --binding INQUIRIES --remote "inq:<timestamp>:<id>"
  ```
  Note: `wrangler kv` defaults to **local** storage — `--remote` is required to see
  production submissions.
- **Get notified in real time** instead of polling KV: set an email/Slack/Make/Zapier
  webhook and the Worker will forward every submission after storing it:
  ```bash
  npx wrangler secret put NOTIFY_WEBHOOK
  ```
  The value is never committed to the repo.
- Submit `https://ailegalguard.com/sitemap-index.xml` in Google Search Console.
- Off-page work: DA 40+ outreach, guest posts, digital PR (see commit body).
- Optional: Cloudflare Turnstile on `/api/inquiry` if spam reaches the free-plan write cap.
