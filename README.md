# JobDorking

A free, privacy-conscious job-search workspace that turns roles, filters, and
trusted job boards into one targeted Google query. JobDorking builds the
`site:` / `intitle:` / `after:` operators in real time, helps you save and run
repeatable searches, and tracks your weekly search habit. The complete tool
works without an account; optional sign-in syncs the workspace across devices.

**Live app:** [jobdorking.com](https://jobdorking.com)

## Current product

- **Persona starting points** for software engineers, product/design
  candidates, and startup hunters reduce the blank-page problem.
- **Search recipes with explainers** prefill proven combinations and compare
  manual searching with the boards and operators used by each recipe.
- **Power filters and a live query preview** cover titles, recency, sources,
  remote work, location, seniority, employment type, included terms, and
  excluded terms.
- **Job-board discovery** provides a filterable directory of supported sources
  with one-click “Add to Sources” actions, plus support for custom domains.
- **Saved searches and a daily workspace** include “Run today” actions,
  last-run timestamps, a three-step checklist, and a seven-day streak heatmap.
- **Mobile-first actions** keep “Open in Google” available in a sticky bottom
  bar after the primary button scrolls out of view.
- **Optional cloud sync** backs up saved searches, search activity, and the
  daily checklist through Clerk and Neon while preserving signed-out use.
- **Built-in product measurement** records only approved aggregate categories
  and counts so improvements can be prioritized without collecting searches.

All four product phases and the measurement phase are delivered. See the
[product roadmap](ROADMAP.md) for the completed scope.

## Background

This project started as a minimalist personal utility for turning Google's
advanced search operators into something usable without memorizing syntax. It
has since grown into a production job-search product with guided onboarding,
transparent query building, repeatable workflows, optional accounts,
privacy-conscious measurement, a consistent design system, and dedicated SEO
content for organic discovery.

## How it works

1. Choose a persona or search recipe, or start with a blank search.
2. Tune comma-separated job titles, posting recency, supported boards or a
   custom domain, and any optional power filters.
3. Review the human-readable Google query as it updates in real time.
4. Copy the query, save it for later, or open it directly in Google. On mobile,
   the Google action remains available while scrolling.
5. Return to saved searches and the daily workspace to run searches, review
   last-run timestamps, complete the checklist, and build a weekly streak.

**Search recipes** are one-click starting points (Remote tech, Product &
design, Fresh startup roles) that prefill titles, sources, and filters. Each
recipe includes an inline breakdown of its board coverage and Google operators;
clicking the active recipe again resets the entire search to its defaults.

**Your workspace** combines saved searches, last-run timestamps, a daily
checklist, and a weekly activity streak. It lives in `localStorage` by default,
so it works fully signed out; signing in additionally syncs the complete
workspace to the cloud so it follows you across devices.

## Accounts & cloud sync (optional)

Sign-in is powered by [Clerk](https://clerk.com); syncing is a small
serverless API backed by [Neon](https://neon.tech) (serverless Postgres):

- `api/auth-config.js` — hands the client Clerk's publishable key (reads
  `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`; returns 503 if unset, so the
  sign-in UI simply stays hidden when auth isn't configured)
- `api/workspace.js` — `GET`/`PUT`/`DELETE` for the signed-in user's
  workspace JSON, gated by a Clerk session token verified server-side
  (`CLERK_SECRET_KEY`) against a `jobdorking_workspaces` table
  (`DATABASE_URL`). Payloads are capped at 1MB; queries are parameterized.
- `api/product-events.js` — batches five product signals into daily aggregate
  counts in Neon. The endpoint accepts only fixed categories and bounded
  numbers and rejects arbitrary fields. Its aggregate table never stores
  searches, locations, account identifiers, or other user-entered content.

None of this is required to use the tool — everything gracefully falls
back to local-only storage if auth/database env vars aren't set.

## Design

The visual system (color palette, Poppins type, pill-shaped buttons and
inputs) was modeled after [similarweb.com](https://www.similarweb.com/)'s
brand — brand blue (`#2563EB`) accent, cyan secondary highlight, and fully
rounded controls. Both light and dark themes are supported and follow the
system color-scheme preference by default, with a manual toggle in the header.

The header logo is an inline SVG (a shield + magnifying-glass badge in the
accent color) rather than a raster image, so it stays crisp at any size and
needs no external hosting.

## SEO

The site is set up for organic discovery and social sharing:

- Keyword-targeted `<title>` and meta description per page
- Canonical URL, `robots` meta tag, and `theme-color`
- Full Open Graph and Twitter Card tags, backed by a generated 1200×630
  branded `og-image.png` for link previews
- `WebApplication`, `FAQPage`, and `Article` JSON-LD structured data
- A "How it works" section and a 5-question FAQ as real, crawlable page
  content — not just the tool form
- A `/guide/` reference page (Google dorking cheat sheet) plus board-specific
  guides for LinkedIn, Greenhouse, Lever, and Workday
- `robots.txt` and `sitemap.xml` at the repo root, kept in sync with every
  indexable page

All canonical/OG/sitemap URLs point at `https://jobdorking.com`, the live
production domain.

## Deployment

Hosted on **Vercel**, linked to the `main` branch of this repo — any push
to `main` auto-deploys. The frontend is static (no build step), and
`api/*.js` files deploy automatically as Vercel serverless functions.

Required environment variables (set in the Vercel project's Settings →
Environment Variables) for accounts/cloud sync to work:

| Variable | Used by |
|---|---|
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | `api/auth-config.js` (returned to the client) |
| `CLERK_SECRET_KEY` | `api/workspace.js` (server-side token verification) |
| `DATABASE_URL` | `api/workspace.js` and `api/product-events.js` (Neon Postgres connection string) |

Previously hosted on GitHub Pages; that's now disabled in favor of Vercel.

**Custom domain:** `jobdorking.com` (registered at Squarespace) is live and
serving over HTTPS, pointed at Vercel via an `A` record (`76.76.21.21`) at
the DNS provider, with `www.jobdorking.com` configured the same way. Both
are managed from the Vercel project's Settings → Domains.

## Local development

The static pages need no build step — serve the directory and open it:

```
npx serve .
```

`api/*` routes need the Vercel dev runtime and the env vars above to
actually work locally:

```
npm install
npx vercel dev
```

Without those env vars set, the app still runs fine — sign-in stays hidden
and workspace data stays local-only.

## Files

| File / directory                        | Purpose                                                |
|------------------------------------------|--------------------------------------------------------|
| `index.html`                              | The tool — markup, styles hook, and logic              |
| `style.css`                               | Shared stylesheet across all pages                     |
| `api/auth-config.js`                      | Serves the Clerk publishable key                       |
| `api/workspace.js`                        | Cloud workspace sync (GET/PUT/DELETE)                   |
| `api/product-events.js`                   | Privacy-conscious daily product-signal aggregation      |
| `guide/index.html`                        | Google dorking cheat sheet                              |
| `guide/linkedin-job-search/index.html`    | LinkedIn-specific search guide                          |
| `guide/greenhouse-job-search/index.html`  | Greenhouse-specific search guide                        |
| `guide/lever-job-search/index.html`       | Lever-specific search guide                             |
| `guide/workday-job-search/index.html`     | Workday-specific search guide                           |
| `og-image.png`                            | Social share preview image (1200×630)                  |
| `robots.txt`                              | Crawler access rules + sitemap pointer                  |
| `sitemap.xml`                             | XML sitemap for search engines                          |
| `ROADMAP.md`                              | Delivered product phases and measurement scope          |
| `package.json`                            | Dependencies for the `api/` serverless functions        |

## License

[MIT](LICENSE)

## Author

Built by [Chris Hickman](https://www.linkedin.com/in/chriswhickman/).
