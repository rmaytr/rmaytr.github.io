---
title: BOR Realty
cardLine: A bilingual (EN/RU) Next.js site for a Phoenix brokerage, with a self-updating 689-video library and 300+ accessibility and layout tests.
dates: Summer 2026
year: '2026'
role: Web Developer Intern, BOR Realty, LLC (Phoenix, AZ)
category: [featured, web]
order: 4
stack: [Next.js 14, React, TypeScript, Tailwind CSS, Node.js, YouTube Data API v3, GitHub Actions, Playwright, axe-core, ffmpeg, Vercel]
metrics:
  - { value: '689', label: 'videos synced daily' }
  - { value: '300+', label: 'Playwright tests' }
  - { value: '0', label: 'axe-core violations' }
links:
  - { label: Live site, href: 'https://bor-realty-website.vercel.app/' }
cover: ../../assets/work/bor.png
figure: phone
---

## What I built

- Built a **bilingual (English/Russian)** website in **Next.js 14, React, TypeScript and Tailwind CSS**, published as **18 static pages**, replacing the brokerage's main site.
- SEO and AI-search work: hreflang tags, XML sitemap, Open Graph/Twitter cards, **schema.org JSON-LD** (RealEstateAgent, FAQPage, Review, AggregateRating).
- **Automated media library:** **YouTube Data API v3** with an RSS fallback, a **Node.js** sync script and a **daily GitHub Actions** job keep **689 videos** current with no manual work. Videos are auto-categorized by hashtag and title, duplicate Shorts are hidden, and the library supports filtering, date sorting and pagination.
- Sold-listings and testimonials built on the same **typed data model**, so they can be synced the same way.

## Results

- **WCAG 2.1 AA:** **0 axe-core violations** across 40 page audits; **300+ Playwright tests** in Chrome and WebKit from 320 to 1440 px.
- Re-encoded the hero video with **ffmpeg** from 37 MB to 8.9 MB (**76% smaller**), plus a 1.9 MB vertical cut for phones.
- Wrote the **privacy, accessibility and fair housing** pages following ADA, CalOPPA and Arizona real estate advertising rules.
