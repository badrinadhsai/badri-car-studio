# Badris — Automotive Detailing Landing Page

A minimalist, single-page landing site for a car detailing studio. Built with
plain HTML, CSS and JavaScript — no build step, no frameworks, no dependencies.

## Features
- Responsive single-page layout (hero, services, gallery, process, contact)
- Scroll-reveal animations via `IntersectionObserver`
- Hero parallax, scroll-progress bar, animated marquee
- Real stock photography from Unsplash
- Mobile nav, accessible markup, `prefers-reduced-motion` support
- Warm, minimalist palette (off-white + charcoal + champagne accent) — no gradients

## Files
- `index.html` — markup
- `styles.css` — styling and animations
- `script.js` — interactions

## Customizing
- **Brand / name:** search `Badris` and `Badri` in `index.html` and replace.
- **Accent color:** edit `--accent` in `styles.css` (currently `#b8a888`).
- **Images:** swap the `images.unsplash.com` URLs in `index.html` for your own.
- **Contact email:** update `hello@badris.studio` in the footer and form handler in `script.js`.

## Local preview
```bash
python -m http.server 8000
# open http://localhost:8000
```

## Deploy
- **GitHub Pages:** push to a repo, then enable Pages on the `main` branch (root).
- **Netlify / Vercel:** drag the folder in, or connect the repo — zero config.

## License
MIT — see `LICENSE`. Free to use, modify and sell.
