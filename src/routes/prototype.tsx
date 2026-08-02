import { createFileRoute, Link } from "@tanstack/react-router";
import { lazy, Suspense, useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";

const App = lazy(() => import("@/components/prototype/WhereIsMyShipment"));

const title = "Where Is My Shipment — Interactive Prototype";
const description =
  "Run the live prototype: SKU-level confidence scoring, chain-of-custody reconstruction, exception triage and what-if disruption simulation on synthetic ocean freight data.";

export const Route = createFileRoute("/prototype")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
    ],
  }),
  component: PrototypePage,
});

function PrototypePage() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border bg-panel/60">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-5 py-2.5">
          <Link
            to="/"
            className="inline-flex items-center gap-2 font-mono text-[11px] text-muted-foreground transition-colors hover:text-teal"
          >
            <ArrowLeft className="size-3.5" /> Back to the write-up
          </Link>
          <span className="font-mono text-[11px] text-text-faint">
            Live prototype · synthetic data
          </span>
        </div>
      </div>

      {mounted ? (
        <Suspense fallback={<Loading />}>
          <App />
        </Suspense>
      ) : (
        <Loading />
      )}
    </div>
  );
}

function Loading() {
  return (
    <div className="flex min-h-[70vh] items-center justify-center">
      <p className="font-mono text-xs text-text-faint">Generating synthetic shipment data…</p>
    </div>
  );
}
