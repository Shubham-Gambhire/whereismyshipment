# Supply Chain Intelligence — Portfolio Case Study Page

A single, standalone case-study page at `/` that presents the Supply Chain Intelligence Dashboard as a polished product story. The dashboard app itself is not built, embedded, or redesigned — the page recreates its visual language in miniature, animated set-pieces.

## Buttons

No "Live Demo". Every CTA row is: **View on GitHub** and **Contact Me** (mailto). Both start as placeholders (`#` and `mailto:you@example.com`) — send me the repo URL and email and I'll drop them in.

## Visual system

Ported straight from the app's tokens so the page matches it exactly:

- Background `#0A1418`, panels `#0F1F26` / `#152C35`, borders `#1E3841`
- Teal `#34D8C3` (primary), amber `#EFB13C` (warning), coral `#EA5A4A` (danger)
- Text `#E8F1F2`, muted `#7F9BA3`, faint `#4E6870`
- Space Grotesk (display), Inter (body), IBM Plex Mono (data/labels)
- Generous whitespace, soft shadows, 12–20px radii, subtle teal glow gradients, restrained glass panels

## Sections

1. **Hero** — title, one-line description, two CTAs, and a large browser-chrome mockup containing a live miniature of the dashboard: KPI cards counting up, a confidence gauge sweeping to its value, bars drawing in, a shipment row ticker. Slow parallax on scroll.
2. **Problem / Solution** — two contrasting panels. Problem as four fractured cards (fragmented visibility, delayed detection, SKU tracking, reactive decisions); solution as five connected capability tiles. Visual, minimal copy.
3. **Product walkthrough** — one framed viewport that cross-fades between five mock screens (Dashboard → Exceptions → Chain of Custody → Simulator → Settings), driven by scroll position with a step rail on the side. Each mock is a simplified, non-interactive recreation, not a screenshot.
4. **Feature showcase** — premium cards. Chain of Custody gets a full-width feature with an animated drawing timeline (booking → customs → delay → vessel → warehouse → delivery). Confidence Engine gets an animated ladder stepping 100% → 92% → 81% → 55% with the causing event on each rung. What-if Simulator shows disruption chips being "added" on a loop with the gauge re-scoring.
5. **Design thinking** — horizontal (vertical on mobile) 7-node flow: Problem → Research → Risk Model → Synthetic Data → Dashboard → Simulation → Testing, drawing in on scroll.
6. **Technical architecture** — minimal 8-node vertical diagram with a flowing connector line: Synthetic Data → Shipment Generator → Risk Engine → Confidence Calculator → React State → Visual Components → Analytics Dashboard → Scenario Simulator.
7. **Tech stack** — icon cards: React, Tailwind, Recharts, Lucide, JavaScript, Vite, Responsive Design, Interactive Visualizations.
8. **Engineering highlights** — "What makes this project technically interesting?" — eight cards with a short line each (synthetic data generation, confidence algorithm, risk engine, simulations, reusable components, state management, data viz, performance).
9. **Final CTA** — "Interested in this project?" with GitHub + Contact.

## Motion

Fade/slide-up on enter with stagger, number counters, gauge fill, SVG path-draw for timelines and diagrams, hover elevation on cards, light hero parallax. All triggered once via an intersection-observer hook, and all reduced to simple fades when the viewport is small or the user prefers reduced motion.

## Technical notes

- TanStack Start; page replaces `src/routes/index.tsx`, with sections as components under `src/components/case-study/`.
- App palette and fonts added as semantic tokens in `src/styles.css` (`@theme inline`) — no hardcoded colors in components. Fonts loaded via `<link>` in `__root.tsx`.
- Route-level `head()` with case-study-specific title, description, og/twitter tags.
- Recharts only if a chart genuinely needs it; the mini-visuals are hand-built SVG/CSS to stay light.
- Responsive: single column with simplified diagrams under 768px.
