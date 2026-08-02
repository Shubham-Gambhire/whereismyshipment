import { useEffect, useRef, useState, type ReactNode } from "react";

/** Reveals children once they scroll into view (respects reduced motion). */
export function useInView<T extends HTMLElement>(threshold = 0.2) {
  const ref = useRef<T | null>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (typeof IntersectionObserver === "undefined") {
      setShown(true);
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setShown(true);
          observer.disconnect();
        }
      },
      { threshold, rootMargin: "0px 0px -8% 0px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [threshold]);

  return { ref, shown };
}

export function Reveal({
  children,
  delay = 0,
  className = "",
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  const { ref, shown } = useInView<HTMLDivElement>(0.15);
  return (
    <div
      ref={ref}
      data-shown={shown}
      className={`reveal ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

export function Section({
  id,
  eyebrow,
  title,
  intro,
  children,
  className = "",
}: {
  id?: string;
  eyebrow?: string;
  title?: string;
  intro?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section id={id} className={`mx-auto w-full max-w-6xl px-5 py-20 md:py-32 ${className}`}>
      {(eyebrow || title || intro) && (
        <Reveal className="mb-12 max-w-2xl md:mb-16">
          {eyebrow && (
            <p className="font-mono text-[11px] tracking-[0.22em] text-teal uppercase">{eyebrow}</p>
          )}
          {title && (
            <h2 className="mt-4 text-3xl leading-[1.1] font-semibold text-foreground md:text-[2.6rem]">
              {title}
            </h2>
          )}
          {intro && (
            <p className="mt-4 text-[15px] leading-relaxed text-muted-foreground md:text-base">
              {intro}
            </p>
          )}
        </Reveal>
      )}
      {children}
    </section>
  );
}

export function Panel({
  children,
  className = "",
  hover = false,
}: {
  children: ReactNode;
  className?: string;
  hover?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border border-border bg-panel/80 backdrop-blur-sm ${
        hover
          ? "transition-[transform,border-color,box-shadow] duration-500 hover:-translate-y-1 hover:border-teal-dim hover:shadow-[0_18px_50px_-24px_rgba(52,216,195,0.45)]"
          : ""
      } ${className}`}
    >
      {children}
    </div>
  );
}

/** Counts from 0 to `value` once visible. */
export function Counter({
  value,
  decimals = 0,
  suffix = "",
  duration = 1400,
}: {
  value: number;
  decimals?: number;
  suffix?: string;
  duration?: number;
}) {
  const { ref, shown } = useInView<HTMLSpanElement>(0.4);
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (!shown) return;
    const reduced =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      setDisplay(value);
      return;
    }
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(value * eased);
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [shown, value, duration]);

  return (
    <span ref={ref} className="font-display tabular-nums">
      {display.toFixed(decimals)}
      {suffix}
    </span>
  );
}

export function Gauge({
  value,
  size = 132,
  label = "Confidence",
}: {
  value: number;
  size?: number;
  label?: string;
}) {
  const { ref, shown } = useInView<HTMLDivElement>(0.4);
  const stroke = 9;
  const r = (size - stroke) / 2;
  const circumference = 2 * Math.PI * r;
  const pct = shown ? value / 100 : 0;
  const color = value >= 80 ? "var(--teal)" : value >= 60 ? "var(--amber)" : "var(--coral)";

  return (
    <div ref={ref} className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke="var(--border-soft)"
            strokeWidth={stroke}
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke={color}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={circumference * (1 - pct)}
            style={{ transition: "stroke-dashoffset 1.5s cubic-bezier(0.16,1,0.3,1)" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span
            className="font-display text-2xl font-semibold"
            style={{ color }}
          >
            <Counter value={value} suffix="%" />
          </span>
          <span className="font-mono text-[10px] tracking-widest text-text-faint uppercase">
            {label}
          </span>
        </div>
      </div>
    </div>
  );
}
