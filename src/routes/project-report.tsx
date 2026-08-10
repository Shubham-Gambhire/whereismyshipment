import { createFileRoute, Link } from "@tanstack/react-router";
import { Anchor, ArrowLeft, Download, ExternalLink } from "lucide-react";

const title = "Project Report | Where Is My Shipment";
const description =
  "Development report for Where Is My Shipment, a probabilistic SKU location framework for ocean freight visibility.";

const phases = [
  ["Initial prototype", "Built the synthetic shipment model, weighted confidence engine, fleet overview, SKU custody ladder, and exception worklist."],
  ["Feature expansion", "Added explainability, disruption simulation, model comparison, and illustrative AIS and ERP feed views."],
  ["Audit and correction", "Measured generated outputs, reviewed the scoring logic, removed dead code, and fixed responsiveness and navigation issues."],
  ["Tunability", "Made thresholds, event weights, source reliability, grace windows, and model selection visible and adjustable."],
  ["Risk and compliance", "Added maritime corridor risk and a user-owned compliance watchlist without presenting the prototype as a legal sanctions authority."],
  ["Data quality", "Added stale-feed handling, missing-scan grace periods, recovery events, source conflicts, and timestamp anomaly detection."],
  ["Operational prioritization", "Combined confidence, urgency, lateness, value, shelf life, and SLA context into an explainable exception priority score."],
  ["Terminology and UX", "Aligned milestones with ocean-freight language and refined the simulator, mobile SKU selection, legends, and operator guidance."],
];

const features = [
  ["Overview", "Fleet-wide health, live route context, confidence trends, recent events, priority exceptions, and operator notes."],
  ["SKU", "Search every SKU and inspect identifiers, route, ETA, confidence evidence, and the full custody ladder."],
  ["Exceptions", "Filter and rank the worklist by risk, urgency, SLA, perishability, value, lateness, and priority."],
  ["Simulator", "Apply hypothetical disruptions or recoveries to a selected SKU and review the combined scoring impact."],
  ["Model", "Adjust thresholds, weights, route risks, watchlists, data-quality controls, and the scoring mode."],
  ["Feeds", "Demonstrate how AIS vessel positions and ERP reconciliation could enter a production workflow."],
  ["Logic", "Explain the assumptions, event weights, terminology, limitations, and real-versus-simulated boundary."],
];

export const Route = createFileRoute("/project-report")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary" },
      { name: "twitter:title", content: title },
      { name: "twitter:description", content: description },
    ],
  }),
  component: ProjectReport,
});

function ProjectReport() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-20 border-b border-border-soft bg-background/95 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <Link to="/" className="inline-flex items-center gap-2 font-mono text-xs text-muted-foreground transition-colors hover:text-foreground">
            <ArrowLeft size={15} aria-hidden="true" /> Prototype
          </Link>
          <a href="/project-document" download className="inline-flex items-center gap-2 border border-border px-3 py-2 font-mono text-[11px] text-teal transition-colors hover:bg-panel">
            <Download size={14} aria-hidden="true" /> Download original PDF
          </a>
        </div>
      </header>

      <article className="mx-auto max-w-5xl px-4 pb-24 pt-14 sm:px-6 sm:pt-20">
        <div className="mb-16 border-b border-border-soft pb-14">
          <Anchor className="mb-7 text-teal" size={38} strokeWidth={1.5} aria-hidden="true" />
          <p className="mb-4 font-mono text-xs uppercase text-teal">Project development report · August 2026</p>
          <h1 className="max-w-4xl font-sans text-4xl font-semibold leading-tight sm:text-6xl">Where Is My Shipment</h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-muted-foreground sm:text-xl">A probabilistic SKU location framework for ocean freight visibility.</p>
          <div className="mt-8 flex flex-wrap gap-x-6 gap-y-3 font-mono text-xs">
            <span className="text-text-faint">Digital supply chain portfolio project</span>
            <a href="https://github.com/Shubham-Gambhire/whereismyshipment" target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-muted-foreground hover:text-teal">
              GitHub <ExternalLink size={13} aria-hidden="true" />
            </a>
          </div>
        </div>

        <ReportSection number="01" title="The problem">
          <p>This project began with something observed first-hand during an internship at a shipping company: once a shipment was on the water, it was genuinely difficult to know where a specific SKU actually was during ocean transit.</p>
          <p>SKU-level RFID can answer that question, but tags, labeling labor, and reader infrastructure become expensive at scale. Container tracking has the opposite limitation. It locates the box, but does not establish whether a specific SKU is still inside, sealed, or on schedule.</p>
          <p>The prototype addresses the gap between those options. It infers a confidence level from logistics events that already happen around the SKU and container, giving planners a quantified and explainable answer rather than a guess. Ocean freight is a deliberate scope boundary because that is where the original problem was observed.</p>
        </ReportSection>

        <ReportSection number="02" title="Vision and core approach">
          <p>Each SKU begins at 100% confidence when packing and sealing are verified. The score changes only when a logistically meaningful event occurs, such as a missing scan, customs inspection, GPS anomaly, or broken seal.</p>
          <blockquote className="my-8 border-l-2 border-teal pl-5 text-xl leading-8 text-foreground">“SKU 4589 has a 94% probability of being inside Container ABC and is expected in Rotterdam in six days.”</blockquote>
          <p>The first version is intentionally rule-based and transparent. Every movement traces back to a named event and visible weight. A planner can ask why a score dropped and receive a concrete explanation. The calibrated mode is illustrative of a future evidence-backed model, not presented as machine learning trained on historical outcomes.</p>
        </ReportSection>

        <ReportSection number="03" title="Development progression">
          <div className="mt-8 grid gap-px border border-border-soft bg-border-soft sm:grid-cols-2">
            {phases.map(([name, copy], index) => (
              <div key={name} className="bg-background p-5 sm:p-6">
                <p className="mb-3 font-mono text-[10px] text-teal">PHASE {String(index + 1).padStart(2, "0")}</p>
                <h3 className="mb-2 font-sans text-base font-semibold">{name}</h3>
                <p className="text-sm leading-6 text-muted-foreground">{copy}</p>
              </div>
            ))}
          </div>
        </ReportSection>

        <ReportSection number="04" title="Feature architecture">
          <div className="mt-8 divide-y divide-border-soft border-y border-border-soft">
            {features.map(([name, copy]) => (
              <div key={name} className="grid gap-2 py-5 sm:grid-cols-[150px_1fr] sm:gap-8">
                <h3 className="font-mono text-xs uppercase text-teal">{name}</h3>
                <p className="text-sm leading-6 text-muted-foreground">{copy}</p>
              </div>
            ))}
          </div>
        </ReportSection>

        <ReportSection number="05" title="Confidence and prioritization">
          <p>Event severity follows the strength of physical evidence. A routine delay has a small effect because it says little about custody. A customs inspection is stronger because the container may have been opened and handled. A broken seal carries the largest penalty because it is direct evidence of unauthorized access.</p>
          <p>The engine also accounts for source reliability and operational data quality. Missing scans receive a grace window, later verified events can heal earlier uncertainty, conflicting sources are surfaced, and timestamp order is checked.</p>
          <p>Confidence alone does not determine which SKU an operator should handle first. The exception worklist combines confidence with urgency, lateness, SLA tier, value, shelf life, and user watchlists. The result remains explainable rather than hiding prioritization behind an opaque score.</p>
        </ReportSection>

        <ReportSection number="06" title="Real-world grounding">
          <p>The custody sequence uses ocean-freight milestones including booking confirmation, stuffing, VGM submission, sealing, origin gate-in, export clearance, stowage, bill of lading issuance, vessel departure and arrival, discharge, import clearance, destination gate-out, warehouse receipt, and delivery.</p>
          <p>Route context includes named maritime corridors such as the Strait of Hormuz, Gulf of Aden, Strait of Malacca, and Red Sea. These are simplified prototype rules. A production system would derive exposure from AIS waypoints and a maintained advisory source.</p>
          <p>Compliance is represented as a user-editable watchlist rather than a hardcoded sanctions list. That keeps ownership with the appropriate compliance team and avoids presenting a prototype flag as a legal determination.</p>
        </ReportSection>

        <ReportSection number="07" title="What is real and what is simulated">
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <StatusBlock label="Working prototype logic" items={["Confidence engine and event weights", "Synthetic shipment and SKU generator", "Priority scoring and exception filters", "Custody ladder and route map", "Data-quality safeguards", "What-if simulator calculations"]} />
            <StatusBlock label="Illustrative stand-ins" items={["AIS vessel-position feed", "ERP reconciliation sync", "Calibrated-mode multipliers", "Live weather and compliance services", "Production authentication and persistence"]} />
          </div>
        </ReportSection>

        <ReportSection number="08" title="Testing and verification">
          <p>The prototype was reviewed through code inspection, direct execution of the data generator, output measurement, interaction testing, mobile viewport checks, and iterative logic audits. Measured output replaced assumptions whenever the generated distribution or scoring behavior could be checked directly.</p>
          <p>Important corrections included generated-data distributions, duplicate or unreachable UI, overflowing navigation, simulator selection behavior, mobile layouts, scoring explanations, stale-feed visibility, and the placement of model controls.</p>
        </ReportSection>

        <ReportSection number="09" title="Roadmap">
          <ol className="mt-6 space-y-4 text-muted-foreground">
            <li>1. Calibrate event weights against historical loss and recovery outcomes.</li>
            <li>2. Connect real AIS, ERP, marine-weather, and compliance services through secure backend integrations.</li>
            <li>3. Add production dependency, substitutability, and downstream operational impact.</li>
            <li>4. Quantify value at risk, expediting cost, and potential cost avoided.</li>
            <li>5. Test whether the framework generalizes responsibly to air, truck, and rail.</li>
          </ol>
        </ReportSection>

        <section className="mt-20 border-t border-border-soft pt-10">
          <p className="font-mono text-[10px] uppercase text-text-faint">Conclusion</p>
          <p className="mt-4 max-w-3xl text-xl leading-8">Where Is My Shipment is not presented as a finished commercial platform. It is a working decision-support prototype that demonstrates a supply-chain problem, a transparent probabilistic response, and the judgment required to distinguish operational logic from simulated infrastructure.</p>
          <div className="mt-9 flex flex-wrap gap-3">
            <Link to="/" className="inline-flex items-center gap-2 bg-teal px-4 py-3 font-mono text-xs text-primary-foreground transition-opacity hover:opacity-90">Open prototype <ExternalLink size={14} aria-hidden="true" /></Link>
            <a href="/project-document" download className="inline-flex items-center gap-2 border border-border px-4 py-3 font-mono text-xs text-muted-foreground transition-colors hover:text-foreground"><Download size={14} aria-hidden="true" /> Download PDF</a>
          </div>
        </section>
      </article>
    </main>
  );
}

function ReportSection({ number, title, children }: { number: string; title: string; children: React.ReactNode }) {
  return (
    <section className="border-b border-border-soft py-12 sm:py-16">
      <div className="grid gap-6 md:grid-cols-[120px_1fr] md:gap-10">
        <p className="font-mono text-xs text-text-faint">{number}</p>
        <div>
          <h2 className="mb-7 font-sans text-2xl font-semibold sm:text-3xl">{title}</h2>
          <div className="space-y-5 text-base leading-7 text-muted-foreground">{children}</div>
        </div>
      </div>
    </section>
  );
}

function StatusBlock({ label, items }: { label: string; items: string[] }) {
  return (
    <div className="border border-border-soft bg-panel p-5 sm:p-6">
      <h3 className="mb-5 font-mono text-xs uppercase text-teal">{label}</h3>
      <ul className="space-y-3 text-sm text-muted-foreground">
        {items.map((item) => <li key={item} className="flex gap-3"><span className="text-teal">•</span><span>{item}</span></li>)}
      </ul>
    </div>
  );
}