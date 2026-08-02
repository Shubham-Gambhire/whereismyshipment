import { createFileRoute } from "@tanstack/react-router";
import { lazy, Suspense, useEffect, useState } from "react";

const App = lazy(() => import("@/components/prototype/WhereIsMyShipment"));

const title = "Where Is My Shipment — Supply Chain Visibility Prototype";
const description =
  "An interactive logistics visibility prototype: SKU-level confidence scoring, chain-of-custody reconstruction, exception triage and what-if disruption simulation on synthetic ocean freight data.";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: title },
      { name: "twitter:description", content: description },
    ],
  }),
  component: Index,
});

function Index() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <div className="min-h-screen bg-background">
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
