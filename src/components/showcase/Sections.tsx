import { Database, Factory, Gauge, Lightbulb, ShieldAlert, Waypoints, Workflow } from "lucide-react";
import { Panel, Reveal, Section, useInView } from "./primitives";

const steps = [
  { name: "Problem", note: "Framed with planners, not with features." },
  { name: "Research", note: "Milestone taxonomies from real carrier event sets." },
  { name: "Risk model", note: "Which events actually predict a miss." },
  { name: "Synthetic data", note: "Seeded generator, reproducible scenarios." },
  { name: "Dashboard", note: "Exposure first, detail on demand." },
  { name: "Simulation", note: "Model made testable by the user." },
  { name: "Testing", note: "Edge cases: grace windows, late feeds, broken seals." },
];

const architecture = [
  "Synthetic data",
  "Shipment generator",
  "Risk engine",
  "Confidence calculator",
  "React state",
  "Visual components",
  "Analytics dashboard",
  "Scenario simulator",
];

export function Process() {
  const { ref, shown } = useInView<HTMLDivElement>(0.2);
  return (
    <Section
      id="process"
      eyebrow="How the thinking developed"
      title="The model came before the interface"
      intro="Each step below closed a question the previous one opened."
    >
      <div ref={ref} className="grid gap-3 md:grid-cols-7">
        {steps.map((s, i) => (
          <div
            key={s.name}
            className="reveal relative"
            data-shown={shown}
            style={{ transitionDelay: `${i * 110}ms` }}
          >
            <Panel className="h-full p-4">
              <span className="font-mono text-[10px] text-teal">0{i + 1}</span>
              <p className="mt-2 text-sm font-medium text-foreground">{s.name}</p>
              <p className="mt-1.5 text-[11px] leading-relaxed text-muted-foreground">{s.note}</p>
            </Panel>
            {i < steps.length - 1 && (
              <span className="absolute top-1/2 -right-2 hidden h-px w-2 bg-border md:block" />
            )}
          </div>
        ))}
      </div>
    </Section>
  );
}

export function Architecture() {
  const { ref, shown } = useInView<HTMLDivElement>(0.15);
  return (
    <Section
      id="architecture"
      eyebrow="Technical architecture"
      title="One deterministic pipeline, top to bottom"
      intro="Data is generated, scored and rendered through a single path — which is what makes the simulator honest: it re-enters the same pipeline."
    >
      <div ref={ref} className="relative mx-auto max-w-xl">
        <span className="absolute top-2 bottom-2 left-[15px] w-px bg-border md:left-1/2" />
        <svg className="absolute top-2 left-[15px] h-[calc(100%-1rem)] w-px md:left-1/2" preserveAspectRatio="none">
          <line
            x1="0.5"
            y1="0"
            x2="0.5"
            y2="100%"
            stroke="var(--teal)"
            strokeWidth="1"
            className="draw-line"
            data-shown={shown}
            style={{ ["--len" as string]: "1200" }}
          />
        </svg>
        <div className="flex flex-col gap-3">
          {architecture.map((node, i) => (
            <div
              key={node}
              className="reveal relative pl-10 md:pl-0"
              data-shown={shown}
              style={{ transitionDelay: `${i * 130}ms` }}
            >
              <span className="absolute top-1/2 left-[11px] size-2 -translate-y-1/2 rounded-full bg-teal ring-4 ring-background md:left-1/2 md:-translate-x-1/2" />
              <Panel
                className={`p-4 md:w-[46%] ${i % 2 === 1 ? "md:ml-auto" : ""}`}
                hover
              >
                <span className="font-mono text-[10px] text-text-faint">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <p className="mt-1 text-sm text-foreground">{node}</p>
              </Panel>
            </div>
          ))}
        </div>
      </div>
    </Section>
  );
}

const stack = [
  { name: "React", note: "Component model" },
  { name: "Tailwind CSS", note: "Design tokens" },
  { name: "Recharts", note: "Analytics charts" },
  { name: "Lucide", note: "Icon system" },
  { name: "JavaScript", note: "Engine logic" },
  { name: "Vite", note: "Build tooling" },
  { name: "Responsive design", note: "Desk to mobile" },
  { name: "Interactive viz", note: "Custom SVG" },
];

export function Stack() {
  return (
    <Section id="stack" eyebrow="Built with" title="A deliberately light front-end stack">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {stack.map((t, i) => (
          <Reveal key={t.name} delay={i * 60}>
            <Panel hover className="h-full p-5">
              <p className="text-sm font-medium text-foreground">{t.name}</p>
              <p className="mt-1 font-mono text-[11px] text-text-faint">{t.note}</p>
            </Panel>
          </Reveal>
        ))}
      </div>
    </Section>
  );
}

const highlights = [
  ["Custom synthetic data generation", "A seeded PRNG produces ~90 shipments and ~550 SKUs deterministically, so every demo run tells the same story."],
  ["Confidence scoring algorithm", "Weighted event deltas with a fixed reference date, grace windows and source-reliability multipliers."],
  ["Dynamic risk engine", "Risk bands derive from thresholds rather than hard-coded labels, so retuning weights changes the whole view."],
  ["Interactive simulation", "Disruptions re-enter the scoring pipeline instead of mutating a display value."],
  ["Reusable React components", "Gauges, custody ladders, KPI cards and panels share one primitive layer."],
  ["Complex state management", "Cross-view selection, filters, weights and thresholds stay in sync without a state library."],
  ["Data visualization", "Recharts for analytics, hand-built SVG where the visual carries meaning."],
  ["Performance considerations", "Memoised aggregates keep large SKU sets responsive on a single render pass."],
];

const phases = [
  {
    icon: Database,
    n: "01",
    title: "Data integration",
    body: "Carrier EDI, terminal operating systems, customs filings, AIS vessel positions and container GPS feeds. The prototype shows the shape of this layer with synthetic data; production would map each source to a canonical event schema.",
  },
  {
    icon: Gauge,
    n: "02",
    title: "Model validation",
    body: "Run the confidence score against historical outcomes: which dips actually preceded a late delivery? Use that feedback to recalibrate weights and retire rules that only look predictive.",
  },
  {
    icon: Factory,
    n: "03",
    title: "Scale",
    body: "Move from in-browser state to event streaming and materialized SKU-level views. At 50k+ SKUs the engine must be incremental, not a full recompute on every update.",
  },
  {
    icon: Workflow,
    n: "04",
    title: "Decision hooks",
    body: "Connect exceptions to ERP allocation rules, customer-alert workflows and expedite-approval thresholds so the score drives action, not just attention.",
  },
];

export function Implementation() {
  return (
    <Section
      id="implementation"
      eyebrow="From prototype to production"
      title="What it would take to make this real"
      intro="The prototype proves the reasoning; production is about data plumbing, validation and connecting the score to operational decisions."
    >
      <div className="grid gap-4 md:grid-cols-2">
        {phases.map((p, i) => (
          <Reveal key={p.title} delay={i * 80}>
            <Panel hover className="h-full p-6">
              <div className="flex items-start gap-4">
                <span className="rounded-xl border border-teal-dim bg-teal/10 p-2.5">
                  <p.icon className="size-4 text-teal" />
                </span>
                <div>
                  <span className="font-mono text-[10px] text-text-faint">{p.n}</span>
                  <h3 className="mt-1 text-base font-medium text-foreground">{p.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{p.body}</p>
                </div>
              </div>
            </Panel>
          </Reveal>
        ))}
      </div>
    </Section>
  );
}

const limitations = [
  {
    icon: ShieldAlert,
    title: "Synthetic data only",
    body: "No real carrier, customer or terminal data. The event patterns are plausible, not proven.",
  },
  {
    icon: Waypoints,
    title: "Rule-based weights",
    body: "Confidence deltas are manually set. They need backtesting against historical miss rates before they can guide real decisions.",
  },
  {
    icon: Lightbulb,
    title: "No cost model yet",
    body: "The score flags risk, but it doesn't yet weigh expedite cost against delay cost or inventory impact.",
  },
];

export function Limitations() {
  return (
    <Section
      id="limitations"
      eyebrow="What this doesn't do yet"
      title="Honest gaps, and what I'd do differently"
      intro="Naming the limitations is part of the consulting mindset. The next iteration would start with a real carrier sample, build a feedback loop, and add a cost-aware recommendation layer."
    >
      <div className="grid gap-4 md:grid-cols-3">
        {limitations.map((l, i) => (
          <Reveal key={l.title} delay={i * 80}>
            <Panel className="h-full p-6">
              <l.icon className="size-5 text-coral" />
              <h3 className="mt-4 text-base font-medium text-foreground">{l.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{l.body}</p>
            </Panel>
          </Reveal>
        ))}
      </div>
    </Section>
  );
}
