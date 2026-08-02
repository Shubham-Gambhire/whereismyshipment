# Where Is My Shipment — Prototype Showcase Page

A single, standalone page at `/` presenting **Where Is My Shipment** as a working prototype: a supply chain visibility concept built to demonstrate digital supply chain thinking, not a shipped product. The prototype app itself is not built, embedded, or redesigned — the page recreates its visual language in miniature, animated set-pieces.

Framing throughout: consulting mindset first. Each section leads with the operational problem and the reasoning behind the model, with the interface as evidence of the thinking rather than the headline. Language is "prototype", "concept", "model" — never "case study" or "product launch".

## Buttons

No "Live Demo", and no closing CTA section. A single quiet pair sits in the hero only: **View on GitHub** and **Contact** (mailto). Both start as placeholders (`#` and `mailto:you@example.com`) — send me the repo URL and email and I'll drop them in.

## Visual system

Ported straight from the prototype's tokens so the page matches it exactly:

- Background `#0A1418`, panels `#0F1F26` / `#152C35`, borders `#1E3841`
- Teal `#34D8C3` (primary), amber `#EFB13C` (warning), coral `#EA5A4A` (danger)
- Text `#E8F1F2`, muted `#7F9BA3`, faint `#4E6870`
- Space Grotesk (display), Inter (body), IBM Plex Mono (data/labels)
- Generous whitespace, soft shadows, 12–20px radii, subtle teal glow gradients, restrained glass panels

## Sections

1. **Hero** — small "Prototype" label, title *Where Is My Shipment*, one-line description (AI-assisted logistics visibility prototype: confidence scoring, chain of custody, risk analytics, scenario simulation), the two quiet links, and a large browser-chrome mockup containing a live miniature of the dashboard: KPI cards counting up, a confidence gauge sweeping to its value, bars drawing in, a shipment row ticker. Slow parallax on scroll.
2. **The operational problem** — framed as a consultant would: four fractured cards (fragmented visibility across carriers, late disruption detection, SKU-level traceability gaps, reactive decision-making), each with the cost it creates.
3. **The approach** — five connected capability tiles showing how the prototype answers each problem: shipment monitoring, confidence scoring, risk analytics, chain of custody, simulation. Visual, minimal copy.
4. **Prototype walkthrough** — one framed viewport that cross-fades between five mock screens (Dashboard → Exceptions → Chain of Custody → Simulator → Settings), driven by scroll position with a step rail on the side. Each mock is a simplified, non-interactive recreation, not a screenshot.
5. **Signature concepts** — premium cards. Chain of Custody gets a full-width feature with an animated drawing timeline (booking → customs → delay → vessel → warehouse → delivery). Confidence Engine gets an animated ladder stepping 100% → 92% → 81% → 55% with the causing event on each rung, and a note on why each event carries the weight it does. What-if Simulator shows disruption chips being added on a loop with the score re-computing.
6. **How the thinking developed** — 7-node flow: Problem → Research → Risk Model → Synthetic Data → Dashboard → Simulation → Testing, drawing in on scroll, each node with one line on the decision made there.
7. **Technical architecture** — minimal 8-node vertical diagram with a flowing connector line: Synthetic Data → Shipment Generator → Risk Engine → Confidence Calculator → React State → Visual Components → Analytics Dashboard → Scenario Simulator.
8. **Built with** — icon cards: React, Tailwind, Recharts, Lucide, JavaScript, Vite, Responsive Design, Interactive Visualizations.
9. **What makes this prototype interesting** — eight cards, one short line each (synthetic data generation, confidence algorithm, risk engine, simulations, reusable components, state management, data viz, performance). This closes the page; no CTA block after it.

## Motion

Fade/slide-up on enter with stagger, number counters, gauge fill, SVG path-draw for timelines and diagrams, hover elevation on cards, light hero parallax. All triggered once via an intersection-observer hook, and all reduced to simple fades when the viewport is small or the user prefers reduced motion.

## Technical notes

- TanStack Start; page replaces `src/routes/index.tsx`, with sections as components under `src/components/showcase/`.
- Prototype palette and fonts added as semantic tokens in `src/styles.css` (`@theme inline`) — no hardcoded colors in components. Fonts loaded via `<link>` in `__root.tsx`.
- Route-level `head()` with title/description/og/twitter naming the prototype.
- Recharts only if a chart genuinely needs it; the mini-visuals are hand-built SVG/CSS to stay light.
- Responsive: single column with simplified diagrams under 768px.
