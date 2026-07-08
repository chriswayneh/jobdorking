# JobDorking

A free, single-page Google dork generator for job hunting. Pick your target
job titles, a posting window, and the job boards you trust — JobDorking
builds the exact `site:` / `intitle:` / `after:` Google search query and
opens it (or copies it) for you. No sign-up, no scraping, no backend.

**Live:** https://chriswayneh.github.io/jobdorking/ (custom domain
`jobdorking.com` is purchased but not yet wired up — see [Deployment](#deployment) below)

## Background

This project started as a personal tool: a minimalist, single-page utility
built to speed up my own job search by turning Google's advanced search
operators into something usable without memorizing syntax. It worked well
enough, on its own merits, to be worth developing into a proper product —
with a real design system, structured data and SEO groundwork for organic
discovery, and a foundation for eventual monetization.

## How it works

The whole app is one static file, `index.html` — no build step, no
framework, no dependencies. It's plain HTML/CSS/JS:

1. You enter comma-separated job titles.
2. You pick a posting window (24h, 3 days, 1 week, 1 month, 3 months, or any time).
3. You optionally check off job boards to restrict the search to (LinkedIn,
   Indeed, Dice, Greenhouse, Lever, Ashby, Workday, ZipRecruiter). Leaving
   all boards unchecked searches all of Google, unrestricted to any site.
4. The page assembles a Google search-operator query client-side and lets
   you copy it or open it directly in Google.

## Design

The visual system (color palette, DM Sans/Roboto type pairing, pill-shaped
buttons and inputs) was modeled after [similarweb.com](https://www.similarweb.com/)'s
brand — a deep navy dark theme, brand blue (`#195AFE`) accent, and fully
rounded controls. Both light and dark themes are supported and follow the
system color-scheme preference by default, with a manual toggle in the header.

The header logo is an inline SVG (a magnifying-glass badge in the accent
color) rather than a raster image, so it stays crisp at any size and needs
no external hosting.

## SEO

The page is set up for organic discovery and social sharing:

- Keyword-targeted `<title>` and meta description
- Canonical URL, `robots` meta tag, and `theme-color`
- Full Open Graph and Twitter Card tags, backed by a generated 1200×630
  branded `og-image.png` for link previews
- `WebApplication` and `FAQPage` JSON-LD structured data (the FAQ schema
  mirrors the visible on-page FAQ, for potential rich-result eligibility)
- A "How it works" section and a 5-question FAQ as real, crawlable page
  content — not just the tool form
- `robots.txt` and `sitemap.xml` at the repo root

All canonical/OG/sitemap URLs currently point at `https://jobdorking.com/`,
the intended production domain — see [Deployment](#deployment) for its
current status.

## Deployment

Hosted on **GitHub Pages**, deployed from the `main` branch root — any push
to `main` goes live within about a minute, no CI/build step required.

**Custom domain status:** `jobdorking.com` has been purchased but DNS
hosting isn't set up yet, so the site is only reachable at
`chriswayneh.github.io/jobdorking` for now. Once DNS is ready, wiring up the
custom domain takes two steps:

1. Add a `CNAME` file to the repo root containing `jobdorking.com`, and set
   GitHub Pages' custom domain to match (`gh api -X POST repos/chriswayneh/jobdorking/pages -f "cname=jobdorking.com"`
   or via repo Settings → Pages).
2. At the domain's DNS provider, add:
   ```
   A       @      185.199.108.153
   A       @      185.199.109.153
   A       @      185.199.110.153
   A       @      185.199.111.153
   CNAME   www    chriswayneh.github.io.
   ```
   GitHub auto-detects the DNS and issues an HTTPS certificate once it
   propagates — no further action needed after that.

## Local development

No build step — just serve the directory statically and open it:

```
npx serve .
```

## Files

| File           | Purpose                                              |
|----------------|-------------------------------------------------------|
| `index.html`   | The entire app — markup, styles, and logic            |
| `og-image.png` | Social share preview image (1200×630)                 |
| `robots.txt`   | Crawler access rules + sitemap pointer                |
| `sitemap.xml`  | XML sitemap for search engines                        |

## License

[MIT](LICENSE)

## Author

Built by [Chris Hickman](https://www.linkedin.com/in/chriswhickman/).
