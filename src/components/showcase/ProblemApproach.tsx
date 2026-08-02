import {
  Activity,
  Boxes,
  EyeOff,
  GitBranch,
  Radar,
  Rewind,
  Route,
  ScanLine,
  ShieldQuestion,
  SlidersHorizontal,
} from "lucide-react";
import { Panel, Reveal, Section } from "./primitives";

const problems = [
  {
    icon: EyeOff,
    title: "Fragmented visibility",
    body: "Carrier portals, EDI feeds and forwarder emails each hold a partial truth. Nobody owns the merged picture.",
    cost: "Hours per exception spent reconciling sources",
  },
  {
    icon: Radar,
    title: "Late disruption detection",
    body: "A customs hold or a missed gate scan surfaces days later, once the ETA has already slipped.",
    cost: "Mitigation window lost before anyone reacts",
  },
  {
    icon: ScanLine,
    title: "No SKU-level traceability",
    body: "Tracking stops at the container. Which purchase order, which SKU, which customer is actually exposed?",
    cost: "Allocation decisions made on guesswork",
  },
  {
    icon: ShieldQuestion,
    title: "Reactive decision-making",
    body: "Teams answer 'where is it' instead of 'what will go wrong, and what should we do about it'.",
    cost: "Expedite spend that could have been planned",
  },
];

const approach = [
  {
    icon: Boxes,
    title: "Shipment monitoring",
    body: "One merged view across vessels, containers and SKUs, with lateness and route exposure computed, not reported.",
  },
  {
    icon: Activity,
    title: "Confidence scoring",
    body: "Every SKU carries a single 0–100 score derived from event history and source reliability.",
  },
  {
    icon: Route,
    title: "Risk analytics",
    body: "Exposure aggregated by category, lane and high-risk waters so attention goes where the value is.",
  },
  {
    icon: GitBranch,
    title: "Chain of custody",
    body: "The full milestone ladder is reconstructed, with each event's contribution to the score made explicit.",
  },
  {
    icon: SlidersHorizontal,
    title: "Scenario simulation",
    body: "Inject disruptions and watch the score re-compute before the disruption actually happens.",
  },
];

export function ProblemSection() {
  return (
    <Section
      id="problem"
      eyebrow="The operational problem"
      title="Visibility is not the same as knowing what happens next"
      intro="Most shipment-tracking tools answer a location question. Planners are asking a risk question. The gap between the two is where the cost sits."
    >
      <div className="grid gap-4 md:grid-cols-2">
        {problems.map((p, i) => (
          <Reveal key={p.title} delay={i * 90}>
            <Panel hover className="h-full p-6">
              <div className="flex items-start gap-4">
                <span className="rounded-xl border border-coral-dim bg-coral/10 p-2.5">
                  <p.icon className="size-4 text-coral" />
                </span>
                <div>
                  <h3 className="text-base font-medium text-foreground">{p.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{p.body}</p>
                  <p className="mt-4 font-mono text-[11px] text-text-faint">{p.cost}</p>
                </div>
              </div>
            </Panel>
          </Reveal>
        ))}
      </div>
    </Section>
  );
}

export function ApproachSection() {
  return (
    <Section
      id="approach"
      eyebrow="The approach"
      title="Score the shipment, not just track it"
      intro="Five connected capabilities. Each one exists to close one of the gaps above, and each feeds the next."
    >
      <div className="grid gap-4 md:grid-cols-3">
        {approach.map((a, i) => (
          <Reveal key={a.title} delay={i * 80} className={i === 0 ? "md:col-span-2" : ""}>
            <Panel hover className="relative h-full overflow-hidden p-6">
              <span className="absolute top-5 right-5 font-mono text-[11px] text-text-faint">
                0{i + 1}
              </span>
              <a.icon className="size-5 text-teal" />
              <h3 className="mt-4 text-base font-medium text-foreground">{a.title}</h3>
              <p className="mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">{a.body}</p>
            </Panel>
          </Reveal>
        ))}
        <Reveal delay={400}>
          <Panel className="flex h-full items-center gap-3 border-dashed p-6">
            <Rewind className="size-4 shrink-0 text-teal" />
            <p className="text-sm leading-relaxed text-muted-foreground">
              Every score is explainable backwards — you can always see which event cost the
              confidence.
            </p>
          </Panel>
        </Reveal>
      </div>
    </Section>
  );
}
