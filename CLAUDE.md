# Portfolio 4.0

Astro site for rmaytr.github.io (GitHub Pages), dark, cinematic, motion-rich (see DESIGN.md). `contents.md` is the only source of facts: never invent or change a number, title, date or claim.

## Skill routing

Several installed skills cover the same ground. Each job has one owner; the rest are consultants. When two disagree, the owner wins, and `DESIGN.md` (once written) beats every skill.

| Job | Owner | Consult only | Do not use here |
|---|---|---|---|
| Art direction (type, palette, layout, effects) | Rodion's direction, recorded in `DESIGN.md` | `frontend-design`, `impeccable` (critique/polish passes), `emil-design-eng`, `apple-design` | `design-taste-frontend` house rules (they ban the glows, gradients, outlined type and effects Rodion asked for), `ui-ux-pro-max` style/palette picks (UX checklists only), `ecc:taste`, `ecc:frontend-design-direction` |
| Motion | GSAP skills (`gsap-core`, `gsap-timeline`, `gsap-scrolltrigger`, `gsap-plugins`) | `animate`, `review-animations`, `animation-performance` | `ecc:motion-*` |
| Smooth scroll | Lenis (one instance, synced to ScrollTrigger) | | Locomotive Scroll, AOS |
| Page transitions | Astro View Transitions | | Barba.js |
| 3D (hero character, laser scene, about globe) | `threejs-webgl` (vanilla three.js) | | React Three Fiber |
| Line-figure motion | Hairline (`@lucasmarkes/hairline`), new figures via `hairline-create` | | |
| React islands, if any | `motion-framer` inside the island only; `vercel-react-best-practices` | | |
| Components | Hand-built Astro components | shadcn-ui MCP, Magic MCP: reference only, port to Astro, must pass `DESIGN.md` | Magic UI / React Bits drop-ins |
| Pre-ship review | `web-design-guidelines`, `playwright-cli` screenshots at 390px and desktop | `break-ui`, `writing-guidelines` | |

Rules that keep libraries from fighting:
- Never animate the same element with both GSAP and Motion.
- One scroll engine and one ScrollTrigger setup per page; no second scroll listener library.
- Every animation honors `prefers-reduced-motion`.

## Testing

This overrides the global TDD / 80% unit-coverage rule for this project. Verify with Playwright instead: a smoke test per page (loads, no console errors, links resolve) plus screenshot checks at 390px and desktop, with reduced motion on and off. Unit-test only real logic (data transforms, utilities), if any appears.

The plugins in the "do not use" column are disabled for this project in `.claude/settings.json`. Re-enable one there if the design calls for it.
