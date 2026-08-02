import { useEffect, useRef, useState } from "react";
import { BrowserFrame } from "./BrowserFrame";
import { Section } from "./primitives";
import {
  CustodyMock,
  DashboardMock,
  ExceptionsMock,
  SettingsMock,
  SimulatorMock,
} from "./mocks";

const screens = [
  {
    key: "dashboard",
    name: "Dashboard",
    note: "Fleet-wide KPIs, confidence by category, shipments in transit.",
    render: () => <DashboardMock />,
  },
  {
    key: "exceptions",
    name: "Exceptions",
    note: "Only the SKUs whose score dropped below the acceptable band.",
    render: () => <ExceptionsMock />,
  },
  {
    key: "custody",
    name: "Chain of Custody",
    note: "The milestone ladder behind a single container, event by event.",
    render: () => <CustodyMock />,
  },
  {
    key: "simulator",
    name: "Simulator",
    note: "Inject disruptions and re-score before they happen.",
    render: () => <SimulatorMock />,
  },
  {
    key: "settings",
    name: "Settings",
    note: "Signal weights, thresholds and source reliability are all tunable.",
    render: () => <SettingsMock />,
  },
];

export function Walkthrough() {
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const [active, setActive] = useState(0);

  useEffect(() => {
    const onScroll = () => {
      const el = wrapRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const total = rect.height - window.innerHeight;
      if (total <= 0) return;
      const progress = Math.min(1, Math.max(0, -rect.top / total));
      setActive(Math.min(screens.length - 1, Math.floor(progress * screens.length)));
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const current = screens[active] ?? screens[0]!;

  return (
    <Section
      id="walkthrough"
      eyebrow="Prototype walkthrough"
      title="Five screens, one line of reasoning"
      intro="Scroll to move through the prototype. Each screen narrows the question: what is moving, what is at risk, why, what if, and what should the model believe."
    >
      <div ref={wrapRef} className="relative h-[280vh] md:h-[340vh]">
        <div className="sticky top-0 flex min-h-screen flex-col justify-center gap-6 py-10 md:flex-row md:items-center md:gap-10">
          <ol className="flex shrink-0 gap-2 overflow-x-auto md:w-52 md:flex-col md:gap-1 md:overflow-visible">
            {screens.map((s, i) => (
              <li key={s.key}>
                <button
                  type="button"
                  onClick={() =>
                    wrapRef.current?.scrollIntoView({ block: "start", behavior: "smooth" })
                  }
                  className={`flex w-full items-center gap-3 rounded-lg border px-3 py-2 text-left transition-colors ${
                    i === active
                      ? "border-teal-dim bg-teal/10 text-teal"
                      : "border-transparent text-text-faint hover:text-muted-foreground"
                  }`}
                >
                  <span className="font-mono text-[10px]">0{i + 1}</span>
                  <span className="text-xs whitespace-nowrap">{s.name}</span>
                </button>
              </li>
            ))}
          </ol>

          <div className="min-w-0 flex-1">
            <BrowserFrame url={`where-is-my-shipment.app/${current.key}`}>
              <div className="relative min-h-[300px] md:min-h-[420px]">
                {screens.map((s, i) => (
                  <div
                    key={s.key}
                    aria-hidden={i !== active}
                    className="transition-[opacity,transform] duration-500"
                    style={{
                      opacity: i === active ? 1 : 0,
                      transform: i === active ? "none" : "translateY(10px)",
                      position: i === active ? "relative" : "absolute",
                      inset: i === active ? undefined : 0,
                      pointerEvents: i === active ? "auto" : "none",
                    }}
                  >
                    {s.render()}
                  </div>
                ))}
              </div>
            </BrowserFrame>
            <p className="mt-4 font-mono text-[11px] text-text-faint">{current.note}</p>
          </div>
        </div>
      </div>
    </Section>
  );
}
