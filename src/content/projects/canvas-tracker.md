---
title: Canvas Assignment Tracker
cardLine: A Telegram bot that ranks your Canvas To Do list every morning and keeps reminding you every 2 hours until Canvas shows the work submitted.
dates: Oct 2026 – Present
year: '2026'
role: Solo developer · AI-assisted build with Claude Code
status: Private beta (6 users at several universities)
category: [featured, systems]
order: 3
stack: [Python 3.13 (asyncio), python-telegram-bot, Canvas LMS REST API, httpx, SQLite, Pydantic, cryptography (Fernet), Docker, Google Cloud Compute Engine, GitHub Actions, pytest, Hypothesis, mypy --strict, Ruff, uv]
metrics:
  - { value: '426', label: 'automated tests' }
  - { value: '94%', label: 'line + branch coverage (98% on the scheduler)' }
  - { value: '28,800', label: 'simulated scheduler ticks across a DST change' }
# no live link: an invite-only beta (Instructure's API policy rules out asking other users for their tokens)
links:
  - { label: GitHub, href: 'https://github.com/rmaytr/CanvasAssignmentTrackingBot' }
cover: ../../assets/work/canvas-tracker.png
figure: terminal
---

## The problem

Canvas tells you about a deadline once, in an email you probably didn't read. This bot keeps telling you until the work is in.

## What I built

- A multi-user Telegram bot in **Python 3.13 (asyncio)** (**5,500+ lines**, **51** modules). It reads Canvas To Do data through the **Canvas REST API**, sends a ranked morning list, and while anything is due within 24 hours sends one combined reminder every 2 hours until Canvas shows it submitted. One-tap Done, Snooze, Open and Undo buttons; quiet hours; an 11:30 PM warning about anything due overnight.
- A transparent **100-point** priority score built from urgency, each item's actual share of the final grade (from weighted assignment groups) and estimated effort, with a one-line reason shown for every rank.
- A tenant-isolated architecture: a separate **SQLite** database, Canvas client and scheduler per user, with invite-only access, **Fernet**-encrypted Canvas tokens at rest and a resumable in-chat sign-up that takes about **2 minutes**.
- A pure, deterministic, DST-correct scheduler whose send keys are claimed atomically before delivery, so restarts and crashes can't produce duplicate reminders.
- Re-architected the bot from a single-user, self-hosted tool into an invite-only multi-tenant service after testers found self-hosting too complex, keeping the tested core unchanged (v0.1 Oct 17 → v0.2 "Friends mode" Oct 24, 2026).

## Security

- Canvas client is read-only (GET only), host-pinned, uses **ETag/304** conditional polling and rate-limit backoff with jitter, and runs SSRF checks on user-supplied Canvas addresses. The bot deletes any chat message containing a token, and secrets are redacted from every log line.
- Hardened **Docker** deployment (non-root, read-only filesystem, dropped capabilities, file secrets) with a one-command installer, on **Google Cloud Compute Engine**'s free tier (**$0** during the beta).

## Quality

- **426** automated tests: **94%** line and branch coverage, **98%** on the scheduling core; **0** `mypy --strict` errors; Ruff security linting; CI on **GitHub Actions**.
- Validated by a **3-week** minute-by-minute simulation (~**28,800** ticks) across a daylight-saving change, plus **Hypothesis** property tests.
- Fixed **18** Critical or Important findings from **2** independent code reviews, each with a regression test.

It runs as a small invite-only beta: Instructure's API policy doesn't allow asking other users for personal tokens, so it isn't offered as a public product.
