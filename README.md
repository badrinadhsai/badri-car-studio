# Badri Car Studio — Automotive Web Showcase

A responsive, single-page automotive detailing website built as a **frontend web development demo project**. It demonstrates semantic HTML, modern CSS, vanilla JavaScript interactions, a production deployment pipeline, and a working contact form — all without a framework or backend.

> **Note:** This is a student/portfolio project. "Badris" is a fictional business used purely to showcase frontend skills. It is not a real company and is not for sale.

## Overview

The goal of this project was to build a clean, minimalist marketing site from scratch and take it from a local folder to a live, publicly hosted URL with a working lead-capture form. It covers the full frontend lifecycle: structure and styling, scroll/animation behaviour, responsiveness, SEO, performance, and deployment.

## Key features

- Responsive layout (mobile / tablet / desktop) with a mobile navigation drawer
- Modern, minimalist UI/UX (off-white + charcoal palette, serif/sans typography)
- Service showcase, image gallery, and a pricing/demo section
- Step-by-step process section
- Contact / lead form with **Netlify Forms** integration
- Spam protection via a honeypot field and a hidden `form-name` field
- Email notifications on form submission (configured in Netlify)
- SEO: meta description, canonical URL, Open Graph, Twitter Card, and JSON-LD structured data
- `robots.txt` and `sitemap.xml`
- Responsive image optimisation (`srcset` / `sizes`, `fetchpriority`, async decoding)
- Scroll-reveal animations, hero parallax, and a scroll-progress bar (all respect `prefers-reduced-motion`)
- GitHub + Netlify deployment

## Tech stack

- **HTML5** — semantic markup
- **CSS3** — custom properties, grid/flexbox, animations, media queries
- **JavaScript** (vanilla ES6) — `IntersectionObserver` reveals, parallax, mobile menu, form handling
- **Netlify** — static hosting + Netlify Forms
- **Git / GitHub** — version control and repository hosting
- Stock imagery via the **Unsplash** CDN

No React, Node.js, Express, databases, or other backend services are used. Netlify Forms is the only server-side feature.

## Architecture / workflow

```
GitHub repository
      │  (push to main branch)
      ▼
Netlify deployment  ──►  Public website (https://<site>.netlify.app)
      │
      ▼
Visitor submits Contact form
      │
      ▼
Netlify Forms  ──►  captured submission + email notification
```

Netlify builds the site directly from the GitHub repository on every push. The contact form is detected at build time (via the `netlify` / `data-netlify` attributes) and routed to Netlify Forms; submissions are stored in the Netlify dashboard and forwarded to the configured email.

## Project structure

```
badri-car-studio/
├── index.html        # Markup, SEO/OG/Twitter/JSON-LD metadata, favicon
├── styles.css        # All styling, responsive breakpoints, animations, a11y focus
├── script.js         # Scroll reveals, parallax, mobile nav, form submission
├── robots.txt         # Crawler rules + sitemap pointer
├── sitemap.xml        # Single-page sitemap
├── README.md          # This file
└── LICENSE            # MIT
```

## Live demo

**https://badri-carstudio.netlify.app/**

> The Netlify site name above was auto-generated. It can be renamed in the Netlify dashboard (Site settings → Site details → Site name) to a cleaner slug such as `auto-detailing-showcase`. After renaming, update the `canonical`, Open Graph, Twitter, and `sitemap.xml` URLs in this repo to match.

## Learning outcomes

- Building a complete responsive marketing site with plain HTML/CSS/JS
- Using `IntersectionObserver` for performant scroll animations
- Implementing a mobile navigation pattern and accessible focus states
- Integrating a serverless contact form (Netlify Forms) with spam protection
- Applying SEO fundamentals: metadata, Open Graph, Twitter Cards, structured data
- Optimising images for different viewport sizes with `srcset` / `sizes`
- Setting up a CI-style deploy pipeline with Git + Netlify
- Writing clean, documented project files for a portfolio

## Future improvements

Ideas that could extend the project (not yet implemented):

- Unit/integration tests for the form and scripts
- A lightweight analytics integration (e.g. privacy-friendly, cookieless)
- A dark/light theme toggle
- Internationalisation (i18n)
- A content structure that makes rebranding to a real business easier
- Automated accessibility/performance checks in CI

## License

MIT — free to view, fork, and learn from.
