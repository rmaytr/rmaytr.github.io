---
title: Raincheck Raccoons
cardLine: A simultaneous-choice rooftop snack heist for 2–10 friends on their phones. Pick a roof and a role, then find out who had the same idea.
dates: Oct 2026
year: '2026'
role: Creator · AI-assisted build with OpenAI Codex
# TODO(Rodion): update when the challenge result comes in; until then it is an "Entry", never winner or finalist.
result: Entry, Handshake × OpenAI Multiplayer Game Challenge
category: [games, web]
order: 9
stack: [TypeScript, React 19, Next.js 16, Cloudflare Workers, Cloudflare D1, Drizzle ORM, Zod, Tailwind CSS, Web Audio API, Playwright, Vercel]
metrics:
  - { value: '18,000', label: 'simulated matches to balance the rules' }
  - { value: '83', label: 'API, lifecycle and browser checks' }
  - { value: '2–10', label: 'players, no account' }
links:
  - { label: Play, href: 'https://raincheck-raccoons.vercel.app' }
  - { label: GitHub, href: 'https://github.com/rmaytr/Raincheck-Raccoons' }
cover: ../../assets/work/raincheck-raccoons.png
figure: relay
---

## The game

The city is asleep. Every player secretly picks a rooftop and a role (Sneak, Scoop or Lookout). Stay under the roof's noise limit and the crew splits the snacks; wake the neighbours and everyone on that roof leaves empty-pawed. After six raids, the biggest stash wins. Join with a **6-character** room code or link; solo practice plays the real rules against three labelled bots.

## Engineering

- A **2–10 player** game in **TypeScript, React 19 and Cloudflare Workers** with server-side rules, deadlines, scoring and host handoff. The frontend runs as **Next.js on Vercel** and talks to the Cloudflare game backend through signed server-to-server requests.
- Simultaneous moves stay consistent with revision-checked **Cloudflare D1** writes and bounded retries, plus round and match IDs on every choice. Tests with **9 concurrent joins** and **10 concurrent choices** resolved each round once with no duplicate scores.
- Account-free play secured with random session tokens stored as **SHA-256** hashes in HttpOnly cookies, **Zod** payload validation, a 4 KB body cap, same-origin checks and rate limits. Authentication moved ahead of quota writes after review found forged cookies could create database rows.
- Fixed a race where a late polling response could restore a room the player had just left, using a request-generation guard, and confirmed the fix with a browser test that held a real response until after leaving.
- Original **SVG** art (city scenes, **8** avatars, role icons) and browser-synthesized sound with the **Web Audio API**; responsive layouts checked at **320, 390, 768 and 1440 px**.

## Process and verification

- Tuned the scoring rules with **18,000** simulated matches and a **5,280-case** role comparison, which led to raising one role's reward so it stayed a real strategic choice.
- Directed a multi-agent **OpenAI Codex** workflow from **100** game concepts to a **12**-concept shortlist, then defined API contracts and file ownership for backend, art/audio and QA agents, with independent review.
- **27** engine tests (**400** seeded scoring setups), **52** API and lifecycle checks, and **31** **Playwright** checks run against the public deployment.
