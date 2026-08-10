# Where Is My Shipment

*A probabilistic SKU location framework for ocean freight visibility.*

**Live prototype:** [whereismyshipment.lovable.app](https://whereismyshipment.lovable.app)  
**Project development report:** [Read online ↗](https://whereismyshipment.lovable.app/project-report)

*(The report documents the problem, design decisions, bugs found and fixed, and what is real versus simulated.)*

---

## What this is

A working prototype that answers a practical supply-chain question: **once a shipment is on the water, where is a specific SKU right now, and how confident can we be about that answer?**

The idea came from an observation during an internship at a shipping company: container-level tracking tells you where the box is, but not whether your specific SKU is still inside it, still sealed, or still on schedule. SKU-level RFID fixes that, but it is expensive to deploy at scale. This prototype takes a different approach: instead of tracking every unit physically, it infers a **confidence score** for each SKU from the logistics events that already happen around it — packing scans, container seals, gate movements, customs holds, and so on.

The result is a decision-support view that turns a flat status update like *“Container ABC is in Singapore”* into something more actionable: *“SKU 4589 has a 94% probability of being inside Container ABC and is expected in Rotterdam in 6 days.”*

This is intentionally scoped to **ocean freight only**. It reflects the specific environment the problem was observed in, not an oversight.

---

## How it works

Every SKU starts at 100% confidence the moment it is verified packed and sealed inside its container. From there, the score only moves when something logistically meaningful happens.

The confidence engine is deliberately **rule-based and transparent** in version 1. Every score change traces back to a named event with a visible weight, so you can always ask “why did this drop?” and get a concrete answer — for example, *Customs Inspection Flagged, −16 points* — instead of an opaque prediction. The prototype also includes an illustrative **Calibrated** mode that shows what a future Bayesian or ML recalibration might look like, clearly labeled as hypothetical since no real historical outcome data exists yet.

Data-quality safeguards are built in: a grace window before a missing scan is counted, automatic self-healing when a SKU reappears later, conflict detection between disagreeing systems, timestamp-order anomaly detection, and per-source reliability weighting.

---

## The seven views

| View | What it does |
| --- | --- |
| **Overview** | Fleet-wide health at a glance: active shipments, average confidence, disrupted containers, critical SKUs, high-risk waters, and late shipments. |
| **SKU** | Look up one SKU and see its full context: confidence, identifiers, route, ETA, SLA tier, urgency, shelf life, and a **custody ladder** timeline of every event in its history. |
| **Exceptions** | A prioritized worklist, not a flat list. Filter and rank by risk tier, urgency, SLA, perishability, value, lateness, and a custom list, with a composite Priority Score. |
| **Simulator** | Test hypothetical disruptions or recoveries against a real SKU without touching live data. Queue multiple events, review the combined reasoning, and run. |
| **Model** | Tune the whole engine: risk thresholds, event weights, route-risk corridors, compliance watchlist, and data-quality controls. Live preview shows the effect instantly. |
| **Feeds** | An illustrative view of what a live AIS vessel feed and ERP reconciliation sync would look like once connected. Clearly labeled as simulated. |
| **Logic** | Plain-language explanation of the problem, the solution, real milestone terminology, a glossary, and an honest breakdown of what is real logic versus what is simulated. |

---

## Why it feels human

The interface was rebuilt with a control-tower mindset rather than a generic dashboard layout. Information is dense, labels are direct, and the data is intentionally imperfect: timestamps jitter, some fields are missing, and stale feeds are flagged. Operator notes give a short, contextual assessment for each exception so the tool reads like someone is reviewing the shipment with you, not just printing numbers.

The goal was to make it usable for a recruiter, a supply-chain leader, a student, or an industry expert without dumbing anything down.

---

## Technology stack

- **Framework:** TanStack Start (React 19) with TanStack Router and TanStack Query
- **Build tool:** Vite
- **Styling:** Tailwind CSS v4
- **UI components:** shadcn/ui (Radix primitives)
- **Charts:** Recharts
- **Forms & validation:** React Hook Form + Zod
- **Dates:** date-fns
- **Language:** TypeScript
- **Package manager:** Bun

---

## Running it locally

```bash
git clone https://github.com/Shubham-Gambhire/whereismyshipment.git
cd whereismyshipment
bun install
bun run dev
```

Then open `http://localhost:8080`.

---

## What is real vs. simulated

This is a prototype, and the project is explicit about its boundaries:

- **Real working logic:** the confidence engine, the synthetic data generator, the priority scoring, the data-quality safeguards, the custody ladder, the route map, and the simulator math.
- **Simulated stand-ins:** the AIS vessel feed, the ERP reconciliation, and the Calibrated-mode weights. These are labeled as illustrative, and the Logic tab explains what a production version would need for each.

See the [project development report](https://whereismyshipment.lovable.app/project-report) for the full honest breakdown.

---

## Roadmap (intentionally deferred)

1. Replace the illustrative Calibrated-mode multipliers with weights genuinely tuned against real historical outcome data.
2. Build real ERP and AIS integrations behind a backend proxy layer.
3. Add production-dependency and substitutability as prioritization dimensions.
4. Introduce cost / ROI framing: value at risk, expediting cost avoided.
5. Evaluate whether the confidence-engine pattern generalizes to air, truck, and rail.

---

## Built by

**Shubham Gambhire** — [GitHub](https://github.com/Shubham-Gambhire/whereismyshipment)

This project was developed with [Lovable](https://lovable.dev), an AI pair-programming tool, and continued independently from the original concept into this deployed repository.
