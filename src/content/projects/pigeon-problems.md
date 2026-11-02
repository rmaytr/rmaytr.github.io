---
title: Pigeon Problems
cardLine: A 1–4 player co-op rooftop platformer in the browser. Pigeons haul oversized cargo, throw and catch it, on a server-authoritative 60 Hz simulation.
dates: Oct 2026
year: '2026'
role: Creator · AI-assisted build with OpenAI Codex
# TODO(Rodion): confirm whether it was entered in the Handshake contest (the repo's draft says no entry was submitted).
category: [featured, games]
order: 4
stack: [JavaScript (ES modules), Three.js, WebGL, Node.js, WebSockets, Cloudflare Workers, Durable Objects, WebRTC, Web Audio API, Vite, Playwright]
metrics:
  - { value: '60 Hz', label: 'server-authoritative simulation' }
  - { value: '300 ms', label: 'injected lag, still playable' }
  - { value: '127', label: 'engine/session tests + browser checks' }
links:
  - { label: Play, href: 'https://pigeon-problems.vercel.app/' }
  - { label: GitHub, href: 'https://github.com/rmaytr/Pigeon-Problems' }
cover: ../../assets/work/pigeon-problems.png
figure: branches
---

## The game

A very professional delivery company, staffed entirely by pigeons. **1–4 players** create a private room by link, carry opposite ends of oversized cargo, throw and catch it, and gust each other across rooftops. **5 deliveries** and **6 platforming courses (50 platforms)**, with procedural 3D models, generated textures, movement-driven animation and synthesized sound. No imported assets.

## Engineering

- A **Three.js/WebGL** client with a **Cloudflare Workers** backend that runs each room as its own **Durable Object** and persists room state. A 1–4 player game playable from a link, no account or install.
- Server-authoritative netcode: a fixed **60 Hz** simulation, **20 Hz** state snapshots and **30 Hz** client input, with client-side prediction and sequence-based reconciliation. Movement and checkpoint recovery verified under **300 ms** of injected round-trip latency.
- One JavaScript physics and level engine shared across the browser, a local Node server and Cloudflare, including a custom constrained-load solver for cargo carried by one or two players, and a throw preview that predicts impact up to **~3 s** ahead using the same rules as gameplay.
- Hardened sessions: secret reconnect tickets kept out of broadcasts, input-sequence and duplicate-action checks, rate and payload limits, and a **2-minute** reserved seat on disconnect. Optional **WebRTC** voice with room-scoped signaling.
- Geometry batching kept local 1440×900 Chrome samples at **~60 fps** in **100–141 draw calls**.
- Keyboard and mouse with remappable keys, touch controls and the standard **Gamepad API**, plus reduced-motion settings and HUD layout checks down to a **320 px** screen.

## Verification

- **62** automated engine and session tests, **65** scripted **Playwright** browser checks, and complete runs of all 6 courses with **2 and 4** real WebSocket clients on the public deployment.
- Client and real-time backend deploy independently, with saved release versions and a documented rollback path.

## How it was made

I directed the concept, the cooperative mechanics, visual and movement revisions, level difficulty and review; OpenAI Codex assisted with code, procedural art, tests and docs.
