# DESIGN.md: Portfolio 4.0

Art direction for rmaytr.github.io v2, set by Rodion on 2026-10-29. When this file and a skill disagree, this file wins; when this file and Rodion disagree, Rodion wins.

**Direction in one line:** a dark, cinematic, motion-rich portfolio in the spirit of redoyanulhaque.me. An interactive 3D character of Rodion leads the hero, flowing animations and effects run through every section, and the type is expressive. It is a student's portfolio of achievements for employers, not a services site.

## What the site is about

Rodion as a whole: software engineer, ML engineer, researcher, founder, teacher. The research laser is **one** scroll scene among many, never the theme. No physics explanations anywhere, and no simulation controls.

## Colour: Cardinal & sand

Every red comes from Rodion's current portfolio (Stanford cardinal family). Sand is the warm second light.

| Token | Value | Use |
|---|---|---|
| `--bg` | `#0B0909` | Warm black ground |
| `--bg-2` | `#141011` | Section and card ground |
| `--surface` | `#1C1617` | Raised surfaces, chips |
| `--line` | `#2A2223` | Borders, tracks |
| `--ink` | `#F3EDE4` | Ivory text |
| `--muted` | `#A39A93` | Secondary text, dates |
| `--cardinal` | `#8C1515` | Brand mark, deep end of glows, footer fill |
| `--cardinal-light` | `#B83A3A` | Hover and active states |
| `--glow` | `#D44444` | Light: rim light, timeline beam, laser, focus ring |
| `--sand` | `#D4A574` | Second light: serif accents, rim light, gradient end |
| `--third` → `--rose` | `#E8A49C` (deep `#9C4A44`) | Third colour, warm rose between cardinal and sand: dates, kind pills, live things (not links: rose on red reads poorly) |
| `--sky` (backup) | `#8FC7E8` (deep `#3D7EA6`) | The earlier third colour, kept unused. To restore it, point `--third` / `--third-deep` at `--sky` / `--sky-deep` in `global.css` |

- Calls to action (`src/components/Cta.astro`): no pill. The label, which rolls to a sand copy on hover, beside a badge: a ring of the label's text turning slowly round a sand-outlined arrow. On hover the ring warms, a cardinal fill swells in the centre and the arrow passes through, all over 0.6–0.8s. No multicolour borders, no instant fills.
- Links (`.link`, `.more-link`): ivory text on a sand underline; "Read more" adds a sand arrow chip, and a bright sand rule draws across on hover.
- Section labels (`.label`): a sand-lit pill, a glowing dot on one side and a ring on the other so the word sits centred.
- Body paragraphs are justified and hyphenated; heading-like single lines stay left-aligned.
- Sections never meet at a straight line: scenes fade out at their edges, glows end inside their own boxes, the About sheet darkens in from nothing.

- Glows: radial `--glow`/`--sand` blurs behind the character and section heads (like the reference's violet glows, in our colours).
- Gradients are allowed for light and text: cardinal → sand on gradient text, the timeline beam and button hovers.
- A subtle film grain over the whole page.
- Locked by Rodion on 2026-10-29. No alternative palettes.

## Type

| Role | Face | Treatment |
|---|---|---|
| Display | Bricolage Grotesque 800 (variable, self-hosted) | Uppercase, tracking −0.04em, leading 0.86. Set **filled**, **outlined** (`-webkit-text-stroke`), or **gradient** (cardinal → sand). Outlined words fill with gradient on hover. |
| Accent | Instrument Serif italic | Human words: "Hi, I'm", "a", section kickers, one word in a heading |
| Body | Geist 400/500 | 16–19px, leading 1.55 |
| Meta | Geist Mono 500 | Dates, labels, counters' captions, uppercase with tracking |

Locked by Rodion on 2026-10-29.

## Motion and effects

GSAP (ScrollTrigger, SplitText, ScrambleText, Flip) owns everything outside React islands; Motion runs only inside islands; one Lenis instance; three.js for the character, the laser scene and the about-page globe. Every effect has a reduced-motion version and the content reads without JavaScript.

Catalogue (all required):
- Preloader: counter 0–100 while the character loads, then the name splits open.
- Hero character: an **original AI companion** modelled in code (no photo avatar): clay head and bust, gloss-black visor, sand-glowing eyes that follow the cursor and blink, a smile on hovering its face, happy eyes and a hop on click, headphones and collar lit in cardinal, an antenna on a spring. Floating clay, glass and glowing shapes drift around it with mouse parallax (from tamalsen.dev). Touch: gyro tilt.
- The companion glides from the hero to sit beside "About, in short" as you scroll (one fixed canvas), and reappears small as a guide: glances at the section you're reading, waves from the footer.
- Role line cycles with a scramble, an outlined ghost of the previous role behind it.
- Split-line headline reveals; word-by-word statement reveal tied to scroll.
- Custom cursor: dot + ring with difference blending, ring grows on interactive elements; magnetic buttons.
- Nav links roll to a cardinal copy on hover.
- Achievements: counters tick up; two marquees in opposite directions, one filled and one outlined.
- Featured work: first an overview of every featured project as preview tiles (a tile jumps to its panel), then a pinned horizontal scroll of large panels whose details rise in as each slides in; pointer tilt with a moving glare; muted capture of the real product plays; shared-element transition into the case study.
- Research: on the home page, the laser scene (see below) and the publication card, linking to `/research/`. The research page opens by stating what the research is (headline, statement, four facts, a beam drawn across the foot), then plays the laser scene, then the work, the publication and the tools.
- Experience: timeline line fills with a glowing cardinal beam; nodes ignite as it passes; cards slide in.
- Leadership and projects: animated Hairline figures on cards.
- Skills: **the periodic table of skills**. All 60 skills as elements (symbol, number, name, colour by group) in blocks by group that stand on one base line, with the detail card docked beside the table (below it on narrow screens); elements lift toward the pointer; clicking one shows a one-line explanation, a link to its official page and where it was used; group legend filters; the table can re-form into a sphere or helix you drag to turn.
- Footer: giant outlined name in Instrument Serif italic that fills with a flowing cardinal-to-sand gradient as you reach the bottom.
- Page transitions: a cardinal curtain wipes up between routes; project images morph into case-study headers.

## The research laser scene

Pinned for under 2 screens and scrubbed by scroll, so it plays forwards and backwards: a beam (white core, cardinal halo) fires onto a polished **aluminum** target, labelled "Target · Aluminum (Al)"; an impact flash and shockwave ring; the plume is **one glowing red sphere** (fresnel shader, white-hot core cooling to cardinal, gently undulating) that swells from the impact as a dome, with a few slow embers and no spray of sparks; it fades, the scene dims away, and the research card rises in. three.js with UnrealBloomPass. No controls and no physics explanation; the material name is the only label.

## Other scenes

- **HackBama:** scroll drives a car around a cone course (cones in sand and cardinal) while the racing line is drawn behind it as a glowing tube; a HUD counts the lap to 36.8 s, 0 cones, ~10 ms per decision. Captioned as an illustration.
- **Phasora:** a rotating phasor tracing a wave; the pointer sets its speed.
- **LeetCode:** a 10 × 10 grid of the 100 problems; hovering a tile sends a breadth-first wave out from it.
- **BOR Realty:** 689 thumbnails assemble into a wall and sort by category.
- **sofiakamal.art:** a watercolor-bloom shader opens the screenshot from the click point.
- **Research:** a 3D server rack (Cheaha) whose blades slide out with scroll.
- **Project One:** a network that grows from 10 to 20 nodes with scroll.
- **Featured work:** 3D laptop/phone mockups that tilt with the pointer and play the real site (from tamalsen.dev).
- **About:** the journey globe, Moscow → Scottsdale → Birmingham.
- **Skills backdrop:** faint real code snippets drifting behind the periodic table (from tamalsen.dev).

## Hairline

`@lucasmarkes/hairline` (MIT) figures themed with `--hairline-hi: var(--sand)` on `--bg-2` plates, `play: true` until the pointer arrives. Mapping: International Mentor (ISSS) → **globe** (custom, `hairline/globe.js`, drawn with `hairline-create`: the pointer turns it to Moscow, Scottsdale or Birmingham), Micro-Internships → Project One → relay, AIC → hub, Research → cabinet (Cheaha), CS 103 → terminal, Academic Peer Tutor → **tutor** (custom, `hairline/tutor.js`: an open textbook whose pages turn toward the pointer), Phasora → laptop, sofiakamal.art → exploded, ACM → keyboard, BOR Realty → phone on its project, **web** on the Web Developer Intern role (custom, `hairline/web.js`: the WWW globe spinning above a browser window), SAMAC → format, USGA → stack, LeetCode → query. Still to draw with `hairline-create`: a race car on cones (HackBama) and a podium (UAB Ambassador).

## Layout

- Desktop margins `clamp(20px, 6vw, 100px)`; sections 140–200px apart; full-bleed scenes for the hero, work, laser and footer.
- Rounded corners: 14–18px on cards and panels, pills for chips and toggles.
- Navigation: `RM` wordmark left; About, Projects (`/work/`), Experience, Research (`/research/`) links; Résumé at the bottom right of the hero and in the menu. On phones, a visible link strip.
- No contact form, no "hire me", no booking. Email, LinkedIn, GitHub and résumé as plain links.
