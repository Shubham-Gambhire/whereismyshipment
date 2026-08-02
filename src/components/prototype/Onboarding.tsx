// @ts-nocheck
/* eslint-disable */
import React, { useState } from "react";
import { HelpCircle, Info, ChevronDown } from "lucide-react";

/* ---------------------------------------------------------
   PLAIN-LANGUAGE LAYER
   A translation layer sitting on top of the prototype so a
   recruiter, student or non-logistics visitor can read the
   same screens an industry expert reads. Nothing here changes
   the model — it only explains it.
--------------------------------------------------------- */

const C = {
  bg: "#080D12",
  panel: "#0E1821",
  panelAlt: "#142631",
  border: "#1E3342",
  teal: "#2DD4BF",
  amber: "#FBBF24",
  coral: "#F87171",
  text: "#E8F1F2",
  textMuted: "#7F9BA3",
  textFaint: "#4E6870",
};
const FONT_DISPLAY = "'Sora', sans-serif";
const FONT_BODY = "'Manrope', sans-serif";
const FONT_MONO = "'IBM Plex Mono', monospace";

/* Jargon → plain English. Longest keys are matched first. */
export const GLOSSARY = {
  "VGM Submitted":
    "VGM = Verified Gross Mass. The container's certified weight, filed before loading. Without it, the carrier can legally refuse to load the box.",
  VGM: "Verified Gross Mass — the container's certified weight, filed before loading. Missing it can block the container from being loaded.",
  "Carrier Seal Affixed":
    "A numbered seal is locked onto the container doors. From here on, a broken or swapped seal means possible tampering.",
  "Container Stuffing Completed":
    "The goods have physically been loaded into the container at origin.",
  "Booking Confirmed":
    "The carrier has accepted the cargo and reserved space on a specific vessel.",
  "Container Gate-In":
    "The container has entered the port terminal and is now in the terminal operator's custody.",
  "Gate-In": "The container entered the port terminal and is now in the terminal's custody.",
  "Container Gate-Out":
    "The container has left the destination terminal on a truck or rail wagon.",
  "Gate-Out": "The container left the destination terminal for inland transport.",
  "Customs Export Clearance":
    "Customs at origin has approved the goods for export. LEO = Let Export Order, the formal release.",
  LEO: "Let Export Order — the formal customs approval that allows the cargo to leave the country.",
  "Loaded per Stowage Plan":
    "The container has been placed on the vessel in the exact slot the stowage plan assigned. Confirms it is physically on board.",
  "Stowage Plan": "The vessel's loading map: which container sits in which slot on which deck.",
  "Bill of Lading":
    "The Bill of Lading (BL) is the contract and title document for the cargo. Whoever holds it can claim the goods.",
  "Bill of Lading Issued":
    "The carrier has issued the Bill of Lading — the contract and title document for the cargo.",
  Transshipment:
    "The container is moved from one vessel to another at an intermediate hub port. Each transfer is an extra chance to lose visibility.",
  "Import Manifest Filed":
    "The carrier has declared the inbound cargo to destination customs before arrival.",
  "Customs Import Clearance":
    "Destination customs has released the cargo. This is a routine, expected step — not the same as being flagged for inspection.",
  "Vessel Departure": "The ship has physically left the origin port.",
  "Vessel Arrival": "The ship has arrived at the destination port.",
  Discharged: "The container has been lifted off the vessel onto the quay.",
  "Warehouse Received": "The goods have been booked into the destination warehouse.",
  "Empty Returned": "The emptied container has been handed back to the carrier — the cycle is closed.",
  "Carrier EDI":
    "EDI = Electronic Data Interchange. The shipping line's automated status feed. Reliable, but sometimes batched and late.",
  EDI: "Electronic Data Interchange — the shipping line's automated status message feed.",
  "AIS Feed":
    "AIS = Automatic Identification System. Public vessel position broadcasts, used here to see which risk waters a ship transits.",
  AIS: "Automatic Identification System — public vessel position broadcasts used to track ships at sea.",
  "GPS Telemetry":
    "Position readings from a tracker mounted on the container itself. Highest detail, but the noisiest source.",
  "Manual Scan": "A person scanning a barcode or RFID tag at a checkpoint. Accurate when it happens, easy to skip.",
  "Missing Scan":
    "A milestone that should have been reported has not arrived. Usually a data problem, occasionally a real one — which is why it waits out a grace window first.",
  "Customs Inspection Flagged":
    "Customs has pulled the container aside for physical or documentary examination. Typically adds days, not hours.",
  "Seal Broken":
    "The numbered seal on the container doors is no longer intact. The single most serious integrity signal in the chain.",
  "Grace Window":
    "A waiting period before a missing milestone counts against the score, so ordinary reporting lag isn't treated as a real problem.",
  Chokepoint:
    "A narrow stretch of water every ship on the route must pass through — congestion or conflict there hits many shipments at once.",
  SKU: "Stock Keeping Unit — one specific product line. A single container usually carries many SKUs.",
  Demurrage:
    "Charges the port levies when a container sits at the terminal beyond the free time allowed.",
};

const GLOSSARY_KEYS = Object.keys(GLOSSARY).sort((a, b) => b.length - a.length);

/* ---------------------------------------------------------
   TOOLTIP — hover on desktop, click/tap anywhere
--------------------------------------------------------- */
export function Term({ term, children }) {
  const [open, setOpen] = useState(false);
  const body = GLOSSARY[term];
  if (!body) return <>{children ?? term}</>;
  return (
    <span
      className="relative inline-block"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <span
        role="button"
        tabIndex={0}
        onClick={(e) => {
          e.stopPropagation();
          setOpen((v) => !v);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            e.stopPropagation();
            setOpen((v) => !v);
          }
        }}
        className="cursor-help"
        style={{ borderBottom: `1px dotted ${C.textMuted}` }}
        aria-label={`What is ${term}?`}
      >
        {children ?? term}
      </span>
      {open && (
        <span
          role="tooltip"
          className="absolute left-0 z-50 block"
          style={{
            bottom: "calc(100% + 8px)",
            width: 268,
            background: C.panelAlt,
            border: `1px solid ${C.border}`,
            borderRadius: 10,
            padding: "10px 12px",
            boxShadow: "0 18px 40px -18px rgba(0,0,0,0.9)",
            fontFamily: FONT_BODY,
            fontSize: 12,
            lineHeight: 1.55,
            color: C.text,
            fontWeight: 400,
            whiteSpace: "normal",
          }}
        >
          <span
            className="block"
            style={{ fontFamily: FONT_MONO, fontSize: 10, color: C.teal, marginBottom: 4, letterSpacing: 0.6 }}
          >
            {term.toUpperCase()}
          </span>
          {body}
        </span>
      )}
    </span>
  );
}

/* Wrap every glossary term found in a string with a tooltip. */
export function Glossed({ text }) {
  if (typeof text !== "string" || !text) return text ?? null;
  const out = [];
  let rest = text;
  let guard = 0;
  while (rest && guard++ < 40) {
    let bestKey = null;
    let bestIdx = -1;
    for (const key of GLOSSARY_KEYS) {
      const idx = rest.indexOf(key);
      if (idx !== -1 && (bestIdx === -1 || idx < bestIdx)) {
        bestIdx = idx;
        bestKey = key;
      }
    }
    if (bestKey === null) break;
    if (bestIdx > 0) out.push(rest.slice(0, bestIdx));
    out.push(
      <Term key={`${bestKey}-${out.length}`} term={bestKey}>
        {bestKey}
      </Term>
    );
    rest = rest.slice(bestIdx + bestKey.length);
  }
  if (rest) out.push(rest);
  return <>{out}</>;
}

/* ---------------------------------------------------------
   CONSEQUENCE FRAMING — what a score means in business terms
--------------------------------------------------------- */
export function confidenceAdvice(value, thresholds) {
  const clear = thresholds?.clear ?? 80;
  const monitor = thresholds?.monitor ?? 60;
  if (value >= clear) {
    return {
      color: C.teal,
      headline: "On track",
      action: "Location is well evidenced. No action needed — keep the promised date.",
    };
  }
  if (value >= monitor) {
    return {
      color: C.amber,
      headline: "Watch this one",
      action: "Evidence is thinning. Warn the customer early rather than expediting yet.",
    };
  }
  return {
    color: C.coral,
    headline: "Likely to miss the date",
    action: "Treat the promised date as unsafe. Expedite, re-plan or source a backup now.",
  };
}

export function ConfidenceAdvice({ value, thresholds }) {
  const a = confidenceAdvice(value, thresholds);
  return (
    <div
      className="mt-3 rounded-md px-3 py-2"
      style={{ background: C.panelAlt, border: `1px solid ${C.border}`, maxWidth: 260 }}
    >
      <div style={{ fontFamily: FONT_MONO, fontSize: 10.5, color: a.color, letterSpacing: 0.6 }}>
        {a.headline.toUpperCase()}
      </div>
      <div style={{ fontFamily: FONT_BODY, fontSize: 12, color: C.textMuted, lineHeight: 1.5, marginTop: 3 }}>
        {a.action}
      </div>
    </div>
  );
}

/* ---------------------------------------------------------
   "WHAT AM I LOOKING AT" — one business sentence per tab
--------------------------------------------------------- */
const TAB_INTROS = {
  dashboard: {
    q: "The control tower.",
    a: "Everything moving right now, and how much the model actually trusts its own location claim for each item. Click any number to see what's behind it.",
  },
  search: {
    q: "One product, traced end to end.",
    a: "Every handover it went through, and what each one did to the confidence score.",
  },
  exceptions: {
    q: "The short list.",
    a: "Only what needs a decision today. Each row carries the note I'd leave for whoever picks it up.",
  },
  simulator: {
    q: "A rehearsal.",
    a: "Drop a customs hold or a port strike onto a real shipment and watch the score move before it happens for real.",
  },
  settings: {
    q: "The judgement calls, made explicit.",
    a: "What each event should cost, where the risk lines sit, how much each feed is worth trusting. Change one and every screen follows.",
  },
  integrations: {
    q: "Where the data would come from.",
    a: "Carrier feeds, terminals, customs, vessel positions — and what each is genuinely good and bad at.",
  },
  logic: {
    q: "The full reasoning.",
    a: "Every rule, weight and safeguard in the confidence engine, written out and argued for.",
  },
};

export function TabIntro({ tab }) {
  const intro = TAB_INTROS[tab];
  if (!intro) return null;
  return (
    <div
      className="mb-5 flex items-start gap-2.5 rounded-md px-4 py-3"
      style={{ background: C.panel, border: `1px solid ${C.border}` }}
    >
      <Info size={15} color={C.teal} className="mt-0.5 shrink-0" />
      <p style={{ fontFamily: FONT_BODY, fontSize: 13, lineHeight: 1.6, color: C.textMuted, margin: 0 }}>
        <span style={{ color: C.text, fontWeight: 600 }}>{intro.q} </span>
        {intro.a}
      </p>
    </div>
  );
}

/* ---------------------------------------------------------
   READ THIS FIRST — the 30-second orientation panel
--------------------------------------------------------- */
export function ReadThisFirst() {
  const [open, setOpen] = useState(true);
  return (
    <div className="rounded-md overflow-hidden" style={{ background: C.panel, border: `1px solid ${C.border}` }}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
        style={{ background: "transparent", border: "none", cursor: "pointer" }}
      >
        <span className="flex items-center gap-2 min-w-0">
          <HelpCircle size={15} color={C.teal} className="shrink-0" />
          <span style={{ fontFamily: FONT_DISPLAY, fontSize: 14, color: C.text }} className="truncate">
            First time here?
          </span>
        </span>
        <ChevronDown
          size={15}
          color={C.textMuted}
          style={{ transform: open ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}
        />
      </button>
      {open && (
        <div className="px-4 pb-4">
          <p style={{ fontFamily: FONT_BODY, fontSize: 13, lineHeight: 1.65, color: C.textMuted, margin: 0, maxWidth: 680 }}>
            A shipment is tracked as one container, but a business sells individual products — so when something
            goes wrong, nobody can say which product is affected or how sure we even are. Every product here starts
            at 100% and loses points each time the evidence for its location weakens.
          </p>
          <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1.5">
            {[
              ["Clear", C.teal, "well evidenced, keep the date"],
              ["Monitor", C.amber, "thinning, warn the customer"],
              ["Alert", C.coral, "treat the date as unsafe"],
            ].map(([l, c, d]) => (
              <span key={l} className="flex items-center gap-1.5" style={{ fontFamily: FONT_BODY, fontSize: 12, color: C.textMuted }}>
                <span className="h-1.5 w-1.5 rounded-full" style={{ background: c }} />
                <span style={{ color: c, fontFamily: FONT_MONO, fontSize: 11 }}>{l}</span> {d}
              </span>
            ))}
          </div>
          <p style={{ fontFamily: FONT_BODY, fontSize: 11.5, color: C.textFaint, marginTop: 10 }}>
            Dotted underlines explain the jargon. All data is synthetic.
          </p>
        </div>
      )}
    </div>
  );
}
