# JobDorking

A free Google dork generator for job hunting. Pick your target job titles,
a posting window, the job boards you trust, and optional power filters —
JobDorking builds the exact `site:` / `intitle:` / `after:` search-operator
query and opens it (or copies it) for you. No sign-up required to use the
tool; an optional account adds cloud-synced saved searches.

**Live:** https://jobdorking.com

## Background

This project started as a personal tool: a minimalist, single-page utility
built to speed up my own job search by turning Google's advanced search
operators into something usable without memorizing syntax. It worked well
enough, on its own merits, to be worth developing into a proper product —
with a real design system, structured data and SEO groundwork for organic
discovery, and a foundation for eventual monetization. It's since grown
into a small product: search recipes, power filters, a daily job-search
workspace, and optional cloud sync.

## How it works

1. You enter comma-separated job titles.
2. You pick a posting window (24h, 3 days, 1 week, 1 month, 3 months, or any time).
3. You optionally check off job boards to restrict the search to (LinkedIn,
   Indeed, Dice, Greenhouse, Lever, Ashby, Workday, ZipRecruiter), or add a
   custom site. Leaving all boards unchecked searches all of Google,
   unrestricted to any site.
4. Optional power filters add must-include/exclude terms, a location,
   seniority level, and employment type to the query.
5. The page assembles a Google search-operator query client-side and lets
   you copy it, save it, or open it directly in Google.

**Search recipes** are one-click starting points (Remote tech, Product &
design, Fresh startup roles) that pre-fill titles, sources, and filters —
everything below them stays editable.

**Your workspace** is a daily habit tracker (checklist + weekly activity
streak) and your list of saved searches. It lives in `localStorage` by
default, so it works fully signed-out; signing in additionally syncs it
to the cloud so it follows you across devices.

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
| `DATABASE_URL` | `api/workspace.js` (Neon Postgres connection string) |

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
| `guide/index.html`                        | Google dorking cheat sheet                              |
| `guide/linkedin-job-search/index.html`    | LinkedIn-specific search guide                          |
| `guide/greenhouse-job-search/index.html`  | Greenhouse-specific search guide                        |
| `guide/lever-job-search/index.html`       | Lever-specific search guide                             |
| `guide/workday-job-search/index.html`     | Workday-specific search guide                           |
| `og-image.png`                            | Social share preview image (1200×630)                  |
| `robots.txt`                              | Crawler access rules + sitemap pointer                  |
| `sitemap.xml`                             | XML sitemap for search engines                          |
| `package.json`                            | Dependencies for the `api/` serverless functions        |

## License

[MIT](LICENSE)

## Author

Built by [Chris Hickman](https://www.linkedin.com/in/chriswhickman/).
