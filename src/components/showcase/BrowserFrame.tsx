import { type ReactNode } from "react";

export function BrowserFrame({
  children,
  url = "where-is-my-shipment.app",
  className = "",
}: {
  children: ReactNode;
  url?: string;
  className?: string;
}) {
  return (
    <div
      className={`overflow-hidden rounded-2xl border border-border bg-panel shadow-[0_40px_120px_-40px_rgba(0,0,0,0.9)] ${className}`}
    >
      <div className="flex items-center gap-2 border-b border-border bg-panel-alt/80 px-3 py-2.5">
        <span className="flex gap-1.5">
          <span className="size-2.5 rounded-full bg-coral/70" />
          <span className="size-2.5 rounded-full bg-amber/70" />
          <span className="size-2.5 rounded-full bg-teal/70" />
        </span>
        <span className="mx-auto rounded-md border border-border bg-background/60 px-3 py-0.5 font-mono text-[10px] text-text-faint">
          {url}
        </span>
      </div>
      <div className="bg-background/40 p-3 md:p-5">{children}</div>
    </div>
  );
}
