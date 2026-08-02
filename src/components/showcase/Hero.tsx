import { useEffect, useState } from "react";
import { ArrowUpRight, Github, Mail } from "lucide-react";
import { BrowserFrame } from "./BrowserFrame";
import { DashboardMock } from "./mocks";
import { GITHUB_URL, CONTACT_URL } from "./links";

export function Hero() {
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduced || window.innerWidth < 768) return;
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => setOffset(Math.min(window.scrollY * 0.06, 40)));
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <header className="relative overflow-hidden">
      <div className="grid-faint pointer-events-none absolute inset-0 opacity-40 [mask-image:radial-gradient(70%_55%_at_50%_0%,black,transparent)]" />
      <div className="pointer-events-none absolute -top-40 left-1/2 h-[28rem] w-[46rem] -translate-x-1/2 rounded-full bg-teal/10 blur-[120px]" />

      <div className="relative mx-auto w-full max-w-6xl px-5 pt-20 pb-16 md:pt-32 md:pb-24">
        <div className="reveal max-w-3xl" data-shown="true">
          <span className="inline-flex items-center gap-2 rounded-full border border-teal-dim bg-teal/5 px-3 py-1 font-mono text-[10px] tracking-[0.2em] text-teal uppercase">
            Prototype · Digital Supply Chain
          </span>
          <h1 className="mt-6 text-4xl leading-[1.05] font-semibold text-balance text-foreground md:text-7xl">
            Where Is My Shipment
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-relaxed text-muted-foreground md:text-lg">
            A logistics visibility prototype exploring how shipment data becomes a decision: SKU-level
            confidence scoring, chain-of-custody reconstruction, risk analytics and what-if disruption
            simulation — built to show how I think about supply chain problems, not to sell a product.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <a
              href={GITHUB_URL}
              className="inline-flex items-center gap-2 rounded-full border border-border bg-panel px-4 py-2 text-sm text-foreground transition-colors hover:border-teal-dim hover:text-teal"
            >
              <Github className="size-4" /> View on GitHub
            </a>
            <a
              href={CONTACT_URL}
              className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm text-muted-foreground transition-colors hover:text-teal"
            >
              <Mail className="size-4" /> Contact
              <ArrowUpRight className="size-3.5" />
            </a>
          </div>
        </div>

        <div
          className="float-soft mt-14 md:mt-20"
          style={{ transform: `translateY(-${offset}px)` }}
        >
          <BrowserFrame>
            <DashboardMock />
          </BrowserFrame>
        </div>
      </div>
    </header>
  );
}
