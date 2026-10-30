---
title: sofiakamal.art
cardLine: A multi-page portfolio for a Stanford painter, ceramicist, poet and photographer, 58 works, a "watercolor bloom" page transition, JS cut from ~1,060 KB to 58 KB.
dates: May 2026 – Present
year: '2026'
role: Designer & developer (independent client project)
category: [featured, web]
order: 3
stack: [React 18, JavaScript (ES2020), Node.js, esbuild, HTML5, CSS3, View Transitions API, Web Animations API, Python (Pillow), Puppeteer, Lighthouse, Vercel]
metrics:
  - { value: '58 KB', label: 'JavaScript, from ~1,060 KB' }
  - { value: '1.1 s', label: 'first paint, from ~10 s' }
  - { value: '100', label: 'Lighthouse SEO, a11y, best practices' }
links:
  - { label: sofiakamal.art, href: 'https://sofiakamal.art' }
cover: ../../assets/work/sofiakamal.png
figure: exploded
---

## What I built

- Presents **58 works across 5 mediums** with **masonry galleries**, a **zoomable lightbox** (keyboard, swipe, a shareable link per artwork) and **scroll animations designed for each medium**.
- Signature **"watercolor bloom" page transition**: pigment spreads from the click point and the next page appears inside it. Built with the cross-document **View Transitions API** and **Web Animations API**, with a CSS fallback for Firefox; **zero dropped transitions** across 90 automated navigations.

## Results

- Rebuilt so pages are pre-rendered to static HTML with React via a custom **Node.js + esbuild** build: JavaScript **~1,060 KB → 58 KB**, mobile Lighthouse performance **32–41 → 87–95**, first paint **~10 s → 1.1 s**.
- Removed scroll and idle lag by replacing continuously animated SVG filters with GPU-composited layers and rewriting the custom cursor to bypass React re-renders; idle layout recalculations **303 → 2** per 5 seconds.
- **100/100 Lighthouse SEO, accessibility and best practices**: WCAG AA contrast, semantic landmarks, a focus-trapped keyboard-accessible lightbox, alt text for every artwork, reduced-motion support.

## Engineering

- Technical SEO and AI-search optimization: schema.org JSON-LD (Person, 56 VisualArtwork, 2 CreativeWork, breadcrumbs), image sitemap, Open Graph/Twitter cards, canonical URLs, AI-crawler rules in robots.txt, llms.txt and llms-full.txt.
- Hardened the **Vercel** deployment: hash-based **Content-Security-Policy**, full security headers, 308 redirects, content-hashed long-term caching.
- Asset pipeline in **Python (Pillow)**: responsive WebP ~70% smaller, auto-rotation and cropping of 18 film scans, procedurally generated watercolor masks.
- Every release verified by a **50-check Puppeteer end-to-end suite** across **7 screen sizes** (320–1920 px).
