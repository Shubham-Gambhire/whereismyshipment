import { Panel, Reveal, Section, useInView } from "./primitives";
import { CustodyMock, SimulatorMock } from "./mocks";

const ladder = [
  { conf: 100, event: "Booking confirmed", why: "Full trust: source is the contract itself." },
  { conf: 92, event: "Customs hold", why: "Dwell beyond the grace window signals a real delay." },
  { conf: 81, event: "Missing scan", why: "A break in scan continuity means the position is inferred." },
  { conf: 55, event: "Seal broken", why: "Integrity events dominate — quantity can no longer be assumed." },
];

function ConfidenceLadder() {
  const { ref, shown } = useInView<HTMLDivElement>(0.3);
  return (
    <div ref={ref} className="flex flex-col gap-3">
      {ladder.map((step, i) => {
        const tone = step.conf >= 92 ? "teal" : step.conf >= 70 ? "amber" : "coral";
        return (
          <div
            key={step.event}
            className="reveal"
            data-shown={shown}
            style={{ transitionDelay: `${i * 220}ms` }}
          >
            <div className="flex items-center gap-4">
              <span
                className={`w-14 shrink-0 font-display text-xl ${
                  tone === "coral" ? "text-coral" : tone === "amber" ? "text-amber" : "text-teal"
                }`}
              >
                {step.conf}%
              </span>
              <div className="min-w-0 flex-1">
                <div className="h-1.5 overflow-hidden rounded-full bg-border-soft">
                  <div
                    className={`h-full rounded-full ${
                      tone === "coral" ? "bg-coral" : tone === "amber" ? "bg-amber" : "bg-teal"
                    }`}
                    style={{
                      width: shown ? `${step.conf}%` : 0,
                      transition: `width 1.1s cubic-bezier(0.16,1,0.3,1) ${i * 220}ms`,
                    }}
                  />
                </div>
                <p className="mt-2 text-sm text-foreground">{step.event}</p>
                <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{step.why}</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function Concepts() {
  return (
    <Section
      id="concepts"
      eyebrow="Signature concepts"
      title="The three ideas the prototype exists to test"
      intro="Everything else in the interface is scaffolding around these."
    >
      <div className="flex flex-col gap-4">
        <Reveal>
          <Panel className="overflow-hidden p-6 md:p-10">
            <div className="grid gap-8 md:grid-cols-2 md:items-center">
              <div>
                <p className="font-mono text-[11px] tracking-[0.2em] text-teal uppercase">01</p>
                <h3 className="mt-3 text-2xl font-semibold text-foreground">Chain of custody</h3>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                  Rather than a status string, every container carries its full milestone ladder —
                  booking, customs, delay, vessel movement, warehouse, delivery. Each event is stored
                  with its own confidence delta, so the timeline is both a narrative and an audit
                  trail of the score.
                </p>
                <p className="mt-4 font-mono text-[11px] text-text-faint">
                  Reconstructed from event history, never overwritten
                </p>
              </div>
              <CustodyMock />
            </div>
          </Panel>
        </Reveal>

        <div className="grid gap-4 md:grid-cols-2">
          <Reveal delay={80}>
            <Panel hover className="h-full p-6 md:p-8">
              <p className="font-mono text-[11px] tracking-[0.2em] text-teal uppercase">02</p>
              <h3 className="mt-3 text-xl font-semibold text-foreground">Confidence engine</h3>
              <p className="mt-3 mb-6 text-sm leading-relaxed text-muted-foreground">
                Confidence starts at 100 and is spent by evidence. The weighting is the opinionated
                part: integrity beats timeliness, and an inferred position is worth less than an
                observed one.
              </p>
              <ConfidenceLadder />
            </Panel>
          </Reveal>

          <Reveal delay={160}>
            <Panel hover className="flex h-full flex-col p-6 md:p-8">
              <p className="font-mono text-[11px] tracking-[0.2em] text-teal uppercase">03</p>
              <h3 className="mt-3 text-xl font-semibold text-foreground">What-if simulator</h3>
              <p className="mt-3 mb-6 text-sm leading-relaxed text-muted-foreground">
                Disruptions can be layered onto a live shipment — weather delay, customs hold,
                missing scan — and the same engine re-scores it. It turns the model into a planning
                tool rather than a reporting one.
              </p>
              <div className="mt-auto">
                <SimulatorMock />
              </div>
            </Panel>
          </Reveal>
        </div>
      </div>
    </Section>
  );
}
