---
title: Hollow Alibi
cardLine: A browser party game of selective evidence for 2–10 players, with built-in voice. Show a little truth, sell a bigger lie.
dates: Oct 2026
year: '2026'
role: Creator · AI-assisted build with OpenAI Codex
category: [games, web]
order: 8
stack: [TypeScript, React 19, Cloudflare Workers, Cloudflare D1 (SQLite), Drizzle ORM, WebRTC (STUN/TURN), Next.js 16 (Vercel build), Playwright]
metrics:
  - { value: '2–10', label: 'players, or solo vs bots' }
  - { value: '90', label: 'audio paths verified across 10 browsers' }
  - { value: '54', label: 'engine and storage tests' }
# TODO(Rodion): a Vercel build was added Nov 1, 2026; if it has a published URL, use it for Play instead.
links:
  - { label: Play, href: 'https://hollow-alibi.smoky-harp-3438.chatgpt.site/' }
  - { label: GitHub, href: 'https://github.com/rmaytr/Hollow-Alibi' }
cover: ../../assets/work/hollow-alibi.png
figure: hub
---

## The game

Your case is secretly full or empty. Make a claim, publish one real clue, defend your story over voice, then trust your assigned rival or call **LIAR**. Five rounds, explicit stakes, no elimination. Rooms join by a five-letter code from any phone or laptop, with solo practice against bots.

## Engineering

- A **2–10 player** game in **TypeScript, React 19 and Cloudflare Workers**, built around a server-authoritative state machine (**5 phases, 5 rounds**) that validates every action and computes all scores on the server.
- Hidden information stays private: each player gets a separate view built from server-only state, so opponents' cases, decisions and server randomness never reach a client before the reveal. Bots play from the same restricted view.
- No lost or double-counted moves during simultaneous play: **optimistic concurrency control** (version-checked writes to **Cloudflare D1/SQLite**), idempotent action receipts and client-side rejection of stale snapshots.
- Opt-in **WebRTC** group voice with authenticated signaling, reconnect-safe session epochs and **TURN** relay fallback. An automated **10-browser** test confirmed audio on all **90** directed paths, and a forced relay-only test confirmed audio in both directions.
- Account-free play secured with **SHA-256**-hashed session tokens in HTTP-only cookies, same-origin checks, request-size caps and per-session and per-IP rate limits. TURN credentials live in runtime secrets, never in client code.
- **3** bot difficulty levels, all rule-based; the Expert bot weighs public evidence, each opponent's honesty history and expected value.

## Process

- Redesigned the core loop after playtest feedback, replacing open-ended evidence reading with a claim-and-challenge system that gives every player a statement to defend and one named opponent to judge.
- **54** engine and storage tests, including all **8** payoff combinations, and **Playwright** end-to-end matches down to a 320 px screen. Fixed issues found in testing, including a timeout exploit that let players deny opponents' points.
- Accessible dialogs, visible focus, reduced-motion support and mobile-first judgment screens.
