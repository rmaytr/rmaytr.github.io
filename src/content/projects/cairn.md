---
title: Cairn
cardLine: A calm, local-first task planner for brains that get overwhelmed by long lists. Type a task in plain words; it shows you one next step.
# TODO(Rodion): confirm the start date; the repo history starts Oct 21, 2026, and the earlier TasksApp repo may predate it.
dates: Oct 2026 – Present
year: '2026'
role: Solo product engineer · AI-assisted build with Claude Code
status: Live beta
category: [featured, web]
order: 2
stack: [React 19, TypeScript (strict), Zustand, Zod, Vite, Workbox (PWA), IndexedDB, WebCrypto, Supabase (Postgres, RLS), Cloudflare Workers + KV, Anthropic Claude API, Vitest, Playwright, GitHub Actions, Vercel]
metrics:
  - { value: '846', label: 'unit & integration tests, plus 33 end-to-end' }
  - { value: '~12,100', label: 'lines of TypeScript' }
  - { value: '≈$0.001', label: 'AI cost per captured task' }
links:
  - { label: Open the app, href: 'https://cairn-tasks-tawny.vercel.app/' }
  - { label: GitHub, href: 'https://github.com/rmaytr/Cairn_Task_Tracking_App' }
cover: ../../assets/work/cairn.png
figure: phone
---

## The problem

Most to-do apps assume you already plan well. For students, and anyone with ADHD, they turn into a guilt pile: one long column, red overdue badges, a dozen fields per task, and no answer to "what do I do right now?"

## What I built

- An installable, offline-capable **PWA** in **React 19, TypeScript, Zustand and Zod** (~**12,100 lines**) on **IndexedDB**. Everything stays in the browser unless the user turns on sync or the assistant.
- A natural-language capture box: a tokenizing parser turns "Finish lab report by Friday !" into a task with an area, a due date and a priority (**15+** date forms, DST-safe). Importers handle **5** formats (plain text, Markdown/Obsidian, JSON, Todoist CSV), each with a reviewable preview.
- A dependency-aware planner that combines urgency scoring with **Kahn's topological sort** on a priority heap and checks every new link for cycles. It orders **500** tasks with dependencies in about **10 ms**.
- **Lock in**, a focus mode that shows one task and its next small step and says why it comes first. Three views of everything: List, a mind **Map** and a **Radar** where nearer the middle means sooner.
- An optional **Claude** assistant that turns a sentence into a task with ordered steps, with **Zod**-validated structured outputs, prompt caching and prompt-injection safeguards. It falls back to local planning on any failure. Switching from Opus to **Haiku** cut estimated cost **40×** (≈ **$0.001** per task), and lazy-loading the SDK cut the main bundle **33%** (968 → 645 KB).

## Security and privacy

- Optional end-to-end-encrypted sync (implemented and tested, **not yet enabled in production**): **PBKDF2-SHA-256 (600,000 iterations)** and **AES-GCM-256** with non-extractable WebCrypto keys, ciphertext bound to its owner and version, and rollback protection, on **Supabase Postgres** with **Row Level Security**.
- A **Cloudflare Worker** proxy for shared AI access, with an origin allowlist, constant-time invite-code checks, **Workers KV** rate limits and streamed body caps, covered by **48** tests.
- A strict Content Security Policy; the build refuses to ship a secret key. The assistant sends only the new task's text plus open-task titles, areas, dates and priorities. Notes and steps never leave the device.

## Process and results

- Led **4** redesign rounds driven by user feedback, ending in a token-based design system with accessible menus, drag and drop, phone swipe gestures, full keyboard support and **4.5:1** text contrast. Automated design-QA failures fell from **4 to 0**.
- **846** Vitest unit and integration tests (including the proxy's 48) and **33** Playwright end-to-end tests (desktop, phone, offline). Triaged and fixed **31** findings from **3** parallel code-review passes (security, UI, logic).
- Deployed as a link-only beta on **Vercel** with a shared assistant; CI on **GitHub Actions** type-checks, lints, tests and builds on every push.
