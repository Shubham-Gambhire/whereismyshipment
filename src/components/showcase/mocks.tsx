import { AlertTriangle, Clock, Container, Gauge as GaugeIcon, MapPinned, Ship } from "lucide-react";
import { Counter, Gauge, useInView } from "./primitives";

const kpis = [
  { label: "Active Shipments", value: 92, icon: Ship, tone: "text-foreground" },
  { label: "Avg. Confidence", value: 78.4, decimals: 1, suffix: "%", icon: GaugeIcon, tone: "text-teal" },
  { label: "Disrupted Containers", value: 37, icon: Container, tone: "text-amber" },
  { label: "Critical SKUs", value: 64, icon: AlertTriangle, tone: "text-coral" },
  { label: "High-Risk Waters", value: 21, icon: MapPinned, tone: "text-coral" },
  { label: "Late Shipments", value: 14, icon: Clock, tone: "text-amber" },
];

const categories = [
  { name: "Electronics", avg: 71 },
  { name: "Apparel", avg: 84 },
  { name: "Pharma", avg: 62 },
  { name: "Automotive", avg: 79 },
  { name: "FMCG", avg: 88 },
  { name: "Industrial", avg: 74 },
];

const rows = [
  ["SHP-4021", "Pacific Vanguard", "Shanghai → Rotterdam", "2026-08-14", "Customs hold"],
  ["SHP-4044", "Northern Wavecrest", "Busan → Long Beach", "2026-08-09", "At sea"],
  ["SHP-4067", "Atlantic Meridian", "Santos → Antwerp", "2026-08-21", "Missing scan"],
  ["SHP-4093", "Coral Horizon", "Singapore → Hamburg", "2026-08-27", "Transshipment"],
];

export function PanelBox({
  title,
  children,
  className = "",
}: {
  title?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`rounded-xl border border-border bg-panel p-3 md:p-4 ${className}`}>
      {title && <p className="mb-3 font-display text-[11px] text-foreground md:text-[13px]">{title}</p>}
      {children}
    </div>
  );
}

export function DashboardMock() {
  const { ref, shown } = useInView<HTMLDivElement>(0.25);
  return (
    <div ref={ref} className="flex flex-col gap-3">
      <div className="grid grid-cols-3 gap-2 md:grid-cols-6 md:gap-3">
        {kpis.map((k) => (
          <div key={k.label} className="rounded-xl border border-border bg-panel p-2.5 md:p-3">
            <div className="flex items-center justify-between gap-1">
              <span className="text-[9px] leading-tight text-muted-foreground md:text-[11px]">
                {k.label}
              </span>
              <k.icon className={`size-3 shrink-0 md:size-3.5 ${k.tone}`} />
            </div>
            <p className={`mt-1.5 font-display text-base md:text-xl ${k.tone}`}>
              <Counter value={k.value} decimals={k.decimals ?? 0} suffix={k.suffix ?? ""} />
            </p>
          </div>
        ))}
      </div>

      <div className="grid gap-3 md:grid-cols-5">
        <PanelBox title="Average confidence by category" className="md:col-span-3">
          <div className="flex h-28 items-end gap-2 md:h-36">
            {categories.map((c, i) => (
              <div key={c.name} className="flex h-full flex-1 flex-col items-center justify-end gap-1.5">
                <div
                  className="w-full rounded-t bg-teal/80"
                  style={{
                    height: shown ? `${c.avg}%` : 0,
                    transition: `height 1.1s cubic-bezier(0.16,1,0.3,1) ${i * 90}ms`,
                  }}
                />
                <span className="truncate font-mono text-[8px] text-text-faint md:text-[9px]">
                  {c.name}
                </span>
              </div>
            ))}
          </div>
        </PanelBox>

        <PanelBox title="SKU risk breakdown" className="md:col-span-2">
          <div className="flex items-center justify-center gap-4">
            <Gauge value={78} size={104} label="Avg" />
            <div className="flex flex-col gap-2">
              {[
                ["Clear", "bg-teal", 318],
                ["Monitor", "bg-amber", 168],
                ["Alert", "bg-coral", 64],
              ].map(([name, cls, n]) => (
                <div key={name as string} className="flex items-center gap-2 font-mono text-[10px] text-muted-foreground">
                  <span className={`size-2 rounded-full ${cls}`} /> {name} ({n})
                </div>
              ))}
            </div>
          </div>
        </PanelBox>
      </div>

      <PanelBox title="Shipments in transit">
        <table className="w-full text-left">
          <thead>
            <tr className="text-[9px] text-muted-foreground md:text-[10px]">
              {["Shipment", "Vessel", "Route", "ETA", "Current event"].map((h, i) => (
                <th
                  key={h}
                  className={`pb-2 pr-3 font-normal ${i === 1 || i === 2 ? "hidden sm:table-cell" : ""}`}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r[0]} className="border-t border-border-soft text-[9px] md:text-[11px]">
                <td className="py-1.5 pr-3 font-mono text-foreground">{r[0]}</td>
                <td className="hidden py-1.5 pr-3 text-foreground sm:table-cell">{r[1]}</td>
                <td className="hidden py-1.5 pr-3 text-muted-foreground sm:table-cell">{r[2]}</td>
                <td className="py-1.5 pr-3 font-mono text-muted-foreground whitespace-nowrap">{r[3]}</td>
                <td className="py-1.5 text-muted-foreground">{r[4]}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </PanelBox>
    </div>
  );
}

export function ExceptionsMock() {
  const items = [
    ["SKU-88210", "Pharma", 41, "Seal broken", "coral"],
    ["SKU-11934", "Electronics", 55, "Customs hold 6d", "coral"],
    ["SKU-67002", "Automotive", 63, "Missing scan", "amber"],
    ["SKU-30518", "FMCG", 68, "Reefer excursion", "amber"],
    ["SKU-45771", "Apparel", 72, "Transship delay", "amber"],
  ] as const;
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-2">
        {["All exceptions", "Alert", "Monitor", "Confidence < 70", "Late"].map((f, i) => (
          <span
            key={f}
            className={`rounded-full border px-2.5 py-1 font-mono text-[9px] md:text-[10px] ${
              i === 0
                ? "border-teal-dim bg-teal/10 text-teal"
                : "border-border text-muted-foreground"
            }`}
          >
            {f}
          </span>
        ))}
      </div>
      <PanelBox title="SKUs requiring attention">
        <div className="flex flex-col">
          {items.map(([sku, cat, conf, reason, tone], i) => (
            <div
              key={sku}
              className="grid grid-cols-[1fr_auto] items-center gap-3 border-t border-border-soft py-2 first:border-t-0"
              style={{ opacity: 1 - i * 0.06 }}
            >
              <div className="min-w-0">
                <p className="font-mono text-[10px] text-foreground md:text-[11px]">{sku}</p>
                <p className="truncate text-[9px] text-muted-foreground md:text-[10px]">
                  {cat} · {reason}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-1.5 w-16 overflow-hidden rounded-full bg-border-soft md:w-28">
                  <div
                    className={tone === "coral" ? "h-full bg-coral" : "h-full bg-amber"}
                    style={{ width: `${conf}%` }}
                  />
                </div>
                <span
                  className={`font-mono text-[10px] ${tone === "coral" ? "text-coral" : "text-amber"}`}
                >
                  {conf}%
                </span>
              </div>
            </div>
          ))}
        </div>
      </PanelBox>
    </div>
  );
}

export const custodySteps = [
  { label: "Booking confirmed", delta: 0, conf: 100, tone: "teal" },
  { label: "Origin gate-in", delta: -2, conf: 98, tone: "teal" },
  { label: "Customs hold", delta: -6, conf: 92, tone: "amber" },
  { label: "Vessel departure", delta: -1, conf: 91, tone: "teal" },
  { label: "Missing scan", delta: -10, conf: 81, tone: "amber" },
  { label: "Seal broken", delta: -26, conf: 55, tone: "coral" },
  { label: "Warehouse receipt", delta: 0, conf: 55, tone: "coral" },
];

export function CustodyMock() {
  const { ref, shown } = useInView<HTMLDivElement>(0.25);
  return (
    <div ref={ref}>
      <PanelBox title="Chain of custody — CNTR-77120">
        <div className="relative pl-6">
          <span className="absolute top-1 bottom-1 left-[7px] w-px bg-border" />
          <span
            className="absolute left-[7px] w-px bg-teal"
            style={{
              top: 4,
              height: shown ? "calc(100% - 8px)" : 0,
              transition: "height 1.8s cubic-bezier(0.16,1,0.3,1)",
            }}
          />
          {custodySteps.map((s, i) => (
            <div
              key={s.label}
              className="reveal relative py-1.5"
              data-shown={shown}
              style={{ transitionDelay: `${i * 160}ms` }}
            >
              <span
                className={`absolute top-3 -left-[22px] size-2 rounded-full ring-4 ring-panel ${
                  s.tone === "coral" ? "bg-coral" : s.tone === "amber" ? "bg-amber" : "bg-teal"
                }`}
              />
              <div className="flex items-center justify-between gap-3">
                <span className="text-[10px] text-foreground md:text-xs">{s.label}</span>
                <span className="flex items-center gap-2 font-mono text-[10px]">
                  {s.delta !== 0 && (
                    <span className={s.tone === "coral" ? "text-coral" : "text-amber"}>
                      {s.delta}
                    </span>
                  )}
                  <span className="text-muted-foreground">{s.conf}%</span>
                </span>
              </div>
            </div>
          ))}
        </div>
      </PanelBox>
    </div>
  );
}

export function SimulatorMock() {
  return (
    <div className="grid gap-3 md:grid-cols-5">
      <PanelBox title="Disruptions" className="md:col-span-2">
        <div className="flex flex-col gap-2">
          {[
            ["Weather delay", "-8", "amber"],
            ["Customs hold", "-6", "amber"],
            ["Missing scan", "-10", "coral"],
            ["Port congestion", "-4", "amber"],
          ].map(([name, d, tone]) => (
            <div
              key={name}
              className="flex items-center justify-between rounded-lg border border-border bg-panel-alt px-2.5 py-1.5"
            >
              <span className="text-[10px] text-foreground md:text-[11px]">{name}</span>
              <span
                className={`font-mono text-[10px] ${tone === "coral" ? "text-coral" : "text-amber"}`}
              >
                {d}
              </span>
            </div>
          ))}
        </div>
      </PanelBox>
      <PanelBox title="Re-scored outcome" className="flex items-center justify-center md:col-span-3">
        <div className="flex flex-col items-center gap-3 py-2">
          <Gauge value={55} size={116} />
          <p className="font-mono text-[10px] text-muted-foreground">
            baseline 83% → simulated 55%
          </p>
        </div>
      </PanelBox>
    </div>
  );
}

export function SettingsMock() {
  return (
    <div className="grid gap-3 md:grid-cols-2">
      <PanelBox title="Signal weights">
        {[
          ["Customs dwell", 24],
          ["Scan continuity", 32],
          ["Seal integrity", 28],
          ["Carrier reliability", 16],
        ].map(([label, w]) => (
          <div key={label as string} className="mb-3 last:mb-0">
            <div className="mb-1 flex justify-between font-mono text-[10px] text-muted-foreground">
              <span>{label}</span>
              <span className="text-teal">{w}%</span>
            </div>
            <div className="h-1.5 rounded-full bg-border-soft">
              <div className="h-full rounded-full bg-teal" style={{ width: `${w as number}%` }} />
            </div>
          </div>
        ))}
      </PanelBox>
      <PanelBox title="Thresholds & sources">
        <div className="flex flex-col gap-2 font-mono text-[10px] text-muted-foreground">
          {[
            ["Alert below", "60%"],
            ["Monitor below", "80%"],
            ["Grace window", "48h"],
            ["EDI feed", "reliable"],
            ["Carrier API", "degraded"],
            ["Manual scan", "low trust"],
          ].map(([k, v]) => (
            <div key={k} className="flex justify-between border-b border-border-soft pb-1.5">
              <span>{k}</span>
              <span className="text-foreground">{v}</span>
            </div>
          ))}
        </div>
      </PanelBox>
    </div>
  );
}
