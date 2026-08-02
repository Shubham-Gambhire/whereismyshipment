import { createFileRoute } from "@tanstack/react-router";
import { Hero } from "@/components/showcase/Hero";
import { ApproachSection, ProblemSection } from "@/components/showcase/ProblemApproach";
import { Concepts } from "@/components/showcase/Concepts";
import { Architecture, Highlights, Implementation, Limitations, Process, Stack } from "@/components/showcase/Sections";

const title = "Where Is My Shipment — Supply Chain Visibility Prototype";
const description =
  "A digital supply chain prototype: SKU-level confidence scoring, chain-of-custody reconstruction, risk analytics and what-if disruption simulation.";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <main className="min-h-screen bg-background">
      <Hero />
      <ProblemSection />
      <ApproachSection />
      <Walkthrough />
      <Concepts />
      <Process />
      <Architecture />
      <Stack />
      <Highlights />
    </main>
  );
}
