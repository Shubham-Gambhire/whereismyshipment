// @ts-nocheck
/* eslint-disable */
import React, { useState, useMemo, useEffect, useCallback } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from "recharts";
import {
  Search, Anchor, Ship, Package, AlertTriangle, ChevronRight,
  Gauge, Radio, Container as ContainerIcon,
  HelpCircle, XCircle, CircleDollarSign, Layers, Scale, TrendingDown,
  Bell, Satellite, Database, RotateCcw, PlayCircle, Sliders, X, CheckCircle2,
  Settings, CloudRain, MapPinned, Clock
} from "lucide-react";
import { Glossed, Term, ConfidenceAdvice, ReadThisFirst, TabIntro } from "./Onboarding";

/* ---------------------------------------------------------
   DESIGN TOKENS
--------------------------------------------------------- */
const C = {
  bg: "#0B0F14",
  panel: "#111721",
  panelAlt: "#161E29",
  border: "#1F2833",
  borderSoft: "#19212B",
  teal: "#3B9E8F",
  tealDim: "#16302E",
  amber: "#C99A3B",
  amberDim: "#332916",
  coral: "#D2604F",
  coralDim: "#331A16",
  text: "#E4E9EF",
  textMuted: "#8A96A5",
  textFaint: "#5A6675",
};

const FONT_DISPLAY = "'Inter', sans-serif";
const FONT_BODY = "'Inter', sans-serif";
const FONT_MONO = "'IBM Plex Mono', monospace";

/* ---------------------------------------------------------
   SYNTHETIC DATA GENERATION
   (scaled down from the PRD's 50k-SKU target for an
   in-browser demo: ~90 shipments / ~550 SKUs)
--------------------------------------------------------- */
function mulberry32(seed) {
  return function () {
    seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rng = mulberry32(20260728);
const pick = (arr) => arr[Math.floor(rng() * arr.length)];
const randInt = (a, b) => a + Math.floor(rng() * (b - a + 1));
const weightedPick = (items, weights) => {
  const r = rng();
  let cum = 0;
  for (let i = 0; i < items.length; i++) {
    cum += weights[i];
    if (r <= cum) return items[i];
  }
  return items[items.length - 1];
};

// Fixed reference "today", shared by data generation and the confidence
// engine, so grace-window/lateness math stays stable rather than drifting
// with the real wall-clock whenever the prototype happens to be opened.
const NOW = new Date("2026-07-28T00:00:00Z");

const PORTS = ["Shanghai", "Rotterdam", "Los Angeles", "Singapore", "Busan",
  "Hamburg", "Santos", "Jebel Ali", "Ningbo", "Antwerp", "Long Beach", "Colombo"];
const VESSELS = ["Pacific Vanguard", "Northern Wavecrest", "Atlantic Meridian",
  "Solstice Carrier", "Windward Horizon", "Cobalt Voyager", "Meridian Star",
  "Tidewater Express", "Boreal Current", "Amber Horizon"];
const CUSTOMERS = ["Solstice Retail Co.", "Anchor Point Supplies", "Meridian Apparel Group",
  "Kestrel Home Goods", "Harborline Electronics", "Fieldstone Industrial",
  "Northgate Pharma", "Vantage Auto Parts"];
const CATEGORIES = ["Electronics", "Apparel", "Furniture", "Automotive Parts",
  "Consumer Goods", "Pharmaceuticals", "Industrial Equipment"];
// Rough per-unit price range by category, used to derive a $ value per SKU.
const CATEGORY_UNIT_PRICE = {
  Electronics: [20, 300],
  Apparel: [5, 60],
  Furniture: [30, 400],
  "Automotive Parts": [10, 250],
  "Consumer Goods": [3, 50],
  Pharmaceuticals: [15, 200],
  "Industrial Equipment": [50, 800],
};
const SLA_TIERS = ["Standard", "Priority", "Contractual SLA"];
const SLA_TIER_WEIGHTS = [0.6, 0.3, 0.1];

// Ports where inland waterway "barging" is a routine, well-documented part
// of container handling (the Rhine-connected Hamburg-Le Havre range).
const BARGE_PORTS = ["Rotterdam", "Antwerp", "Hamburg"];

// The real ocean export/import milestone sequence (verified against DCSA's
// shipping glossary, carrier vessel-schedule terminology, and India's
// ICEGATE customs process, since global and India-specific customs
// terminology differ, see the Logic tab glossary for both). `side`
// determines whether the event is shown at the origin port, in transit,
// or at the destination port.
const EVENT_SEQUENCE = [
  { key: "bookingConfirmed", label: "Booking Confirmed", side: "origin" },
  { key: "stuffed", label: "Container Stuffing Completed", side: "origin" },
  { key: "vgmSubmitted", label: "VGM Submitted", side: "origin" },
  { key: "sealed", label: "Carrier Seal Affixed", side: "origin" },
  { key: "gateIn", label: "Container Gate-In (Origin Terminal)", side: "origin" },
  { key: "exportCleared", label: "Customs Export Clearance (LEO Issued)", side: "origin" },
  { key: "stowed", label: "Loaded per Stowage Plan", side: "origin" },
  { key: "blIssued", label: "Bill of Lading Issued", side: "origin" },
  { key: "vesselDeparture", label: "Vessel Departure", side: "origin" },
  { key: "transshipment", label: "Transshipment at Hub Port", side: "transit", optional: 0.35 },
  { key: "vesselArrival", label: "Vessel Arrival", side: "destination" },
  { key: "discharged", label: "Discharged from Vessel", side: "destination" },
  { key: "importManifest", label: "Import Manifest Filed", side: "destination" },
  { key: "importCleared", label: "Customs Import Clearance", side: "destination" },
  { key: "gateOut", label: "Container Gate-Out (Destination Terminal)", side: "destination" },
  { key: "warehouse", label: "Warehouse Received", side: "destination" },
  { key: "delivered", label: "Delivered / Empty Returned", side: "destination", optional: 0.5 },
];

// Disruption pool: [key, label, delta, probability, source]. `source` feeds
// the source-reliability multiplier in the confidence engine (Settings tab).
const DISRUPTIONS = [
  { key: "delay", label: "Unexpected Delay", delta: -3, p: 0.30, source: "Carrier EDI" },
  { key: "customsHold", label: "Customs Inspection Flagged", delta: -16, p: 0.14, source: "Customs System" },
  { key: "missingScan", label: "Missing Scan", delta: -12, p: 0.10, source: "Manual Scan" },
  { key: "gpsAnomaly", label: "GPS Anomaly", delta: -10, p: 0.08, source: "GPS Telemetry" },
  { key: "weather", label: "Weather Disruption", delta: -4, p: 0.16, source: "Carrier EDI" },
  { key: "sealBroken", label: "Seal Broken", delta: -25, p: 0.035, source: "Terminal System" },
];
// How many days of schedule slip each disruption type typically causes.
// Only delay/weather/customs holds push the actual arrival date; the
// others are custody/visibility issues that don't necessarily change ETA.
const SCHEDULE_IMPACT_DAYS = { delay: 3, weather: 2, customsHold: 6, sealBroken: 2 };

// Recovery events, only used in the what-if simulator, to model a
// disruption getting resolved rather than only ever getting worse.
const RECOVERY_EVENTS = [
  { key: "customsCleared", label: "Customs Cleared", delta: 10 },
  { key: "reScanConfirmed", label: "Re-scan Confirmed", delta: 8 },
];

// Shared one-line reasoning for every tunable event type, used in both
// the Settings weight editor and the Simulator, so the explanation is
// consistent wherever the event shows up.
const EVENT_REASONS = {
  delay: "Routine and usually resolves on its own, a weak signal that anything is actually wrong with the SKU.",
  weather: "Affects timing, not custody, the goods themselves almost certainly weren't touched.",
  gpsAnomaly: "A real visibility gap, but often just a sensor or connectivity glitch rather than proof of tampering.",
  missingScan: "A process failure, someone skipped a checkpoint. Moderately concerning on its own.",
  customsHold: "The container was physically opened and handled by a third party, a meaningfully stronger signal.",
  sealBroken: "Direct physical evidence of unauthorized access, the strongest signal something may be missing.",
  hormuz: "A narrow strait where regional military tension has occasionally led to vessel seizures or GPS interference.",
  gulfOfAden: "A known piracy corridor off the Somali coast, real risk of hijack, not just delay.",
  malacca: "The busiest strait in the world and a long-standing piracy hotspot, mostly small-scale theft.",
  redSea: "A corridor that has seen militia attacks on commercial shipping during periods of regional conflict.",
  watchlistTouch: "Origin or destination matches a location on your own compliance watchlist.",
  customsCleared: "Models the container clearing an existing customs hold, confidence recovers accordingly.",
  reScanConfirmed: "Models a missing or flagged scan getting reconciled at the next checkpoint.",
};

// Known real-world maritime chokepoints/high-risk corridors. `triggerPorts`
// is a simplified proxy for "this route plausibly transits this corridor", // based on which of our synthetic ports sit near it. A real product would
// determine this from actual AIS waypoint data, not port-name matching, and
// would source the risk-zone list itself from a live advisory feed (e.g.
// UKMTO's Voluntary Reporting Area or the Joint War Committee listed areas)
// rather than a hardcoded array, since these zones and their severity change.
const ROUTE_ZONES = [
  { key: "hormuz", label: "Strait of Hormuz", category: "Chokepoint / regional tension", delta: -6, triggerPorts: ["Jebel Ali"], source: "AIS Feed" },
  { key: "gulfOfAden", label: "Gulf of Aden / Somali Basin", category: "Piracy corridor", delta: -10, triggerPorts: ["Jebel Ali", "Colombo"], source: "AIS Feed" },
  { key: "malacca", label: "Strait of Malacca", category: "Piracy corridor", delta: -5, triggerPorts: ["Singapore", "Colombo", "Ningbo", "Shanghai"], source: "AIS Feed" },
  { key: "redSea", label: "Red Sea / Bab-el-Mandeb", category: "Regional conflict", delta: -8, triggerPorts: ["Jebel Ali", "Colombo"], source: "AIS Feed" },
];
const ROUTE_ZONE_LABELS = Object.fromEntries(ROUTE_ZONES.map((z) => [z.key, z.label]));

// Approximate lon/lat for the synthetic port set, used only to place dots
// and lanes on the control-tower map. Not survey-grade; good enough to make
// the geography readable at a glance.
const PORT_COORDS = {
  Shanghai: [121.5, 31.2], Rotterdam: [4.4, 51.9], "Los Angeles": [-118.2, 33.7],
  Singapore: [103.8, 1.3], Busan: [129.0, 35.1], Hamburg: [10.0, 53.5],
  Santos: [-46.3, -23.9], "Jebel Ali": [55.0, 25.0], Ningbo: [121.6, 29.9],
  Antwerp: [4.4, 51.2], "Long Beach": [-118.2, 33.8], Colombo: [79.8, 6.9],
};

// The line an experienced control-tower operator would actually write next
// to an exception. Deliberately opinionated, half of these say "don't act".
const OPERATOR_NOTES = {
  sealBroken: "Seal integrity is gone. Don't wait for the carrier's explanation, open a claim file now and inspect at gate-out.",
  customsHold: "Customs hold. Most of these clear in 48\u201372h. Only escalate if it's a contractual line or perishable.",
  missingScan: "Nine times out of ten this is terminal reporting lag, not a lost box. Chase the terminal before you chase the customer.",
  gpsAnomaly: "The tracker is drifting, not the container. Cross-check the carrier feed before you tell anyone anything.",
  dataConflict: "Two systems disagree. That's a sync problem, not a cargo problem. Reconcile it, don't escalate it.",
  timestampAnomaly: "Event logged out of sequence. Data quality issue; the physical move is probably fine.",
  customsHoldLate: "Customs hold on an already-late box. Assume the date is gone and re-plan.",
  weather: "Weather slip. Re-issue the ETA; expediting buys you nothing against a storm.",
  delay: "Routine slip. Re-issue the date rather than paying to expedite.",
  hormuz: "Transiting Hormuz. Watch for GPS interference in the position feed, it looks like a tracking fault but isn't.",
  gulfOfAden: "Piracy corridor. Nothing to do operationally, but flag it to insurance if the value is high.",
  malacca: "Malacca transit. Small-scale theft risk; worth a seal check at the next port, not an escalation.",
  redSea: "Red Sea routing. If this lane matters to you, ask the carrier now whether they're going around the Cape.",
  watchlistTouch: "Touches a watchlisted location. Compliance question before an operations one, route it to them first.",
};
function operatorNote(sku) {
  const cause = [...(sku.timeline || [])].reverse().find((e) => e.delta < 0);
  const key = cause?.type;
  if (key === "customsHold" && sku.isLate) return OPERATOR_NOTES.customsHoldLate;
  const base = OPERATOR_NOTES[key];
  if (base) return base;
  if (sku.confidence < 60) return "No single clear cause. Evidence has just thinned out across the chain. Treat the date as unsafe.";
  return "Nothing dramatic here. Watch it for another 24h before doing anything.";
}

// Data sources feeding the confidence engine, and how much to trust each
// one's anomaly reports by default, tunable in Settings. A known-noisy
// source (GPS telemetry glitches, manual scan human error) has its
// reported disruptions dampened rather than taken at full weight.
const DATA_SOURCES = ["Carrier EDI", "Terminal System", "GPS Telemetry", "Customs System", "Manual Scan", "AIS Feed"];
const DEFAULT_SOURCE_RELIABILITY = {
  "Carrier EDI": 1.0,
  "Terminal System": 1.0,
  "GPS Telemetry": 0.6,
  "Customs System": 1.0,
  "Manual Scan": 0.85,
  "AIS Feed": 0.9,
};
const DEFAULT_GRACE_HOURS = 24;
const CONFLICT_SOURCE_PAIRS = [
  ["Carrier EDI", "Terminal System"],
  ["GPS Telemetry", "Terminal System"],
  ["Customs System", "Carrier EDI"],
];
// Milestones that must have already occurred before a given disruption can
// legitimately be logged, used to catch data-entry/timestamp inconsistencies.
const DISRUPTION_PREREQUISITES = { customsHold: "exportCleared", sealBroken: "sealed" };

// Default point values, these become the starting values in the Settings
// tab, and can be edited live by the user. DEFAULT_WEIGHTS mirrors the PRD's
// FR4 weighting (plus route/compliance and data-quality risk); DEFAULT_THRESHOLDS mirrors FR6.
const DEFAULT_WEIGHTS = {
  ...Object.fromEntries(DISRUPTIONS.map((d) => [d.key, d.delta])),
  ...Object.fromEntries(ROUTE_ZONES.map((z) => [z.key, z.delta])),
  watchlistTouch: -20,
  dataConflict: -5,
  timestampAnomaly: -3,
};
const DEFAULT_THRESHOLDS = { clear: 95, monitor: 80 };


function riskFromConfidence(c, thresholds = DEFAULT_THRESHOLDS) {
  if (c >= thresholds.clear) return "clear";
  if (c >= thresholds.monitor) return "monitor";
  return "alert";
}
const RISK_META = {
  clear: { label: "Clear", color: C.teal, dim: C.tealDim },
  monitor: { label: "Monitor", color: C.amber, dim: C.amberDim },
  alert: { label: "Alert", color: C.coral, dim: C.coralDim },
};

// Simulated "calibration", stand-in for what a Bayesian/ML pass would
// produce once real historical outcome data exists (PRD v2). These factors
// widen or shrink each event's weight relative to whatever is set in
// Settings (defaulting to the v1 rule-based weights).
const CALIBRATION_FACTORS = {
  delay: 0.75,          // most delays resolve with no SKU impact -> softened
  customsHold: 1.35,    // correlates more strongly with real misplacement
  missingScan: 1.15,
  gpsAnomaly: 0.85,
  weather: 0.6,          // weather rarely translates into lost SKUs
  sealBroken: 1.15,
};

// Replays a timeline of events from a base of 100. Disruption-type events
// use whatever weight is currently set (from Settings, defaulting to the
// PRD values); in "calibrated" mode that weight is further multiplied by
// the illustrative calibration factor above, and always by the reporting
// source's reliability factor. Missing-scan events get special handling:
// within the grace window they don't count yet ("pending"), and if a later
// real milestone shows the SKU reappeared, the gap is reclassified as a
// harmless data glitch ("resolved") rather than a persistent risk. Used by
// the global mode toggle, the Settings live preview, and the simulator.
function computeTimeline(timeline, weights, mode, sourceReliability, graceHours) {
  let confidence = 100;
  return timeline.map((ev, idx) => {
    let baseWeight = weights[ev.type] ?? ev.delta ?? 0;
    let dataQualityStatus = null;

    if (ev.type === "missingScan") {
      const laterMilestone = timeline.some(
        (other, j) => j !== idx && EVENT_SEQUENCE.some((s) => s.key === other.type) && other.timestamp > ev.timestamp
      );
      if (laterMilestone) {
        baseWeight = 0;
        dataQualityStatus = "resolved";
      } else {
        const hoursSince = (NOW.getTime() - ev.timestamp.getTime()) / 3600000;
        if (hoursSince < graceHours) {
          baseWeight = 0;
          dataQualityStatus = "pending";
        } else {
          dataQualityStatus = "confirmed";
        }
      }
    }

    const calibFactor = mode === "calibrated" ? (CALIBRATION_FACTORS[ev.type] ?? 1) : 1;
    const reliabilityFactor = ev.source ? (sourceReliability[ev.source] ?? 1) : 1;
    const adjDelta = baseWeight === 0 ? 0 : Math.round(baseWeight * calibFactor * reliabilityFactor);
    confidence = Math.max(0, Math.min(100, confidence + adjDelta));
    return { ...ev, delta: adjDelta, confidenceAfter: confidence, dataQualityStatus };
  });
}

function generateData() {
  const shipments = [];
  const containers = [];
  const skus = [];

  let containerCounter = 1;
  let skuCounter = 1;
  let palletCounter = 1;

  const NUM_SHIPMENTS = 90;

  for (let s = 0; s < NUM_SHIPMENTS; s++) {
    const origin = pick(PORTS);
    let destination = pick(PORTS);
    while (destination === origin) destination = pick(PORTS);
    const vessel = pick(VESSELS);
    const departDaysAgo = randInt(1, 20);
    const remainingDays = randInt(2, 16);
    const transitDays = departDaysAgo + remainingDays; // total transit always exceeds elapsed time
    const plannedEta = new Date(NOW.getTime() + remainingDays * 86400000);
    let maxSlipDays = 0;

    const shipmentId = `SHP-${(20260000 + s).toString()}`;
    const numContainers = randInt(1, 3);
    const containerIds = [];

    // Determine which known high-risk corridors this route plausibly
    // passes through, based on origin/destination (see ROUTE_ZONES note
    // above on why this is a simplified proxy, not real route data).
    const candidateZones = ROUTE_ZONES.filter(
      (z) => z.triggerPorts.includes(origin) || z.triggerPorts.includes(destination)
    );
    const transitedZones = candidateZones.filter(() => rng() < 0.55);

    for (let c = 0; c < numContainers; c++) {
      const containerId = `CTR-${(400000 + containerCounter).toString()}`;
      containerCounter++;
      containerIds.push(containerId);

      // Build the event timeline progress for this container.
      // Assume containers are somewhere along the sequence based on transit.
      const progressFrac = Math.min(1, Math.max(0.15, departDaysAgo / transitDays));
      const numEventsReached = Math.max(3, Math.round(progressFrac * EVENT_SEQUENCE.length));

      const events = [];
      let t = NOW.getTime() - departDaysAgo * 86400000;
      let reachedCount = 0;
      for (let i = 0; i < EVENT_SEQUENCE.length && reachedCount < numEventsReached; i++) {
        const ev = EVENT_SEQUENCE[i];
        if (ev.optional && rng() > ev.optional) continue;
        t += randInt(1, 4) * 86400000 * 0.6 + randInt(0, 1439) * 60000;
        events.push({
          type: ev.key,
          label: ev.label,
          timestamp: new Date(t),
          location: ev.side === "origin" ? origin : ev.side === "destination" ? destination : "Transshipment Hub",
          delta: 0,
        });
        reachedCount++;
      }

      // Sprinkle disruptions in among the reached events.
      const disruptionEvents = [];
      DISRUPTIONS.forEach((d) => {
        if (rng() < d.p && events.length > 1) {
          const afterIdx = randInt(1, events.length - 1);
          const baseTime = events[afterIdx].timestamp.getTime();
          disruptionEvents.push({
            type: d.key,
            label: d.label,
            timestamp: new Date(baseTime + randInt(1, 6) * 3600000 + randInt(0, 59) * 60000),
            location: events[afterIdx].location,
            delta: d.delta,
            source: d.source,
          });
        }
      });
      // Schedule impact: only some disruption types push the actual arrival
      // date; track the worst slip seen across this shipment's containers.
      const slipDays = disruptionEvents.reduce((sum, ev) => sum + (SCHEDULE_IMPACT_DAYS[ev.type] || 0), 0);
      maxSlipDays = Math.max(maxSlipDays, slipDays);

      transitedZones.forEach((z) => {
        if (events.length > 1) {
          const afterIdx = randInt(1, events.length - 1);
          const baseTime = events[afterIdx].timestamp.getTime();
          disruptionEvents.push({
            type: z.key,
            label: `Transited ${z.label}`,
            timestamp: new Date(baseTime + randInt(1, 6) * 3600000 + randInt(0, 59) * 60000),
            location: z.label,
            delta: z.delta,
            source: z.source,
          });
        }
      });

      // Data conflict, two independent systems disagree on the shipment's
      // status. A mild trust signal (usually a sync/timing issue), not
      // proof of a physical problem.
      if (rng() < 0.08 && events.length > 1) {
        const afterIdx = randInt(1, events.length - 1);
        const anchor = events[afterIdx];
        const [srcA, srcB] = pick(CONFLICT_SOURCE_PAIRS);
        disruptionEvents.push({
          type: "dataConflict",
          label: `Data Conflict: ${srcA} vs ${srcB}`,
          timestamp: new Date(anchor.timestamp.getTime() + randInt(1, 6) * 3600000 + randInt(0, 59) * 60000),
          location: anchor.location,
          delta: DEFAULT_WEIGHTS.dataConflict,
        });
      }

      // Timestamp/logical-order anomaly detection, flags a disruption that
      // was logged before a milestone it logically depends on (e.g. a
      // customs hold recorded before export clearance even started). This
      // is real detection logic, not a seeded fake: it catches genuine
      // inconsistencies that can occur from the randomized generation above.
      Object.entries(DISRUPTION_PREREQUISITES).forEach(([disruptionKey, prereqKey]) => {
        const disruptionEvent = disruptionEvents.find((e) => e.type === disruptionKey);
        const prereqEvent = events.find((e) => e.type === prereqKey);
        if (disruptionEvent && (!prereqEvent || disruptionEvent.timestamp < prereqEvent.timestamp)) {
          const prereqLabel = EVENT_SEQUENCE.find((s) => s.key === prereqKey)?.label || prereqKey;
          disruptionEvents.push({
            type: "timestampAnomaly",
            label: `Timestamp Anomaly: "${disruptionEvent.label}" logged before "${prereqLabel}"`,
            timestamp: disruptionEvent.timestamp,
            location: disruptionEvent.location,
            delta: DEFAULT_WEIGHTS.timestampAnomaly,
          });
        }
      });

      // Container barging, routine intermodal handling at Rhine-connected
      // ports (Rotterdam/Antwerp/Hamburg), not a risk event, so delta is 0.
      const gateInEvent = events.find((e) => e.type === "gateIn");
      const dischargedEvent = events.find((e) => e.type === "discharged");
      if (BARGE_PORTS.includes(origin) && gateInEvent) {
        disruptionEvents.push({
          type: "bargeOrigin",
          label: "Barge Transfer, Inland Terminal to Port",
          timestamp: new Date(gateInEvent.timestamp.getTime() - 12 * 3600000),
          location: origin,
          delta: 0,
        });
      }
      if (BARGE_PORTS.includes(destination) && dischargedEvent) {
        disruptionEvents.push({
          type: "bargeDestination",
          label: "Barge Transfer, Port to Inland Terminal",
          timestamp: new Date(dischargedEvent.timestamp.getTime() + 12 * 3600000),
          location: destination,
          delta: 0,
        });
      }

      const fullTimeline = [...events, ...disruptionEvents].sort(
        (a, b) => a.timestamp - b.timestamp
      );

      // Compute confidence by replaying the timeline (base 100, floor 0).
      let confidence = 100;
      const timelineWithConfidence = fullTimeline.map((ev) => {
        confidence = Math.max(0, Math.min(100, confidence + ev.delta));
        return { ...ev, confidenceAfter: confidence };
      });

      const sealBroken = disruptionEvents.some((d) => d.type === "sealBroken");
      const gpsAnomaly = disruptionEvents.some((d) => d.type === "gpsAnomaly");

      containers.push({
        id: containerId,
        shipmentId,
        sealStatus: sealBroken ? "Broken" : "Intact",
        gpsStatus: gpsAnomaly ? "Anomaly" : "Active",
        timeline: timelineWithConfidence,
        confidence,
      });

      // SKUs for this container
      const numSkus = randInt(4, 9);
      const palletCount = randInt(1, Math.max(1, Math.floor(numSkus / 3)));
      const palletIds = Array.from({ length: palletCount }, () => `PAL-${(9000 + palletCounter++).toString()}`);
      const customer = pick(CUSTOMERS);
      for (let k = 0; k < numSkus; k++) {
        const skuId = `SKU-${(700000 + skuCounter).toString()}`;
        skuCounter++;
        const category = CATEGORIES[k % CATEGORIES.length];
        // Small per-SKU jitter so not every SKU in a container is identical,
        // reflecting occasional item-level missing scans.
        let skuConfidence = confidence;
        let skuTimeline = timelineWithConfidence;
        if (rng() < 0.06) {
          const drop = -randInt(5, 14);
          skuConfidence = Math.max(0, confidence + drop);
          skuTimeline = [
            ...timelineWithConfidence,
            {
              type: "missingScan",
              label: "Missing Scan (item-level)",
              timestamp: new Date(NOW.getTime() - randInt(0, 2) * 86400000),
              location: "In Transit",
              delta: drop,
              confidenceAfter: skuConfidence,
              source: "Manual Scan",
            },
          ];
        }
        const quantity = randInt(10, 500);
        const [priceLo, priceHi] = CATEGORY_UNIT_PRICE[category];
        const value = quantity * randInt(priceLo, priceHi);
        const slaTier = weightedPick(SLA_TIERS, SLA_TIER_WEIGHTS);
        const perishable = category === "Pharmaceuticals" ? true : rng() < 0.05;
        const shelfLifeDays = perishable ? randInt(5, 90) : null;
        // Real feeds are incomplete. A small share of records arrive with
        // fields the source never populated, shown as "n/a", never invented.
        const customerMissing = rng() < 0.025;
        skus.push({
          id: skuId,
          description: `${category} item`,
          category,
          customer: customerMissing ? null : customer,
          quantity,
          value,
          slaTier,
          perishable,
          shelfLifeDays,
          palletId: palletIds[k % palletCount],
          containerId,
          shipmentId,
          confidence: skuConfidence,
          risk: riskFromConfidence(skuConfidence),
          timeline: skuTimeline,
        });
      }
    }

    const eta = new Date(plannedEta.getTime() + maxSlipDays * 86400000);
    const isLate = maxSlipDays > remainingDays;

    shipments.push({
      id: shipmentId,
      origin,
      destination,
      vessel,
      plannedEta,
      eta,
      isLate,
      containerIds,
      routeZones: transitedZones.map((z) => z.key),
      currentEvent: EVENT_SEQUENCE[Math.min(EVENT_SEQUENCE.length - 1,
        Math.round((departDaysAgo / transitDays) * EVENT_SEQUENCE.length))]?.label || "Booking Confirmed",
    });
  }

  return { shipments, containers, skus };
}

/* ---------------------------------------------------------
   SHARED UI BITS
--------------------------------------------------------- */
function RiskBadge({ risk }) {
  const m = RISK_META[risk];
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium"
      style={{ background: m.dim, color: m.color, fontFamily: FONT_MONO }}
    >
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: m.color }} />
      {m.label.toUpperCase()}
    </span>
  );
}

// Confidence is never just a number: the meter is paired with the evidence
// that produced it, contributors, sources, gaps and the recommended action.
function ConfidenceGauge({ value, thresholds, timeline }) {
  const risk = riskFromConfidence(value, thresholds);
  const color = RISK_META[risk].color;

  const detractors = (timeline ?? [])
    .filter((e) => e.delta < 0)
    .sort((a, b) => a.delta - b.delta)
    .slice(0, 3);
  const sources = Array.from(new Set((timeline ?? []).map((e) => e.source).filter(Boolean)));
  const gaps = (timeline ?? []).filter((e) => e.dataQualityStatus === "pending" || e.type === "missingScan");

  return (
    <div style={{ width: "100%", maxWidth: 300 }}>
      <div className="flex items-baseline justify-between">
        <span style={{ fontFamily: FONT_MONO, fontSize: 10, letterSpacing: 0.8, color: C.textFaint }}>CONFIDENCE</span>
        <span style={{ fontFamily: FONT_MONO, fontSize: 22, fontWeight: 600, color }}>{value.toFixed(0)}%</span>
      </div>
      <div className="mt-1.5 h-1.5 w-full overflow-hidden" style={{ background: C.panelAlt, borderRadius: 2 }}>
        <div
          style={{ width: `${value}%`, height: "100%", background: color, transition: "width 200ms ease" }}
        />
      </div>
      <div className="mt-1 flex justify-between" style={{ fontFamily: FONT_MONO, fontSize: 9.5, color: C.textFaint }}>
        <span>alert &lt; {thresholds.monitor}</span>
        <span>clear ≥ {thresholds.clear}</span>
      </div>

      <dl className="mt-3 flex flex-col gap-1.5">
        <EvidenceRow label="Drivers">
          {detractors.length === 0
            ? "No penalties applied, clean chain."
            : detractors.map((d) => `${d.label} ${d.delta}`).join(" · ")}
        </EvidenceRow>
        <EvidenceRow label="Sources">{sources.length ? sources.join(" · ") : "n/a"}</EvidenceRow>
        <EvidenceRow label="Gaps">
          {gaps.length ? `${gaps.length} unreported milestone${gaps.length > 1 ? "s" : ""}` : "None open"}
        </EvidenceRow>
      </dl>

      <ConfidenceAdvice value={value} thresholds={thresholds} />
    </div>
  );
}

function EvidenceRow({ label, children }) {
  return (
    <div className="flex gap-2" style={{ fontSize: 11.5, lineHeight: 1.45 }}>
      <dt style={{ fontFamily: FONT_MONO, fontSize: 10, color: C.textFaint, width: 58, flexShrink: 0, paddingTop: 1 }}>
        {label.toUpperCase()}
      </dt>
      <dd style={{ fontFamily: FONT_BODY, color: C.textMuted, margin: 0 }}>{children}</dd>
    </div>
  );
}

/* Milestone state, derived from what the model actually knows about the event. */
function custodyState(ev) {
  if (ev.simulated) return { key: "predicted", label: "PREDICTED", color: C.textMuted };
  if (ev.dataQualityStatus === "resolved") return { key: "resolved", label: "RESOLVED", color: C.teal };
  if (ev.dataQualityStatus === "pending") return { key: "delayed", label: "DELAYED", color: C.amber };
  if (ev.delta < 0) return { key: "exception", label: "EXCEPTION", color: C.coral };
  return { key: "verified", label: "VERIFIED", color: C.teal };
}

// The signature view: one dense row per milestone carrying event, time,
// location, evidence source, state and the confidence it left behind.
function CustodyLadder({ timeline, thresholds }) {
  return (
    <div className="relative" style={{ borderTop: `1px solid ${C.borderSoft}` }}>
      {timeline.map((ev, i) => {
        const st = custodyState(ev);
        const risk = riskFromConfidence(ev.confidenceAfter, thresholds);
        const confColor = RISK_META[risk].color;
        const dashed = st.key === "predicted" || st.key === "delayed";
        return (
          <div
            key={i}
            className="group grid gap-x-3 gap-y-1 py-2 pl-5 pr-1 md:grid-cols-[1fr_120px_86px_54px] md:items-baseline"
            style={{ borderBottom: `1px solid ${C.borderSoft}`, transition: "background 150ms ease" }}
            onMouseEnter={(e) => (e.currentTarget.style.background = C.panelAlt)}
            onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
          >
            {/* rail */}
            <span
              className="absolute left-[5px] w-px"
              style={{
                background: C.border,
                top: i === 0 ? 14 : 0,
                bottom: i === timeline.length - 1 ? "auto" : 0,
                height: i === timeline.length - 1 ? 14 : undefined,
                display: "none",
              }}
            />
            <div className="relative min-w-0">
              <span
                className="absolute"
                style={{
                  left: -18,
                  top: 5,
                  width: 7,
                  height: 7,
                  borderRadius: 4,
                  background: dashed ? "transparent" : st.color,
                  border: `1px solid ${st.color}`,
                }}
              />
              <div style={{ fontFamily: FONT_BODY, fontSize: 13, color: C.text, fontWeight: st.key === "exception" ? 600 : 400 }}>
                <Glossed text={ev.label} />
                {ev.delta < 0 && (
                  <span style={{ fontFamily: FONT_MONO, fontSize: 11.5, marginLeft: 6, color: C.coral }}>{ev.delta}</span>
                )}
              </div>
              <div style={{ fontFamily: FONT_MONO, fontSize: 10.5, color: C.textFaint, marginTop: 1 }}>
                {ev.location} · {ev.source ?? "no source"}
              </div>
            </div>

            <div style={{ fontFamily: FONT_MONO, fontSize: 11, color: C.textMuted }}>
              {ev.timestamp.toISOString().slice(0, 16).replace("T", " ")}
            </div>

            <div>
              <span
                style={{
                  fontFamily: FONT_MONO,
                  fontSize: 9.5,
                  letterSpacing: 0.6,
                  color: st.color,
                  border: `1px solid ${st.color}44`,
                  background: `${st.color}14`,
                  borderRadius: 3,
                  padding: "1px 5px",
                }}
              >
                {st.label}
              </span>
            </div>

            <div className="md:text-right" style={{ fontFamily: FONT_MONO, fontSize: 12, color: confColor }}>
              {ev.confidenceAfter}%
            </div>
          </div>
        );
      })}
    </div>
  );
}

function Panel({ children, style, className = "" }) {
  return (
    <div
      className={`rounded-md ${className}`}
      style={{
        background: C.panel,
        border: `1px solid ${C.borderSoft}`,
        boxShadow: "0 1px 2px rgba(0,0,0,0.35)",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

/* ---------------------------------------------------------
   OVERVIEW (DASHBOARD)
   Status strip -> map + priority queue -> event stream + trend.
   Every number in the strip is a filter, not a decoration.
--------------------------------------------------------- */
function DashboardView({ shipments, containers, skus, onSelectSku, onDrill, modeBar }) {
  const kpis = useMemo(() => {
    const avgConfidence = skus.reduce((a, s) => a + s.confidence, 0) / skus.length;
    const needAttention = new Set(skus.filter((s) => s.risk === "alert").map((s) => s.containerId)).size;
    const customsDelayed = new Set(
      skus.filter((s) => s.timeline.some((e) => e.type === "customsHold")).map((s) => s.containerId)
    ).size;
    const highValueAtRisk = new Set(
      skus.filter((s) => s.risk !== "clear" && s.value >= 20000).map((s) => s.containerId)
    ).size;
    return { avgConfidence, needAttention, customsDelayed, highValueAtRisk };
  }, [skus]);

  // One line per container: six rows of the same box is a queue nobody
  // can work from.
  const priority = useMemo(() => {
    const seen = new Set();
    return [...skus]
      .filter((s) => s.risk !== "clear")
      .sort((a, b) => b.priorityScore - a.priorityScore)
      .filter((s) => (seen.has(s.containerId) ? false : seen.add(s.containerId)))
      .slice(0, 6);
  }, [skus]);

  const recentEvents = useMemo(() => {
    const rows = [];
    for (const c of containers) {
      for (const e of c.timeline) rows.push({ ...e, containerId: c.id, shipmentId: c.shipmentId });
    }
    return rows
      .filter((e) => e.timestamp.getTime() <= NOW.getTime())
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 12);
  }, [containers]);

  const trend = useMemo(() => {
    const sample = skus.filter((_, i) => i % 3 === 0);
    const days = [];
    for (let d = 13; d >= 0; d--) {
      const cutoff = NOW.getTime() - d * 86400000;
      let sum = 0;
      for (const s of sample) {
        let v = 100;
        for (const e of s.timeline) {
          if (e.timestamp.getTime() <= cutoff) v = e.confidenceAfter;
          else break;
        }
        sum += v;
      }
      days.push({ d, value: sum / sample.length });
    }
    return days;
  }, [skus]);

  // Feed health. One source is deliberately behind, real control towers
  // always have one, and pretending otherwise is the tell of a fake demo.
  const feeds = useMemo(() => {
    const latest = {};
    for (const c of containers) {
      for (const e of c.timeline) {
        if (e.timestamp.getTime() > NOW.getTime()) continue;
        const src = e.source || "Carrier EDI";
        if (!latest[src] || e.timestamp > latest[src]) latest[src] = e.timestamp;
      }
    }
    return DATA_SOURCES.map((src) => {
      const ts = latest[src];
      const hrs = ts ? (NOW.getTime() - ts.getTime()) / 3600000 : null;
      return { src, hrs };
    });
  }, [containers]);
  const staleFeed = [...feeds].sort((a, b) => (b.hrs ?? 9999) - (a.hrs ?? 9999))[0];

  return (
    <div className="flex flex-col gap-4">
      <ReadThisFirst />

      {/* --- status strip: four numbers, each one a way in --- */}
      <div
        className="grid grid-cols-2 lg:grid-cols-4 overflow-hidden"
        style={{ border: `1px solid ${C.border}`, borderRadius: 6, background: C.panel }}
      >
        <StatusTile
          count={kpis.needAttention} unit="containers" label="Need attention"
          sub="Confidence below the alert line."
          color={C.coral} onClick={() => onDrill("alert")} first
        />
        <StatusTile
          count={kpis.customsDelayed} unit="containers" label="In customs"
          sub="Held for inspection. Mostly self-clears."
          color={C.amber} onClick={() => onDrill("customs")}
        />
        <StatusTile
          count={kpis.highValueAtRisk} unit="containers" label="High value at risk"
          sub="Over $20k behind weak evidence."
          color={C.coral} onClick={() => onDrill("highvalue")}
        />
        <StatusTile
          count={`${kpis.avgConfidence.toFixed(0)}%`} unit="" label="Fleet confidence"
          sub="Mean across every SKU in transit."
          color={kpis.avgConfidence >= 85 ? C.teal : C.amber} onClick={() => onDrill("all")}
        />
      </div>


      {staleFeed && (
        <div
          className="flex items-start gap-2 rounded-md px-3 py-2"
          style={{ background: C.panelAlt, border: `1px solid ${C.amberDim}` }}
        >
          <Radio size={13} color={C.amber} className="mt-0.5 shrink-0" />
          <span style={{ fontFamily: FONT_BODY, fontSize: 12, color: C.textMuted, lineHeight: 1.5 }}>
            <span style={{ color: C.amber, fontFamily: FONT_MONO, fontSize: 11 }}>SLOWEST FEED · </span>
            {staleFeed.hrs === null ? (
              <>No <Term term={staleFeed.src}>{staleFeed.src}</Term> message has landed in this window at all.</>
            ) : (
              <>Last <Term term={staleFeed.src}>{staleFeed.src}</Term> message came in{" "}
              {`${Math.floor(staleFeed.hrs)}h ${Math.round((staleFeed.hrs % 1) * 60)}m ago`}.</>
            )}{" "}
            Anything relying on it is older than it looks.
          </span>
        </div>
      )}

      {modeBar}

      <p
        style={{ fontFamily: FONT_BODY, fontSize: 12.5, lineHeight: 1.6, color: C.textMuted, maxWidth: 760 }}
      >
        Every number on this screen comes from SKU location confidence scoring across{" "}
        <span style={{ fontFamily: FONT_MONO, color: C.text }}>{shipments.length} shipments</span> and{" "}
        <span style={{ fontFamily: FONT_MONO, color: C.text }}>{skus.length} SKUs</span>. The dataset is
        synthetic, generated to behave like real ocean freight traffic, so nothing here is tied to a live
        carrier feed.
      </p>




      <div className="grid lg:grid-cols-[minmax(0,1.55fr)_minmax(0,1fr)] gap-4 items-start">
        <div className="flex flex-col gap-4 min-w-0">
          <RouteMap shipments={shipments} skus={skus} />
        <Panel className="p-0 overflow-hidden">
          <div className="px-4 py-3" style={{ borderBottom: `1px solid ${C.borderSoft}` }}>
            <div className="flex items-center justify-between gap-2">
              <h3 style={{ fontFamily: FONT_DISPLAY, color: C.text, fontSize: 14 }}>Coming in off the feeds</h3>
              <LiveDot label="LIVE" />
            </div>
          </div>
          <div className="overflow-x-auto" style={{ WebkitOverflowScrolling: "touch" }}>
            <table className="w-full" style={{ fontFamily: FONT_BODY, fontSize: 12, minWidth: 460 }}>
              <tbody>
                {recentEvents.map((e, i) => (
                  <tr key={i} style={{ borderTop: i ? `1px solid ${C.borderSoft}` : "none" }}>
                    <td className="px-4 py-1.5 whitespace-nowrap align-top" style={{ fontFamily: FONT_MONO, fontSize: 11, color: C.textFaint }}>
                      {e.timestamp.toISOString().slice(5, 16).replace("T", " ")}
                    </td>
                    <td className="py-1.5 pr-3 align-top" style={{ color: C.text }}>
                      <Glossed text={e.label} />
                    </td>
                    <td className="py-1.5 pr-3 whitespace-nowrap align-top" style={{ color: C.textMuted }}>{e.location}</td>
                    <td className="py-1.5 pr-4 text-right whitespace-nowrap align-top" style={{ fontFamily: FONT_MONO, fontSize: 11, color: e.delta < 0 ? C.coral : C.textFaint }}>
                      {e.delta < 0 ? e.delta : "n/a"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
        </div>
        <div className="flex flex-col gap-4 min-w-0">
        <Panel className="p-0 overflow-hidden">
          <div className="px-4 py-3" style={{ borderBottom: `1px solid ${C.borderSoft}` }}>
            <h3 style={{ fontFamily: FONT_DISPLAY, color: C.text, fontSize: 14 }}>What I'd chase first</h3>
            <p style={{ fontFamily: FONT_BODY, fontSize: 11.5, color: C.textFaint, marginTop: 2 }}>
              Ranked by value, urgency and how thin the evidence is.
            </p>
          </div>
          <div>
            {priority.map((s) => (
              <button
                key={s.id}
                onClick={() => onSelectSku(s.id)}
                className="w-full text-left px-4 py-3 block"
                style={{ borderBottom: `1px solid ${C.borderSoft}`, background: "transparent" }}
              >
                <div className="flex items-baseline justify-between gap-2">
                  <span style={{ fontFamily: FONT_MONO, fontSize: 12, color: C.text }}>{s.id}</span>
                  <span style={{ fontFamily: FONT_MONO, fontSize: 12, color: RISK_META[s.risk].color }}>
                    {s.confidence.toFixed(0)}%
                  </span>
                </div>
                <div style={{ fontFamily: FONT_BODY, fontSize: 11.5, color: C.textMuted, marginTop: 1 }} className="truncate">
                  {s.customer || "Customer not reported"} · ${s.value.toLocaleString()} · {s.urgency} urgency
                </div>
                <div
                  style={{
                    fontFamily: FONT_BODY, fontSize: 11.5, color: C.textMuted, lineHeight: 1.5,
                    marginTop: 6, paddingLeft: 8, borderLeft: `2px solid ${RISK_META[s.risk].color}`,
                  }}
                >
                  {operatorNote(s)}
                </div>
              </button>
            ))}
          </div>
          <button
            onClick={() => onDrill("all")}
            className="w-full px-4 py-2.5 flex items-center justify-center gap-1.5"
            style={{ fontFamily: FONT_MONO, fontSize: 11, color: C.teal, background: "transparent" }}
          >
            OPEN FULL EXCEPTION QUEUE <ChevronRight size={12} />
          </button>
        </Panel>
        <Panel className="p-4">
          <h3 style={{ fontFamily: FONT_DISPLAY, color: C.text, fontSize: 14 }}>Confidence, last 14 days</h3>
          <p style={{ fontFamily: FONT_BODY, fontSize: 11.5, color: C.textFaint, marginTop: 2, marginBottom: 10 }}>
            Fleet average. A falling line means evidence is decaying faster than it's being replaced.
          </p>
          <Sparkline data={trend} />
          <div className="flex items-baseline justify-between mt-3">
            <span style={{ fontFamily: FONT_MONO, fontSize: 11, color: C.textFaint }}>14D AGO {trend[0].value.toFixed(0)}%</span>
            <span style={{ fontFamily: FONT_DISPLAY, fontSize: 20, color: C.teal }}>{trend[trend.length - 1].value.toFixed(1)}%</span>
          </div>
        </Panel>
        </div>
      </div>
    </div>
  );
}

/* The masthead for the Overview tab: enlarged animated anchor, the project
   name at full size, and the one-line framing of what the tool actually is. */
function BrandMark() {
  return (
    <div className="mb-5 flex items-start gap-3 sm:gap-4">
      <span className="relative grid place-items-center shrink-0" style={{ width: 58, height: 58 }}>
        <span
          className="live-halo absolute inset-0 rounded-2xl"
          style={{ border: `1px solid ${C.teal}`, animation: "live-halo 3.2s ease-out infinite" }}
        />
        <span
          className="grid place-items-center"
          style={{ width: 58, height: 58, borderRadius: 14, background: C.tealDim, border: `1px solid ${C.teal}55` }}
        >
          <Anchor size={30} color={C.teal} className="logo-bob" style={{ animation: "logo-bob 4s ease-in-out infinite" }} />
        </span>
      </span>
      <span className="min-w-0">
        <h1
          style={{
            fontFamily: FONT_DISPLAY,
            fontSize: "clamp(26px, 5.4vw, 40px)",
            fontWeight: 600,
            letterSpacing: -0.9,
            lineHeight: 1.08,
            color: C.text,
            margin: 0,
          }}
        >
          Where Is My Shipment
        </h1>
        <span
          className="relative block overflow-hidden"
          style={{ height: 2, marginTop: 8, maxWidth: 320, background: C.borderSoft, borderRadius: 1 }}
        >
          <span
            className="logo-sweep absolute inset-y-0"
            style={{
              width: "42%",
              background: `linear-gradient(90deg, transparent, ${C.teal}, transparent)`,
              animation: "logo-sweep 3.6s cubic-bezier(0.45,0,0.2,1) infinite",
            }}
          />
        </span>
        <p
          style={{
            fontFamily: FONT_MONO,
            fontSize: 12,
            letterSpacing: 0.4,
            color: C.textMuted,
            marginTop: 8,
          }}
        >
          A probabilistic SKU location framework
        </p>
      </span>
    </div>
  );
}

/* A blinking indicator for anything fed by a (simulated) live stream. */
function LiveDot({ color = C.coral, label, size = 7 }) {
  return (
    <span className="inline-flex items-center gap-1.5 shrink-0">
      <span className="relative inline-grid place-items-center" style={{ width: size + 6, height: size + 6 }}>
        <span
          className="live-halo absolute rounded-full"
          style={{ width: size, height: size, background: color, animation: "live-halo 2s ease-out infinite" }}
        />
        <span
          className="live-dot rounded-full"
          style={{ width: size, height: size, background: color, animation: "live-blink 1.6s ease-in-out infinite" }}
        />
      </span>
      {label && (
        <span style={{ fontFamily: FONT_MONO, fontSize: 9.5, letterSpacing: 0.6, color }}>{label}</span>
      )}
    </span>
  );
}

/* The scoring mode is not a side switch, this strip shows, on every tab,
   what the active mode is doing to the numbers on screen right now, and what
   the other one would do instead. */
function ModeBar({ mode, active, alt, onSwitch, onExplain }) {
  const stat = (d) => {
    const avg = d.skus.reduce((a, s) => a + s.confidence, 0) / d.skus.length;
    const alerts = d.skus.filter((s) => s.risk === "alert").length;
    return { avg, alerts };
  };
  const a = stat(active);
  const b = stat(alt);
  const dAvg = b.avg - a.avg;
  const dAlerts = b.alerts - a.alerts;
  const isRule = mode === "rule";
  return (
    <div
      className="rounded-md px-3 py-2 flex flex-wrap items-center gap-x-3 gap-y-1"
      style={{ background: C.panel, border: `1px solid ${C.borderSoft}`, fontFamily: FONT_BODY, fontSize: 11.5, color: C.textMuted }}
    >
      <span style={{ fontFamily: FONT_MONO, fontSize: 10, letterSpacing: 0.6, color: isRule ? C.teal : C.amber }}>
        SCORING · {isRule ? "RULE-BASED" : "CALIBRATED"}
      </span>
      <span>
        Every score on this screen uses{" "}
        {isRule
          ? "the hand-set event weights from the Model tab."
          : "those same weights multiplied by illustrative calibration factors."}{" "}
        Fleet confidence <span style={{ fontFamily: FONT_MONO, color: C.text }}>{a.avg.toFixed(1)}%</span>,{" "}
        <span style={{ fontFamily: FONT_MONO, color: C.text }}>{a.alerts}</span> SKUs in Alert.
      </span>
      <button
        onClick={onSwitch}
        style={{ background: "transparent", border: "none", padding: 0, cursor: "pointer", color: C.text, textAlign: "left" }}
      >
        <span style={{ borderBottom: `1px dotted ${C.textFaint}` }}>
          Switch to {isRule ? "Calibrated" : "Rule-based"}:{" "}
          <span style={{ fontFamily: FONT_MONO, color: dAvg < 0 ? C.coral : dAvg > 0 ? C.teal : C.textFaint }}>
            {dAvg >= 0 ? "+" : ""}{dAvg.toFixed(1)} pts
          </span>
          ,{" "}
          <span style={{ fontFamily: FONT_MONO, color: dAlerts > 0 ? C.coral : dAlerts < 0 ? C.teal : C.textFaint }}>
            {dAlerts >= 0 ? "+" : ""}{dAlerts}
          </span>{" "}
          Alert SKUs
        </span>
      </button>
      <button
        onClick={onExplain}
        style={{ background: "transparent", border: "none", padding: 0, cursor: "pointer", fontFamily: FONT_MONO, fontSize: 10, letterSpacing: 0.5, color: C.teal }}
      >
        WHY TWO MODES →
      </button>
    </div>
  );
}

function StatusTile({ count, unit, label, sub, color, onClick, first }) {
  const [hover, setHover] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      className="text-left px-3.5 py-2.5 flex flex-col gap-0.5 h-full"
      style={{
        background: hover ? C.panelAlt : "transparent",
        border: "none",
        borderLeft: first ? "none" : `1px solid ${C.borderSoft}`,
        borderTop: `2px solid ${color}`,
        transition: "background 150ms ease",
      }}
    >
      <div className="flex items-baseline gap-1.5">
        <span style={{ fontFamily: FONT_DISPLAY, fontSize: 21, fontWeight: 600, lineHeight: 1.1, color }}>{count}</span>
        <span style={{ fontFamily: FONT_BODY, fontSize: 12, color: C.text, fontWeight: 500 }}>{label}</span>
      </div>
      <span style={{ fontFamily: FONT_BODY, fontSize: 11, color: C.textFaint, lineHeight: 1.4 }}>
        {unit ? `${unit} · ` : ""}{sub}
      </span>
    </button>
  );
}


/* Lanes and ports on an equirectangular frame. Positions are approximate, this is a situational display, not a navigation chart. */
function RouteMap({ shipments, skus }) {
  const lanes = useMemo(() => {
    const worstByShipment = {};
    for (const s of skus) {
      const cur = worstByShipment[s.shipmentId];
      if (cur === undefined || s.confidence < cur) worstByShipment[s.shipmentId] = s.confidence;
    }
    const scored = shipments
      .filter((s) => PORT_COORDS[s.origin] && PORT_COORDS[s.destination])
      .map((s) => ({ ...s, worst: worstByShipment[s.id] ?? 100 }))
      .sort((a, b) => a.worst - b.worst);
    // Keep the worst lanes, but always carry a few healthy ones so the map
    // reads as a fleet picture rather than a wall of red.
    const flagged = scored.filter((s) => riskFromConfidence(s.worst) !== "clear").slice(0, 16);
    const clear = scored.filter((s) => riskFromConfidence(s.worst) === "clear").slice(-6);
    return [...clear, ...flagged];
  }, [shipments, skus]);


  const px = (lon) => lon + 180;
  const py = (lat) => 90 - lat;

  return (
    <Panel className="p-0 overflow-hidden">
      <div className="px-4 py-3" style={{ borderBottom: `1px solid ${C.borderSoft}` }}>
        <div className="min-w-0">
          <h3 style={{ fontFamily: FONT_DISPLAY, color: C.text, fontSize: 14 }}>Where everything is right now</h3>
          <p style={{ fontFamily: FONT_BODY, fontSize: 11.5, color: C.textFaint, marginTop: 2 }}>
            22 busiest lanes, coloured by the weakest SKU on board.
          </p>
        </div>
        <div className="mt-2.5 flex flex-col gap-1">
          {[
            ["Clear", C.teal, `every SKU on the lane scores ${DEFAULT_THRESHOLDS.clear}% or above. Nothing to do.`],
            ["Monitor", C.amber, `weakest SKU sits between ${DEFAULT_THRESHOLDS.monitor}% and ${DEFAULT_THRESHOLDS.clear - 1}%. Evidence is thinning.`],
            ["Alert", C.coral, `weakest SKU is below ${DEFAULT_THRESHOLDS.monitor}%. Someone should look at it today.`],
          ].map(([l, c, desc]) => (
            <span key={l} className="flex items-start gap-2" style={{ fontFamily: FONT_BODY, fontSize: 11, color: C.textFaint }}>
              <span className="w-3.5 h-0.5 rounded-full shrink-0" style={{ background: c, marginTop: 6 }} />
              <span>
                <span style={{ fontFamily: FONT_MONO, color: c, fontSize: 10.5 }}>{l.toUpperCase()}</span>{" "}
                {desc}
              </span>
            </span>
          ))}
        </div>
      </div>

      <svg viewBox="0 25 360 100" style={{ width: "100%", display: "block", background: "#060B0F" }}>
        {[-120, -60, 0, 60, 120].map((lon) => (
          <line key={lon} x1={px(lon)} x2={px(lon)} y1={25} y2={125} stroke={C.borderSoft} strokeWidth={0.3} />
        ))}
        {[60, 30, 0, -30].map((lat) => (
          <line key={lat} x1={0} x2={360} y1={py(lat)} y2={py(lat)} stroke={C.borderSoft} strokeWidth={0.3} />
        ))}
        <line x1={0} x2={360} y1={py(0)} y2={py(0)} stroke={C.border} strokeWidth={0.5} strokeDasharray="2 3" />

        {lanes.map((s) => {
          const [ax, ay] = [px(PORT_COORDS[s.origin][0]), py(PORT_COORDS[s.origin][1])];
          const [bx, by] = [px(PORT_COORDS[s.destination][0]), py(PORT_COORDS[s.destination][1])];
          const risk = riskFromConfidence(s.worst);
          const color = RISK_META[risk].color;
          const mx = (ax + bx) / 2;
          const my = (ay + by) / 2 - Math.abs(bx - ax) * 0.13;
          return (
            <path
              key={s.id}
              d={`M ${ax} ${ay} Q ${mx} ${my} ${bx} ${by}`}
              fill="none"
              stroke={color}
              strokeWidth={risk === "alert" ? 0.8 : 0.55}
              strokeOpacity={risk === "clear" ? 0.6 : 0.8}

            />
          );
        })}

        {Object.entries(PORT_COORDS).map(([name, [lon, lat]]) => (
          <g key={name}>
            <circle cx={px(lon)} cy={py(lat)} r={1.6} fill={C.teal} fillOpacity={0.9} />
            <text
              x={px(lon) + 3} y={py(lat) + 1.6}
              fill={C.textMuted} fontSize={4} fontFamily="'IBM Plex Mono', monospace"
            >
              {name}
            </text>
          </g>
        ))}
      </svg>
    </Panel>
  );
}

function Sparkline({ data }) {
  const values = data.map((d) => d.value);
  const min = Math.min(...values) - 1;
  const max = Math.max(...values) + 1;
  const pts = values.map((v, i) => [
    (i / (values.length - 1)) * 100,
    30 - ((v - min) / (max - min)) * 26,
  ]);
  const line = pts.map(([x, y], i) => `${i ? "L" : "M"} ${x.toFixed(2)} ${y.toFixed(2)}`).join(" ");
  const area = `${line} L 100 32 L 0 32 Z`;
  return (
    <svg viewBox="0 0 100 34" preserveAspectRatio="none" style={{ width: "100%", height: 76, display: "block" }}>
      <path d={area} fill={C.teal} fillOpacity={0.08} />
      <path d={line} fill="none" stroke={C.teal} strokeWidth={0.9} vectorEffect="non-scaling-stroke" />
      <circle cx={pts[pts.length - 1][0]} cy={pts[pts.length - 1][1]} r={1.2} fill={C.teal} />
    </svg>
  );
}

function InfoCell({ label, value, highlight }) {
  return (
    <div className="px-3 py-1.5" style={{ borderLeft: `1px solid ${C.borderSoft}` }}>
      <div style={{ fontFamily: FONT_MONO, color: C.textFaint, fontSize: 9.5, letterSpacing: 0.6, textTransform: "uppercase" }}>
        {label}
      </div>
      <div style={{ fontFamily: FONT_MONO, color: highlight ? C.coral : C.text, fontSize: 12, marginTop: 1, lineHeight: 1.35 }}>
        {value}
      </div>
    </div>
  );
}


/* ---------------------------------------------------------
   EXCEPTIONS VIEW
--------------------------------------------------------- */
function ExceptionsView({ skus, onSelectSku, preset }) {
  const [filter, setFilter] = useState("alert");
  const [causeFilter, setCauseFilter] = useState(null);
  const [urgencyFilter, setUrgencyFilter] = useState([]);
  const [slaFilter, setSlaFilter] = useState([]);
  const [perishableOnly, setPerishableOnly] = useState(false);
  const [lateOnly, setLateOnly] = useState(false);
  const [minValue, setMinValue] = useState("");
  const [customListInput, setCustomListInput] = useState("");
  const [sortMode, setSortMode] = useState("confidence");

  const toggleIn = (arr, setArr, val) => {
    setArr(arr.includes(val) ? arr.filter((v) => v !== val) : [...arr, val]);
  };

  // Drill-downs from the control tower land here pre-filtered, so the
  // number you clicked and the list you get are provably the same set.
  useEffect(() => {
    if (!preset) return;
    setUrgencyFilter([]); setSlaFilter([]); setPerishableOnly(false); setLateOnly(false);
    setCustomListInput("");
    if (preset.key === "alert") { setFilter("alert"); setCauseFilter(null); setMinValue(""); setSortMode("priority"); }
    if (preset.key === "customs") { setFilter("all"); setCauseFilter("customsHold"); setMinValue(""); setSortMode("priority"); }
    if (preset.key === "highvalue") { setFilter("all"); setCauseFilter(null); setMinValue("20000"); setSortMode("priority"); }
    if (preset.key === "all") { setFilter("all"); setCauseFilter(null); setMinValue(""); setSortMode("confidence"); }
  }, [preset]);

  const clearFilters = () => {
    setFilter("alert");
    setSortMode("confidence");
    setCauseFilter(null);
    setUrgencyFilter([]);
    setSlaFilter([]);
    setPerishableOnly(false);
    setLateOnly(false);
    setMinValue("");
    setCustomListInput("");
  };


  const filtered = useMemo(() => {
    let list;
    if (filter === "alert") list = skus.filter((s) => s.risk === "alert");
    else if (filter === "monitor") list = skus.filter((s) => s.risk === "monitor");
    else list = skus.filter((s) => s.risk !== "clear"); // "All flagged" = monitor + alert only

    if (causeFilter) list = list.filter((s) => s.timeline.some((e) => e.type === causeFilter));
    if (urgencyFilter.length > 0) list = list.filter((s) => urgencyFilter.includes(s.urgency));
    if (slaFilter.length > 0) list = list.filter((s) => slaFilter.includes(s.slaTier));
    if (perishableOnly) list = list.filter((s) => s.perishable);
    if (lateOnly) list = list.filter((s) => s.isLate);
    const minV = Number(minValue);
    if (minValue !== "" && !Number.isNaN(minV)) list = list.filter((s) => s.value >= minV);
    const customTerms = customListInput.split(",").map((t) => t.trim().toLowerCase()).filter(Boolean);
    if (customTerms.length > 0) {
      list = list.filter((s) => customTerms.some((t) => s.id.toLowerCase().includes(t) || (s.customer || "").toLowerCase().includes(t)));
    }

    const sorted = [...list].sort((a, b) =>
      sortMode === "priority" ? b.priorityScore - a.priorityScore : a.confidence - b.confidence
    );
    return sorted.slice(0, 60);
  }, [skus, filter, causeFilter, urgencyFilter, slaFilter, perishableOnly, lateOnly, minValue, customListInput, sortMode]);

  const tabs = [
    { key: "alert", label: "Alert" },
    { key: "monitor", label: "Monitor" },
    { key: "all", label: "All flagged" },
  ];

  const chipStyle = (active, color) => ({
    fontFamily: FONT_MONO,
    background: active ? C.panelAlt : "transparent",
    border: `1px solid ${active ? color : C.border}`,
    color: active ? color : C.textMuted,
  });

  return (
    <div className="flex flex-col gap-4">
      <Panel className="p-4">
        <div className="flex items-center justify-between mb-3">
          <span style={{ fontFamily: FONT_DISPLAY, color: C.text, fontSize: 13 }}>Filters</span>
          <button onClick={clearFilters} className="flex items-center gap-1.5 text-xs" style={{ fontFamily: FONT_MONO, color: C.textFaint }}>
            <RotateCcw size={11} /> CLEAR
          </button>
        </div>
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap gap-2 items-center">
            <span style={{ fontFamily: FONT_MONO, fontSize: 11, color: C.textFaint, minWidth: 62 }}>STATUS</span>
            {tabs.map((t) => (
              <button
                key={t.key}
                onClick={() => setFilter(t.key)}
                className="px-2.5 py-1 rounded-full text-xs"
                style={chipStyle(filter === t.key, C.teal)}
              >
                {t.label}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap gap-2 items-center">
            <span style={{ fontFamily: FONT_MONO, fontSize: 11, color: C.textFaint, minWidth: 62 }}>SORT BY</span>
            {[["confidence", "Lowest confidence"], ["priority", "Priority score"]].map(([k, l]) => (
              <button
                key={k}
                onClick={() => setSortMode(k)}
                className="px-2.5 py-1 rounded-full text-xs"
                style={chipStyle(sortMode === k, C.teal)}
              >
                {l}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap gap-2 items-center">
            <span style={{ fontFamily: FONT_MONO, fontSize: 11, color: C.textFaint, minWidth: 62 }}>URGENCY</span>
            {["Low", "Medium", "High"].map((u) => (
              <button key={u} onClick={() => toggleIn(urgencyFilter, setUrgencyFilter, u)} className="px-2.5 py-1 rounded-full text-xs" style={chipStyle(urgencyFilter.includes(u), C.amber)}>
                {u}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap gap-2 items-center">
            <span style={{ fontFamily: FONT_MONO, fontSize: 11, color: C.textFaint, minWidth: 62 }}>CAUSE</span>
            {[["customsHold", "Customs hold"], ["missingScan", "Missing scan"], ["sealBroken", "Seal broken"], ["gpsAnomaly", "GPS anomaly"]].map(([k, l]) => (
              <button key={k} onClick={() => setCauseFilter(causeFilter === k ? null : k)} className="px-2.5 py-1 rounded-full text-xs" style={chipStyle(causeFilter === k, C.coral)}>
                {l}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap gap-2 items-center">
            <span style={{ fontFamily: FONT_MONO, fontSize: 11, color: C.textFaint, minWidth: 62 }}>SLA TIER</span>
            {SLA_TIERS.map((t) => (
              <button key={t} onClick={() => toggleIn(slaFilter, setSlaFilter, t)} className="px-2.5 py-1 rounded-full text-xs" style={chipStyle(slaFilter.includes(t), C.teal)}>
                {t}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap gap-3 items-center">
            <label className="flex items-center gap-1.5 text-xs" style={{ fontFamily: FONT_BODY, color: C.text }}>
              <input type="checkbox" checked={perishableOnly} onChange={(e) => setPerishableOnly(e.target.checked)} />
              Perishable only
            </label>
            <label className="flex items-center gap-1.5 text-xs" style={{ fontFamily: FONT_BODY, color: C.text }}>
              <input type="checkbox" checked={lateOnly} onChange={(e) => setLateOnly(e.target.checked)} />
              Already late only
            </label>
            <div className="flex items-center gap-1.5">
              <span style={{ fontFamily: FONT_MONO, fontSize: 11, color: C.textFaint }}>MIN VALUE $</span>
              <input
                type="number" value={minValue} onChange={(e) => setMinValue(e.target.value)} placeholder="any"
                className="px-2 py-1 rounded text-xs w-24"
                style={{ background: C.panelAlt, border: `1px solid ${C.border}`, color: C.text, fontFamily: FONT_MONO }}
              />
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <span style={{ fontFamily: FONT_MONO, fontSize: 11, color: C.textFaint, minWidth: 62 }}>CUSTOM LIST</span>
            <input
              type="text" value={customListInput} onChange={(e) => setCustomListInput(e.target.value)}
              placeholder="SKU IDs or customer names, comma-separated"
              aria-label="Filter by custom SKU or customer list"
              className="flex-1 px-2.5 py-1.5 rounded text-xs"
              style={{ background: C.panelAlt, border: `1px solid ${C.border}`, color: C.text, fontFamily: FONT_MONO }}
            />
          </div>
        </div>
      </Panel>

      <Panel className="p-5">
        <div className="overflow-x-auto" style={{ overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
          <table className="w-full text-sm" style={{ fontFamily: FONT_BODY, minWidth: 520 }}>
            <thead>
              <tr style={{ color: C.textMuted, fontSize: 11 }} className="text-left">
                <th className="pb-2 pr-3 font-normal">SKU</th>
                <th className="pb-2 pr-3 font-normal">Customer</th>
                <th className="pb-2 pr-3 font-normal">Value</th>
                <th className="pb-2 pr-3 font-normal">Urgency</th>
                <th className="pb-2 pr-3 font-normal">SLA</th>
                <th className="pb-2 pr-3 font-normal">Container</th>
                <th className="pb-2 pr-3 font-normal">Confidence</th>
                <th className="pb-2 pr-3 font-normal">Risk</th>
                <th className="pb-2 pr-3 font-normal">Flagged for</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((s) => {
                const cause = [...s.timeline].reverse().find((e) => e.delta < 0);
                const displayEvent = cause || s.timeline[s.timeline.length - 1];
                const urgencyColor = s.urgency === "High" ? C.coral : s.urgency === "Medium" ? C.amber : C.textMuted;
                return (
                  <React.Fragment key={s.id}>
                  <tr
                    style={{ borderTop: `1px solid ${C.borderSoft}`, cursor: "pointer" }}
                    onClick={() => onSelectSku(s.id)}
                  >
                    <td className="py-2 pr-3" style={{ fontFamily: FONT_MONO, color: C.text }}>{s.id}</td>
                    <td className="py-2 pr-3" style={{ color: s.customer ? C.textMuted : C.textFaint }}>{s.customer || "n/a"}</td>
                    <td className="py-2 pr-3" style={{ fontFamily: FONT_MONO, color: C.textMuted }}>${s.value.toLocaleString()}</td>
                    <td className="py-2 pr-3" style={{ fontFamily: FONT_MONO, color: urgencyColor }}>
                      {s.urgency}{s.isLate ? " · LATE" : ""}
                    </td>
                    <td className="py-2 pr-3" style={{ color: C.textMuted, fontSize: 12 }}>{s.slaTier}</td>
                    <td className="py-2 pr-3" style={{ fontFamily: FONT_MONO, color: C.textMuted }}>{s.containerId}</td>
                    <td className="py-2 pr-3" style={{ fontFamily: FONT_MONO, color: RISK_META[s.risk].color }}>{s.confidence.toFixed(0)}%</td>
                    <td className="py-2 pr-3"><RiskBadge risk={s.risk} /></td>
                    <td className="py-2 pr-3" style={{ color: C.textMuted, fontSize: 12 }}><Glossed text={displayEvent?.label} /></td>
                  </tr>
                  <tr>
                    <td colSpan={9} className="pb-2.5" style={{ paddingLeft: 2 }}>
                      <div
                        style={{
                          fontFamily: FONT_BODY, fontSize: 11.5, color: C.textMuted, lineHeight: 1.5,
                          paddingLeft: 8, borderLeft: `2px solid ${RISK_META[s.risk].color}`, maxWidth: 620,
                        }}
                      >
                        <span style={{ fontFamily: FONT_MONO, fontSize: 10, color: C.textFaint }}>OPERATOR'S READ · </span>
                        {operatorNote(s)}
                      </div>
                    </td>
                  </tr>
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="py-6 text-center" style={{ color: C.textMuted, fontSize: 13 }}>
              Nothing matches these filters right now.
            </div>
          )}
        </div>
      </Panel>
    </div>
  );
}

/* ---------------------------------------------------------
   WHAT-IF SIMULATOR
--------------------------------------------------------- */
function SelectedSkuBar({ sku, onClear }) {
  if (!sku) return null;
  const m = RISK_META[sku.risk];
  return (
    <div
      className="fixed left-1/2 -translate-x-1/2 z-40 px-3"
      style={{ bottom: 16, maxWidth: "min(560px, calc(100vw - 24px))", width: "100%" }}
    >
      <div
        className="flex items-center gap-3 px-3 py-2.5 rounded-md"
        style={{
          background: "rgba(17,23,33,0.96)",
          backdropFilter: "blur(10px)",
          border: `1px solid ${C.teal}66`,
          boxShadow: `0 10px 30px rgba(0,0,0,0.5), 0 0 0 3px ${C.teal}14`,
        }}
      >
        <CheckCircle2 size={15} color={C.teal} className="shrink-0" />
        <div className="flex flex-col min-w-0">
          <span style={{ fontFamily: FONT_MONO, fontSize: 10, letterSpacing: 0.7, color: C.textFaint }}>
            SELECTED SKU
          </span>
          <span className="truncate" style={{ fontFamily: FONT_MONO, fontSize: 12.5, color: C.text }}>
            {sku.id} <span style={{ color: C.textMuted }}>· {sku.customer}</span>
          </span>
        </div>
        <span className="ml-auto shrink-0" style={{ fontFamily: FONT_MONO, fontSize: 13, color: m.color }}>
          {sku.confidence.toFixed(0)}%
        </span>
        <button
          onClick={onClear}
          className="shrink-0 flex items-center gap-1 px-2 py-1 rounded"
          style={{
            background: "transparent",
            border: `1px solid ${C.border}`,
            color: C.textMuted,
            fontFamily: FONT_MONO,
            fontSize: 10,
            letterSpacing: 0.6,
            cursor: "pointer",
          }}
          aria-label="Unselect SKU"
        >
          <X size={11} /> CLEAR
        </button>
      </div>
    </div>
  );
}

function WhatIfView({ skus, mode, weights, thresholds, sourceReliability }) {

  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState(skus[0]?.id || null);
  const [simEvents, setSimEvents] = useState([]);
  const [eventCategory, setEventCategory] = useState("disruption");
  const [queuedKeys, setQueuedKeys] = useState([]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    const matched = q
      ? skus.filter((s) => s.id.toLowerCase().includes(q) || s.customer.toLowerCase().includes(q))
      : skus;
    if (!selectedId) return matched;
    const sel = matched.find((s) => s.id === selectedId);
    return sel ? [sel, ...matched.filter((s) => s.id !== selectedId)] : matched;
  }, [query, skus, selectedId]);

  const sku = skus.find((s) => s.id === selectedId) || results[0];

  const resetAll = () => {
    setSimEvents([]);
    setQueuedKeys([]);
  };

  const selectSku = (id) => {
    if (id === selectedId) {
      setSelectedId(null);
      setSimEvents([]);
      setQueuedKeys([]);
      return;
    }

    setSelectedId(id);
    setSimEvents([]);
    setEventCategory("disruption");
    setQueuedKeys([]);
  };

  const eventOptions = eventCategory === "disruption"
    ? DISRUPTIONS.map((d) => ({ key: d.key, label: d.label, delta: weights[d.key] ?? d.delta, source: d.source }))
    : RECOVERY_EVENTS.map((d) => ({ key: d.key, label: d.label, delta: d.delta }));

  // Looks up a queued key against whichever list (disruption or recovery)
  // it belongs to, since the queue can hold a mix of both.
  const resolveOption = (key) => {
    const d = DISRUPTIONS.find((x) => x.key === key);
    if (d) return { key: d.key, label: d.label, delta: weights[d.key] ?? d.delta, source: d.source };
    const r = RECOVERY_EVENTS.find((x) => x.key === key);
    return r ? { key: r.key, label: r.label, delta: r.delta } : null;
  };

  const toggleQueued = (key) => {
    setQueuedKeys((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]));
  };

  const queuedOptions = queuedKeys.map(resolveOption).filter(Boolean);

  const runSimulation = () => {
    if (queuedOptions.length === 0) return;
    setSimEvents((prev) => [
      ...prev,
      ...queuedOptions.map((o) => ({ type: o.key, label: o.label, delta: o.delta, source: o.source })),
    ]);
    setQueuedKeys([]);
  };

  const previewTimeline = useMemo(() => {
    if (!sku) return [];
    let confidence = sku.timeline.length ? sku.timeline[sku.timeline.length - 1].confidenceAfter : sku.confidence;
    const extra = simEvents.map((ev) => {
      const baseWeight = weights[ev.type] ?? ev.delta;
      const factor = mode === "calibrated" ? (CALIBRATION_FACTORS[ev.type] ?? 1) : 1;
      const reliabilityFactor = ev.source ? (sourceReliability[ev.source] ?? 1) : 1;
      const adjDelta = Math.round(baseWeight * factor * reliabilityFactor);
      confidence = Math.max(0, Math.min(100, confidence + adjDelta));
      return { ...ev, delta: adjDelta, timestamp: new Date(), location: "Simulated", confidenceAfter: confidence, simulated: true };
    });
    return [...sku.timeline, ...extra];
  }, [sku, simEvents, mode, weights, sourceReliability]);

  const finalConfidence = previewTimeline.length ? previewTimeline[previewTimeline.length - 1].confidenceAfter : (sku?.confidence ?? 100);
  const finalRisk = riskFromConfidence(finalConfidence, thresholds);

  return (
    <div className="flex flex-col gap-5">
      <Panel className="p-4" style={{ background: C.panelAlt }}>
        <div className="flex items-start gap-2" style={{ fontFamily: FONT_BODY, color: C.textMuted, fontSize: 13, lineHeight: 1.5 }}>
          <PlayCircle size={15} color={C.teal} className="mt-0.5 shrink-0" />
          <span>
            Pick a SKU, then apply a hypothetical event to see how its confidence would move, without changing any real data. Useful for answering "should I expedite a backup shipment?" before committing.
          </span>
        </div>
      </Panel>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-5 min-w-0">
        <div className="md:col-span-2 flex flex-col gap-3 min-w-0 w-full overflow-hidden">
          <div className="flex items-center justify-between gap-2">
            <span style={{ fontFamily: FONT_MONO, fontSize: 10.5, letterSpacing: 0.8, color: C.textFaint }}>
              STEP 1 · PICK A SKU
            </span>
            <span style={{ fontFamily: FONT_MONO, fontSize: 10.5, letterSpacing: 0.6, color: C.textFaint }}>
              {results.length} OF {skus.length}
            </span>
          </div>
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" color={C.textMuted} />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search SKU or customer…"
              className="w-full min-w-0 pl-9 pr-3 py-2.5 rounded-md outline-none text-sm"
              style={{ background: C.panelAlt, border: `1px solid ${C.border}`, color: C.text, fontFamily: FONT_MONO }}
            />
          </div>
          <div className="flex flex-col gap-2 max-h-[260px] md:max-h-[440px] overflow-y-auto pr-1">

            {results.map((s) => {
              const active = sku && s.id === sku.id;
              const m = RISK_META[s.risk];
              return (
                <button
                  key={s.id}
                  onClick={() => selectSku(s.id)}
                  className="text-left p-3 rounded-md flex items-center justify-between gap-2"
                  style={{
                    background: active ? `${C.teal}14` : C.panel,
                    border: `1px solid ${active ? C.teal : C.border}`,
                    boxShadow: active ? `0 0 0 3px ${C.teal}1f` : "none",
                    transition: "background 150ms ease, box-shadow 150ms ease",
                  }}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    {active && <CheckCircle2 size={15} color={C.teal} className="shrink-0" />}
                    <div className="flex flex-col gap-0.5 min-w-0">
                      <span className="truncate" style={{ fontFamily: FONT_MONO, color: active ? C.teal : C.text, fontSize: 13 }}>{s.id}</span>
                      <span className="truncate" style={{ fontFamily: FONT_BODY, color: C.textMuted, fontSize: 12 }}>{s.customer}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {active && (
                      <span style={{ fontFamily: FONT_MONO, fontSize: 9.5, letterSpacing: 0.6, color: C.teal, border: `1px solid ${C.teal}66`, borderRadius: 4, padding: "1px 5px" }}>
                        SELECTED
                      </span>
                    )}
                    <span style={{ fontFamily: FONT_MONO, color: m.color, fontSize: 13 }}>{s.confidence.toFixed(0)}%</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="md:col-span-3 flex flex-col gap-5">
          {sku && (
            <>
              <Panel className="p-4 sm:p-6">
                <div
                  className="flex flex-wrap items-center gap-x-3 gap-y-2 pb-3 mb-4"
                  style={{ borderBottom: `1px solid ${C.borderSoft}` }}
                >
                  <span className="truncate" style={{ fontFamily: FONT_MONO, fontSize: 13, color: C.text }}>{sku.id}</span>
                  <span className="truncate" style={{ fontFamily: FONT_BODY, fontSize: 12.5, color: C.textMuted }}>{sku.customer}</span>
                  <span className="ml-auto"><RiskBadge risk={finalRisk} /></span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 min-w-0">
                  <div className="flex flex-col gap-1 min-w-0">
                    <span style={{ fontFamily: FONT_MONO, fontSize: 10, color: C.textFaint, letterSpacing: 0.8 }}>CURRENT</span>
                    <ConfidenceGauge value={sku.confidence} thresholds={thresholds} timeline={sku.timeline} />
                  </div>
                  <div className="flex flex-col gap-1 min-w-0">
                    <span style={{ fontFamily: FONT_MONO, fontSize: 10, color: C.textFaint, letterSpacing: 0.8 }}>
                      PROJECTED{simEvents.length > 0 ? ` · ${simEvents.length} applied` : ""}
                    </span>
                    <ConfidenceGauge value={finalConfidence} thresholds={thresholds} timeline={previewTimeline} />
                  </div>
                </div>
              </Panel>


              <Panel className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h4 style={{ fontFamily: FONT_DISPLAY, color: C.text, fontSize: 14 }}>Apply hypothetical events</h4>
                  {simEvents.length > 0 && (
                    <button
                      onClick={resetAll}
                      className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full"
                      style={{ fontFamily: FONT_MONO, color: C.textMuted, border: `1px solid ${C.border}` }}
                    >
                      <RotateCcw size={12} /> RESET
                    </button>
                  )}
                </div>

                <div style={{ fontFamily: FONT_BODY, color: C.textMuted, fontSize: 12.5, lineHeight: 1.5 }} className="mb-3">
                  Step 1: pick a category. Step 2: check one or more events (mix Disruption and Recovery if you
                  like). Step 3: hit Run to apply everything checked at once. You can run again afterward to
                  layer on more.
                </div>

                <div className="flex rounded-md overflow-hidden mb-3" style={{ border: `1px solid ${C.border}`, width: "fit-content" }}>
                  <button
                    onClick={() => setEventCategory("disruption")}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs"
                    style={{ fontFamily: FONT_MONO, background: eventCategory === "disruption" ? C.panelAlt : "transparent", color: eventCategory === "disruption" ? C.coral : C.textMuted }}
                  >
                    DISRUPTION
                  </button>
                  <button
                    onClick={() => setEventCategory("recovery")}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs"
                    style={{ fontFamily: FONT_MONO, background: eventCategory === "recovery" ? C.panelAlt : "transparent", color: eventCategory === "recovery" ? C.teal : C.textMuted }}
                  >
                    RECOVERY
                  </button>
                </div>

                <div className="grid sm:grid-cols-2 gap-2">
                  {eventOptions.map((o) => {
                    const checked = queuedKeys.includes(o.key);
                    const color = eventCategory === "disruption" ? C.coral : C.teal;
                    return (
                      <button
                        key={o.key}
                        onClick={() => toggleQueued(o.key)}
                        title={EVENT_REASONS[o.key] || ""}
                        className="text-left p-3 rounded-md flex items-center gap-2.5"
                        style={{ background: checked ? C.panelAlt : "transparent", border: `1px solid ${checked ? color : C.border}` }}
                      >
                        <span
                          className="shrink-0 flex items-center justify-center rounded"
                          style={{ width: 16, height: 16, border: `1.5px solid ${checked ? color : C.textFaint}`, background: checked ? color : "transparent" }}
                        >
                          {checked && <CheckCircle2 size={13} color={C.bg} />}
                        </span>
                        <span style={{ fontFamily: FONT_BODY, color: C.text, fontSize: 13, flex: 1 }}>{o.label}</span>
                        <span style={{ fontFamily: FONT_MONO, color, fontSize: 12 }}>
                          {eventCategory === "recovery" ? `+${o.delta}` : o.delta}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {queuedOptions.length > 0 && (
                  <div className="mt-4 p-3 rounded-md" style={{ background: C.panelAlt, border: `1px solid ${C.border}` }}>
                    <div style={{ fontFamily: FONT_MONO, fontSize: 11, color: C.textFaint }} className="mb-2">
                      QUEUED: {queuedOptions.length} EVENT{queuedOptions.length > 1 ? "S" : ""}
                    </div>
                    <div className="flex flex-wrap gap-2 mb-3">
                      {queuedOptions.map((o) => (
                        <span
                          key={o.key}
                          className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs"
                          style={{ fontFamily: FONT_MONO, color: C.text, background: o.delta < 0 ? C.coralDim : C.tealDim }}
                        >
                          {o.label} ({o.delta < 0 ? o.delta : `+${o.delta}`})
                          <button onClick={() => toggleQueued(o.key)} aria-label={`Remove ${o.label} from queue`}>
                            <X size={11} color={C.text} />
                          </button>
                        </span>
                      ))}
                    </div>
                    <div className="flex flex-col gap-1">
                      {queuedOptions.map((o) => (
                        <div key={o.key} style={{ fontFamily: FONT_BODY, color: C.textMuted, fontSize: 11.5, lineHeight: 1.4 }}>
                          <span style={{ color: C.text }}>{o.label}:</span> {EVENT_REASONS[o.key] || "Applies this event's confidence effect."}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <button
                  onClick={runSimulation}
                  disabled={queuedOptions.length === 0}
                  className="flex items-center justify-center gap-2 w-full mt-4 py-2.5 rounded-md text-sm"
                  style={{
                    fontFamily: FONT_DISPLAY,
                    background: queuedOptions.length > 0 ? C.teal : C.panelAlt,
                    color: queuedOptions.length > 0 ? C.bg : C.textFaint,
                    border: `1px solid ${queuedOptions.length > 0 ? C.teal : C.border}`,
                    cursor: queuedOptions.length > 0 ? "pointer" : "not-allowed",
                  }}
                >
                  <PlayCircle size={16} />
                  {queuedOptions.length > 0
                    ? `Run ${queuedOptions.length} Event${queuedOptions.length > 1 ? "s" : ""}`
                    : "Check one or more events above to run them"}
                </button>

                {simEvents.length > 0 && (
                  <div className="mt-5">
                    <h4 style={{ fontFamily: FONT_DISPLAY, color: C.text, fontSize: 14 }} className="mb-4 flex items-center gap-2">
                      <Radio size={14} color={C.amber} /> Projected chain of custody
                    </h4>
                    <CustodyLadder timeline={previewTimeline} thresholds={thresholds} />
                  </div>
                )}
              </Panel>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------
   SETTINGS, adjustable risk thresholds & event weights
--------------------------------------------------------- */
function SettingsView({
  weights, setWeights, thresholds, setThresholds, watchlist, setWatchlist,
  sourceReliability, setSourceReliability, graceHours, setGraceHours, previewSkus,
  mode, setMode,
}) {
  const [watchlistInput, setWatchlistInput] = useState("");

  const setWeight = (key, raw) => {
    let v = Math.round(Number(raw));
    if (Number.isNaN(v)) return;
    v = Math.max(-60, Math.min(0, v));
    setWeights((prev) => ({ ...prev, [key]: v }));
  };
  const setClear = (raw) => {
    let v = Math.round(Number(raw));
    if (Number.isNaN(v)) return;
    v = Math.max(1, Math.min(100, v));
    setThresholds((prev) => ({ ...prev, clear: Math.max(v, prev.monitor + 1) }));
  };
  const setMonitor = (raw) => {
    let v = Math.round(Number(raw));
    if (Number.isNaN(v)) return;
    v = Math.max(0, Math.min(99, v));
    setThresholds((prev) => ({ ...prev, monitor: Math.min(v, prev.clear - 1) }));
  };
  const setReliability = (source, raw) => {
    let v = Number(raw);
    if (Number.isNaN(v)) return;
    v = Math.max(0, Math.min(1.5, v));
    setSourceReliability((prev) => ({ ...prev, [source]: v }));
  };
  const setGrace = (raw) => {
    let v = Math.round(Number(raw));
    if (Number.isNaN(v)) return;
    v = Math.max(0, Math.min(96, v));
    setGraceHours(v);
  };
  const resetAll = () => {
    setWeights(DEFAULT_WEIGHTS);
    setThresholds(DEFAULT_THRESHOLDS);
    setSourceReliability(DEFAULT_SOURCE_RELIABILITY);
    setGraceHours(DEFAULT_GRACE_HOURS);
  };

  const addWatchlistEntry = () => {
    const v = watchlistInput.trim();
    if (!v) return;
    if (!watchlist.some((w) => w.toLowerCase() === v.toLowerCase())) {
      setWatchlist((prev) => [...prev, v]);
    }
    setWatchlistInput("");
  };
  const removeWatchlistEntry = (entry) => {
    setWatchlist((prev) => prev.filter((w) => w !== entry));
  };

  const previewCounts = useMemo(() => {
    const counts = { clear: 0, monitor: 0, alert: 0 };
    previewSkus.forEach((s) => counts[s.risk]++);
    return counts;
  }, [previewSkus]);
  const total = previewSkus.length || 1;


  const SOURCE_REASONS = {
    "Carrier EDI": "The shipping line's own electronic feed, generally reliable, occasional batch lag.",
    "Terminal System": "The port/terminal's own gate and yard system, generally reliable.",
    "GPS Telemetry": "Container-mounted GPS trackers, historically prone to signal loss and false anomalies.",
    "Customs System": "Government customs filings, authoritative, but subject to processing delay.",
    "Manual Scan": "A human scanning a barcode/RFID at a checkpoint, occasional human error.",
    "AIS Feed": "Vessel position broadcasts, generally reliable, occasional gaps in congested waters.",
  };

  const inputStyle = {
    background: C.panelAlt,
    border: `1px solid ${C.border}`,
    color: C.text,
    fontFamily: FONT_MONO,
    fontSize: 13,
    width: 76,
    padding: "6px 8px",
    borderRadius: 6,
    textAlign: "right",
  };

  return (
    <div className="flex flex-col gap-5">
      <Panel className="p-4" style={{ background: C.panelAlt }}>
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div className="flex items-start gap-2" style={{ fontFamily: FONT_BODY, color: C.textMuted, fontSize: 13, lineHeight: 1.5, maxWidth: 620 }}>
            <Settings size={15} color={C.teal} className="mt-0.5 shrink-0" />
            <span>
              <strong style={{ color: C.text, fontWeight: 600 }}>How the model is tuned.</strong> Every number
              below is a judgement call, not a technical setting: how much a customs hold should really count,
              where the line between "watch it" and "act on it" sits, how much to trust each data source.
              Change one and every tab, Dashboard, SKU Search, Exceptions, Simulator, updates instantly.
            </span>
          </div>
          <button
            onClick={resetAll}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full shrink-0"
            style={{ fontFamily: FONT_MONO, color: C.textMuted, border: `1px solid ${C.border}` }}
          >
            <RotateCcw size={12} /> RESET TO DEFAULT
          </button>
        </div>
      </Panel>

      <Panel className="p-6">
        <h3 style={{ fontFamily: FONT_DISPLAY, color: C.text, fontSize: 15 }} className="mb-1">
          Scoring model
        </h3>
        <p style={{ fontFamily: FONT_BODY, color: C.textMuted, fontSize: 13, lineHeight: 1.5 }} className="mb-4 max-w-2xl">
          Which model drives every score in the tool. Rule-based uses the weights you set below exactly as
          written. Calibrated multiplies those same weights by an illustrative adjustment factor, as a
          production system would once it had outcome history to learn from.
        </p>
        <div className="flex flex-col gap-2.5 max-w-2xl">
          {[
            ["rule", "Rule-based", "Hand-set weights, fully transparent. What you see below is exactly what is applied."],
            ["calibrated", "Calibrated", "Same weights × a hypothetical calibration factor derived from past outcomes."],
          ].map(([key, label, desc]) => {
            const active = mode === key;
            return (
              <button
                key={key}
                onClick={() => setMode(key)}
                className="flex items-start gap-3 p-3 rounded-md text-left"
                style={{
                  background: C.panelAlt,
                  border: `1px solid ${active ? C.teal : C.border}`,
                  cursor: "pointer",
                }}
              >
                <span
                  className="mt-1 shrink-0 rounded-full grid place-items-center"
                  style={{ width: 13, height: 13, border: `1px solid ${active ? C.teal : C.textFaint}` }}
                >
                  {active && <span className="rounded-full" style={{ width: 6, height: 6, background: C.teal }} />}
                </span>
                <span>
                  <span style={{ fontFamily: FONT_BODY, color: C.text, fontSize: 13.5, fontWeight: active ? 600 : 400, display: "block" }}>
                    {label}
                  </span>
                  <span style={{ fontFamily: FONT_BODY, color: C.textFaint, fontSize: 11.5, lineHeight: 1.45 }}>{desc}</span>
                </span>
              </button>
            );
          })}
        </div>
      </Panel>

      <Panel className="p-6">
        <h3 style={{ fontFamily: FONT_DISPLAY, color: C.text, fontSize: 15 }} className="mb-1">
          Risk thresholds
        </h3>
        <p style={{ fontFamily: FONT_BODY, color: C.textMuted, fontSize: 13, lineHeight: 1.5 }} className="mb-4 max-w-2xl">
          Where the line falls between Clear, Monitor, and Alert. Default is 95% / 80%.
        </p>
        <div className="grid sm:grid-cols-2 gap-4 max-w-xl">
          <label className="flex items-center justify-between gap-3 p-3 rounded-md" style={{ background: C.panelAlt, border: `1px solid ${C.border}` }}>
            <span style={{ fontFamily: FONT_BODY, color: C.text, fontSize: 13 }}>Clear at or above</span>
            <div className="flex items-center gap-1">
              <input type="number" value={thresholds.clear} onChange={(e) => setClear(e.target.value)} style={inputStyle} />
              <span style={{ fontFamily: FONT_MONO, color: C.textMuted, fontSize: 13 }}>%</span>
            </div>
          </label>
          <label className="flex items-center justify-between gap-3 p-3 rounded-md" style={{ background: C.panelAlt, border: `1px solid ${C.border}` }}>
            <span style={{ fontFamily: FONT_BODY, color: C.text, fontSize: 13 }}>Monitor at or above</span>
            <div className="flex items-center gap-1">
              <input type="number" value={thresholds.monitor} onChange={(e) => setMonitor(e.target.value)} style={inputStyle} />
              <span style={{ fontFamily: FONT_MONO, color: C.textMuted, fontSize: 13 }}>%</span>
            </div>
          </label>
        </div>
        <div className="mt-4 p-3 rounded-md text-sm" style={{ background: C.panelAlt, border: `1px solid ${C.border}`, fontFamily: FONT_MONO, fontSize: 12.5 }}>
          <span style={{ color: C.coral }}>Alert: below {thresholds.monitor}%</span>
          <span style={{ color: C.textFaint }}> · </span>
          <span style={{ color: C.amber }}>Monitor: {thresholds.monitor}–{thresholds.clear - 1}%</span>
          <span style={{ color: C.textFaint }}> · </span>
          <span style={{ color: C.teal }}>Clear: {thresholds.clear}% and above</span>
        </div>
      </Panel>

      <Panel className="p-6">
        <h3 style={{ fontFamily: FONT_DISPLAY, color: C.text, fontSize: 15 }} className="mb-1">
          Event weights
        </h3>
        <p style={{ fontFamily: FONT_BODY, color: C.textMuted, fontSize: 13, lineHeight: 1.5 }} className="mb-4 max-w-2xl">
          How many confidence points each disruption costs in Rule-based mode. Calibrated mode multiplies
          these same numbers by a fixed adjustment factor, see the Logic tab for the full comparison.
        </p>
        <div className="flex flex-col gap-2.5">
          {DISRUPTIONS.map((d) => (
            <div key={d.key} className="flex items-center justify-between gap-4 p-3 rounded-md flex-wrap" style={{ background: C.panelAlt, border: `1px solid ${C.border}` }}>
              <div className="flex-1 min-w-[220px]">
                <div style={{ fontFamily: FONT_BODY, color: C.text, fontSize: 13.5 }}><Glossed text={d.label} /></div>
                <div style={{ fontFamily: FONT_BODY, color: C.textFaint, fontSize: 11.5, lineHeight: 1.4, marginTop: 2 }}>
                  {EVENT_REASONS[d.key]}
                </div>
              </div>
              <input
                type="number"
                value={weights[d.key]}
                onChange={(e) => setWeight(d.key, e.target.value)}
                style={inputStyle}
              />
            </div>
          ))}
        </div>
      </Panel>

      <Panel className="p-6">
        <h3 style={{ fontFamily: FONT_DISPLAY, color: C.text, fontSize: 15 }} className="mb-1 flex items-center gap-2">
          <MapPinned size={15} color={C.coral} /> Route & compliance risk weights
        </h3>
        <p style={{ fontFamily: FONT_BODY, color: C.textMuted, fontSize: 13, lineHeight: 1.5 }} className="mb-4 max-w-2xl">
          Points deducted when a shipment's route plausibly transits a known high-risk maritime corridor,
          or touches a location on your watchlist below. These apply the same way as the event weights
          above, they show up as regular entries in a SKU's custody ladder.
        </p>
        <div className="flex flex-col gap-2.5">
          {ROUTE_ZONES.map((z) => (
            <div key={z.key} className="flex items-center justify-between gap-4 p-3 rounded-md flex-wrap" style={{ background: C.panelAlt, border: `1px solid ${C.border}` }}>
              <div className="flex-1 min-w-[220px]">
                <div style={{ fontFamily: FONT_BODY, color: C.text, fontSize: 13.5 }}>
                  {z.label} <span style={{ color: C.textFaint, fontSize: 11 }}>· {z.category}</span>
                </div>
                <div style={{ fontFamily: FONT_BODY, color: C.textFaint, fontSize: 11.5, lineHeight: 1.4, marginTop: 2 }}>
                  {EVENT_REASONS[z.key]}
                </div>
              </div>
              <input
                type="number"
                value={weights[z.key]}
                onChange={(e) => setWeight(z.key, e.target.value)}
                style={inputStyle}
              />
            </div>
          ))}
          <div className="flex items-center justify-between gap-4 p-3 rounded-md flex-wrap" style={{ background: C.panelAlt, border: `1px solid ${C.border}` }}>
            <div className="flex-1 min-w-[220px]">
              <div style={{ fontFamily: FONT_BODY, color: C.text, fontSize: 13.5 }}>Watchlist touch</div>
              <div style={{ fontFamily: FONT_BODY, color: C.textFaint, fontSize: 11.5, lineHeight: 1.4, marginTop: 2 }}>
                {EVENT_REASONS.watchlistTouch}
              </div>
            </div>
            <input
              type="number"
              value={weights.watchlistTouch}
              onChange={(e) => setWeight("watchlistTouch", e.target.value)}
              style={inputStyle}
            />
          </div>
        </div>

        <div className="mt-5 pt-5" style={{ borderTop: `1px solid ${C.border}` }}>
          <h4 style={{ fontFamily: FONT_DISPLAY, color: C.text, fontSize: 13.5 }} className="mb-1">
            Compliance watchlist
          </h4>
          <p style={{ fontFamily: FONT_BODY, color: C.textMuted, fontSize: 12.5, lineHeight: 1.5 }} className="mb-3 max-w-2xl">
            Type any port, country, or region name your own compliance process needs flagged, this is
            not a legal sanctions or denied-party list. Source that from your actual OFAC/EU/UN screening
            or legal team; this box only controls what <em>this prototype</em> highlights for you.
          </p>
          <div className="flex gap-2 mb-3">
            <input
              type="text"
              value={watchlistInput}
              onChange={(e) => setWatchlistInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addWatchlistEntry()}
              placeholder="e.g. a port or country name"
              aria-label="Add a location to the compliance watchlist"
              className="flex-1 px-3 py-2 rounded-md outline-none text-sm"
              style={{ background: C.panelAlt, border: `1px solid ${C.border}`, color: C.text, fontFamily: FONT_MONO }}
            />
            <button
              onClick={addWatchlistEntry}
              className="px-4 py-2 rounded-md text-sm shrink-0"
              style={{ fontFamily: FONT_BODY, color: C.teal, border: `1px solid ${C.tealDim}`, background: C.panelAlt }}
            >
              Add
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {watchlist.length === 0 && (
              <span style={{ fontFamily: FONT_BODY, color: C.textFaint, fontSize: 12.5 }}>
                No locations added yet, every shipment currently gets a "Clear" compliance flag.
              </span>
            )}
            {watchlist.map((w) => (
              <span
                key={w}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs"
                style={{ fontFamily: FONT_MONO, color: C.text, background: C.coralDim }}
              >
                {w}
                <button onClick={() => removeWatchlistEntry(w)} aria-label={`Remove ${w}`}>
                  <X size={11} color={C.text} />
                </button>
              </span>
            ))}
          </div>
        </div>
      </Panel>

      <Panel className="p-6">
        <h3 style={{ fontFamily: FONT_DISPLAY, color: C.text, fontSize: 15 }} className="mb-1 flex items-center gap-2">
          <Database size={15} color={C.teal} /> Data quality
        </h3>
        <p style={{ fontFamily: FONT_BODY, color: C.textMuted, fontSize: 13, lineHeight: 1.5 }} className="mb-4 max-w-2xl">
          Controls how much the confidence engine trusts what it's being told, separate from whether a
          disruption actually happened. See the Logic tab for how each of these works.
        </p>

        <div className="flex items-center justify-between gap-3 p-3 rounded-md flex-wrap mb-4" style={{ background: C.panelAlt, border: `1px solid ${C.border}` }}>
          <div className="flex-1 min-w-[220px]">
            <div style={{ fontFamily: FONT_BODY, color: C.text, fontSize: 13.5 }}>Missing-scan grace window</div>
            <div style={{ fontFamily: FONT_BODY, color: C.textFaint, fontSize: 11.5, lineHeight: 1.4, marginTop: 2 }}>
              A missing scan under this age doesn't count against confidence yet, most are just reporting lag.
            </div>
          </div>
          <div className="flex items-center gap-1">
            <input type="number" value={graceHours} onChange={(e) => setGrace(e.target.value)} style={inputStyle} />
            <span style={{ fontFamily: FONT_MONO, color: C.textMuted, fontSize: 13 }}>hrs</span>
          </div>
        </div>

        <div className="flex flex-col gap-2.5 mb-5">
          <div className="flex items-center justify-between gap-4 p-3 rounded-md flex-wrap" style={{ background: C.panelAlt, border: `1px solid ${C.border}` }}>
            <div className="flex-1 min-w-[220px]">
              <div style={{ fontFamily: FONT_BODY, color: C.text, fontSize: 13.5 }}>Data Conflict</div>
              <div style={{ fontFamily: FONT_BODY, color: C.textFaint, fontSize: 11.5, lineHeight: 1.4, marginTop: 2 }}>
                Two systems disagree on status, usually a sync/timing issue, not proof of a physical problem.
              </div>
            </div>
            <input type="number" value={weights.dataConflict} onChange={(e) => setWeight("dataConflict", e.target.value)} style={inputStyle} />
          </div>
          <div className="flex items-center justify-between gap-4 p-3 rounded-md flex-wrap" style={{ background: C.panelAlt, border: `1px solid ${C.border}` }}>
            <div className="flex-1 min-w-[220px]">
              <div style={{ fontFamily: FONT_BODY, color: C.text, fontSize: 13.5 }}>Timestamp Anomaly</div>
              <div style={{ fontFamily: FONT_BODY, color: C.textFaint, fontSize: 11.5, lineHeight: 1.4, marginTop: 2 }}>
                A disruption logged before a milestone it depends on, a real, detected data inconsistency.
              </div>
            </div>
            <input type="number" value={weights.timestampAnomaly} onChange={(e) => setWeight("timestampAnomaly", e.target.value)} style={inputStyle} />
          </div>
        </div>

        <h4 style={{ fontFamily: FONT_DISPLAY, color: C.text, fontSize: 13.5 }} className="mb-1">
          Source reliability
        </h4>
        <p style={{ fontFamily: FONT_BODY, color: C.textMuted, fontSize: 12.5, lineHeight: 1.5 }} className="mb-3 max-w-2xl">
          Multiplies every disruption's weight by how much you trust the system that reported it (1.0 = full
          weight, lower = dampened). A report from a historically noisy source moves confidence less.
        </p>
        <div className="flex flex-col gap-2.5">
          {DATA_SOURCES.map((src) => (
            <div key={src} className="flex items-center justify-between gap-4 p-3 rounded-md flex-wrap" style={{ background: C.panelAlt, border: `1px solid ${C.border}` }}>
              <div className="flex-1 min-w-[220px]">
                <div style={{ fontFamily: FONT_BODY, color: C.text, fontSize: 13.5 }}>{src}</div>
                <div style={{ fontFamily: FONT_BODY, color: C.textFaint, fontSize: 11.5, lineHeight: 1.4, marginTop: 2 }}>
                  {SOURCE_REASONS[src]}
                </div>
              </div>
              <input
                type="number" step="0.05"
                value={sourceReliability[src]}
                onChange={(e) => setReliability(src, e.target.value)}
                style={inputStyle}
              />
            </div>
          ))}
        </div>
      </Panel>

      <Panel className="p-6">
        <h3 style={{ fontFamily: FONT_DISPLAY, color: C.text, fontSize: 15 }} className="mb-4">
          Live preview, {previewSkus.length} SKUs at current settings
        </h3>
        <div className="flex h-3 rounded-full overflow-hidden mb-3" style={{ background: C.borderSoft }}>
          <div style={{ width: `${(100 * previewCounts.clear) / total}%`, background: C.teal }} />
          <div style={{ width: `${(100 * previewCounts.monitor) / total}%`, background: C.amber }} />
          <div style={{ width: `${(100 * previewCounts.alert) / total}%`, background: C.coral }} />
        </div>
        <div className="flex gap-5 flex-wrap" style={{ fontFamily: FONT_MONO, fontSize: 12.5 }}>
          <span style={{ color: C.teal }}>Clear {previewCounts.clear} ({((100 * previewCounts.clear) / total).toFixed(0)}%)</span>
          <span style={{ color: C.amber }}>Monitor {previewCounts.monitor} ({((100 * previewCounts.monitor) / total).toFixed(0)}%)</span>
          <span style={{ color: C.coral }}>Alert {previewCounts.alert} ({((100 * previewCounts.alert) / total).toFixed(0)}%)</span>
        </div>
      </Panel>
    </div>
  );
}

/* ---------------------------------------------------------
   INTEGRATIONS (illustrative, AIS live feed + ERP sync)
--------------------------------------------------------- */
function IntegrationsView({ skus }) {
  const [pings, setPings] = useState(() =>
    Array.from({ length: 4 }).map((_, i) => ({
      vessel: pick(VESSELS),
      lat: (randInt(-600, 600) / 10).toFixed(1),
      lon: (randInt(-1800, 1800) / 10).toFixed(1),
      speed: randInt(12, 22),
      ts: new Date(Date.now() - i * 240000),
    }))
  );

  useEffect(() => {
    const id = setInterval(() => {
      setPings((prev) => {
        const entry = {
          vessel: VESSELS[Math.floor(Math.random() * VESSELS.length)],
          lat: (Math.floor(Math.random() * 1200 - 600) / 10).toFixed(1),
          lon: (Math.floor(Math.random() * 3600 - 1800) / 10).toFixed(1),
          speed: 12 + Math.floor(Math.random() * 10),
          ts: new Date(),
        };
        return [entry, ...prev].slice(0, 6);
      });
    }, 4000);
    return () => clearInterval(id);
  }, []);

  const erpRows = useMemo(
    () =>
      skus.slice(0, 10).map((s, i) => ({
        sku: s.id,
        materialNumber: `MAT-${(100000 + i * 37).toString()}`,
        plant: pick(["US10", "DE20", "SG30", "NL40"]),
        salesOrder: `SO-${(5000000 + i * 91).toString()}`,
        status: pick(["Matched", "Matched", "Matched", "Pending", "Conflict"]),
        lastSynced: new Date(Date.now() - randInt(0, 6) * 3600000),
      })),
    [skus]
  );

  return (
    <div className="flex flex-col gap-5">
      <Panel className="p-4" style={{ background: C.panelAlt }}>
        <div className="flex items-start gap-2" style={{ fontFamily: FONT_BODY, color: C.textMuted, fontSize: 13, lineHeight: 1.5 }}>
          <Satellite size={15} color={C.amber} className="mt-0.5 shrink-0" />
          <span>
            This environment has no outbound access to real AIS feeds or an ERP system, so both panels
            below are simulated to illustrate what those integrations would surface once connected.
          </span>
        </div>
      </Panel>

      <Panel className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Satellite size={16} color={C.teal} />
          <h3 style={{ fontFamily: FONT_DISPLAY, color: C.text, fontSize: 15 }}>Live AIS vessel feed (simulated)</h3>
          <LiveDot label="STREAMING" />
        </div>
        <div className="flex flex-col gap-2">
          {pings.map((p, i) => (
            <div key={i} className="flex items-center justify-between p-2.5 rounded-md" style={{ background: C.panelAlt, border: `1px solid ${C.borderSoft}` }}>
              <div className="flex items-center gap-2">
                <Ship size={14} color={C.teal} />
                <span style={{ fontFamily: FONT_BODY, color: C.text, fontSize: 13 }}>{p.vessel}</span>
              </div>
              <span style={{ fontFamily: FONT_MONO, color: C.textMuted, fontSize: 12 }}>
                {p.lat}, {p.lon} · {p.speed} kn
              </span>
              <span style={{ fontFamily: FONT_MONO, color: C.textFaint, fontSize: 11 }}>
                {p.ts.toTimeString().slice(0, 8)}
              </span>
            </div>
          ))}
        </div>
      </Panel>

      <Panel className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Database size={16} color={C.amber} />
          <h3 style={{ fontFamily: FONT_DISPLAY, color: C.text, fontSize: 15 }}>ERP reconciliation (simulated SAP/Oracle sync)</h3>
        </div>
        <div className="overflow-x-auto" style={{ overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
          <table className="w-full text-sm" style={{ fontFamily: FONT_BODY, minWidth: 520 }}>
            <thead>
              <tr style={{ color: C.textMuted, fontSize: 11 }} className="text-left">
                <th className="pb-2 font-normal">SKU</th>
                <th className="pb-2 font-normal">Material No.</th>
                <th className="pb-2 font-normal">Plant</th>
                <th className="pb-2 font-normal">Sales Order</th>
                <th className="pb-2 font-normal">Sync Status</th>
                <th className="pb-2 font-normal">Last Synced</th>
              </tr>
            </thead>
            <tbody>
              {erpRows.map((r) => (
                <tr key={r.sku} style={{ borderTop: `1px solid ${C.borderSoft}` }}>
                  <td className="py-2" style={{ fontFamily: FONT_MONO, color: C.text }}>{r.sku}</td>
                  <td className="py-2" style={{ fontFamily: FONT_MONO, color: C.textMuted }}>{r.materialNumber}</td>
                  <td className="py-2" style={{ color: C.textMuted }}>{r.plant}</td>
                  <td className="py-2" style={{ fontFamily: FONT_MONO, color: C.textMuted }}>{r.salesOrder}</td>
                  <td className="py-2">
                    <span
                      className="px-2 py-0.5 rounded-full text-xs"
                      style={{
                        fontFamily: FONT_MONO,
                        color: r.status === "Matched" ? C.teal : r.status === "Pending" ? C.amber : C.coral,
                        background: r.status === "Matched" ? C.tealDim : r.status === "Pending" ? C.amberDim : C.coralDim,
                      }}
                    >
                      {r.status.toUpperCase()}
                    </span>
                  </td>
                  <td className="py-2" style={{ fontFamily: FONT_MONO, color: C.textFaint, fontSize: 12 }}>
                    {r.lastSynced.toTimeString().slice(0, 8)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}

/* ---------------------------------------------------------
   ALERTS BELL
--------------------------------------------------------- */
function AlertsBell({ skus, onSelectSku }) {
  const [open, setOpen] = useState(false);
  const [dismissed, setDismissed] = useState(() => new Set());

  const alertSkus = useMemo(
    () => skus.filter((s) => s.risk === "alert" && !dismissed.has(s.id)).sort((a, b) => a.confidence - b.confidence),
    [skus, dismissed]
  );

  const dismiss = (id) => setDismissed((prev) => new Set(prev).add(id));

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="relative flex items-center justify-center rounded-md p-2"
        style={{ border: `1px solid ${C.border}`, background: open ? C.panelAlt : "transparent" }}
      >
        <Bell size={16} color={alertSkus.length ? C.coral : C.textMuted} />
        {alertSkus.length > 0 && (
          <span
            className="absolute -top-1.5 -right-1.5 flex items-center justify-center rounded-full"
            style={{ background: C.coral, color: C.bg, fontFamily: FONT_MONO, fontSize: 10, width: 16, height: 16 }}
          >
            {alertSkus.length > 9 ? "9+" : alertSkus.length}
          </span>
        )}
      </button>
      {open && (
        <div
          className="absolute right-0 mt-2 w-80 max-h-96 overflow-y-auto rounded-md p-2 z-20"
          style={{ background: C.panel, border: `1px solid ${C.border}`, boxShadow: "0 10px 30px rgba(0,0,0,0.4)" }}
        >
          <div className="flex items-center justify-between px-2 py-1.5">
            <span style={{ fontFamily: FONT_DISPLAY, color: C.text, fontSize: 13 }}>Alert-risk SKUs</span>
            <span style={{ fontFamily: FONT_MONO, color: C.textFaint, fontSize: 11 }}>{alertSkus.length}</span>
          </div>
          {alertSkus.length === 0 && (
            <div className="flex items-center gap-2 p-3" style={{ color: C.textMuted, fontSize: 13, fontFamily: FONT_BODY }}>
              <CheckCircle2 size={14} color={C.teal} /> Nothing needs attention right now.
            </div>
          )}
          {alertSkus.slice(0, 12).map((s) => (
            <div
              key={s.id}
              className="flex items-center justify-between gap-2 p-2 rounded-md"
              style={{ borderTop: `1px solid ${C.borderSoft}` }}
            >
              <button
                onClick={() => { onSelectSku(s.id); setOpen(false); }}
                className="flex flex-col items-start text-left flex-1"
              >
                <span style={{ fontFamily: FONT_MONO, color: C.text, fontSize: 12.5 }}>{s.id}</span>
                <span style={{ fontFamily: FONT_BODY, color: C.textMuted, fontSize: 11.5 }}>
                  {s.customer} · {s.confidence.toFixed(0)}%
                </span>
              </button>
              <button onClick={() => dismiss(s.id)} aria-label="Dismiss">
                <X size={13} color={C.textFaint} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ---------------------------------------------------------
   LOGIC, how the confidence engine works, in plain terms
--------------------------------------------------------- */
function LogicView({ weights, thresholds }) {
  return (
    <div className="flex flex-col gap-6">
      {/* Problem */}
      <Panel className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <XCircle size={16} color={C.coral} />
          <h3 style={{ fontFamily: FONT_DISPLAY, color: C.text, fontSize: 16 }}>The problem</h3>
        </div>
        <p style={{ fontFamily: FONT_BODY, color: C.textMuted, fontSize: 14, lineHeight: 1.6 }} className="max-w-3xl">
          Ocean containers move as one tracked unit, but they don't travel as one thing, a single 40ft
          container can carry hundreds of SKUs belonging to different customers, categories, and pallets.
          Once that container is sealed, the tracking systems available today know where the box is, but
          not what's still reliably inside it.
        </p>
        <div className="grid sm:grid-cols-3 gap-3 mt-5">
          <ProblemCard
            icon={CircleDollarSign}
            title="Item-level tracking is too expensive"
            body="RFID or a tracker per SKU would give certainty, but the hardware, tagging labor, and reader infrastructure cost far more than the inventory it's tracking for most goods."
          />
          <ProblemCard
            icon={Layers}
            title="Container-level tracking is too coarse"
            body="A GPS or seal sensor on the container tells you where the box is, not whether a specific SKU inside it was pulled at customs, misrouted, or short-shipped."
          />
          <ProblemCard
            icon={TrendingDown}
            title="No confidence signal"
            body="Existing systems report deterministic events (departed, arrived) but never say how sure you should be that a given SKU is where the paperwork says it is."
          />
        </div>
        <div
          className="mt-5 p-4 rounded-md text-sm"
          style={{ background: C.panelAlt, border: `1px solid ${C.border}`, fontFamily: FONT_BODY, color: C.textMuted, lineHeight: 1.6 }}
        >
          The result: planners ask <em style={{ color: C.text }}>"Where is SKU X?"</em> and{" "}
          <em style={{ color: C.text }}>"Should I expedite a backup?"</em> and get an answer built on
          guesswork rather than a quantified answer they can act on or defend in a customer call.
        </div>
      </Panel>

      {/* Solution */}
      <Panel className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Scale size={16} color={C.teal} />
          <h3 style={{ fontFamily: FONT_DISPLAY, color: C.text, fontSize: 16 }}>The solution: probability-based tracking</h3>
        </div>
        <p style={{ fontFamily: FONT_BODY, color: C.textMuted, fontSize: 14, lineHeight: 1.6 }} className="max-w-3xl">
          Instead of adding hardware to every SKU, this framework infers each SKU's location and reliability from
          logistics events that already happen, packing scans, container seals, gate movements, customs
          holds. Every SKU starts at 100% confidence when it's verified packed and sealed inside its
          container. From there, the confidence score only moves when something logistically meaningful
          happens to that container or SKU. You can tune exactly how much each event costs, and where the
          Clear/Monitor/Alert lines sit, in the Settings tab, every number below reflects your current settings.
        </p>
        <p style={{ fontFamily: FONT_BODY, color: C.textMuted, fontSize: 14, lineHeight: 1.6 }} className="max-w-3xl mt-4">
          That confidence score is what turns "Container ABC is in Singapore" into{" "}
          <span style={{ color: C.text }}>"SKU 4589 has a 94% probability of being inside Container ABC,
          arriving Rotterdam in 6 days."</span>
        </p>
      </Panel>

      {/* Shipment milestone glossary */}
      <Panel className="p-6">
        <div className="flex items-center gap-2 mb-1">
          <Ship size={16} color={C.teal} />
          <h3 style={{ fontFamily: FONT_DISPLAY, color: C.text, fontSize: 16 }}>The shipment milestone chain, term by term</h3>
        </div>
        <p style={{ fontFamily: FONT_BODY, color: C.textMuted, fontSize: 14, lineHeight: 1.6 }} className="max-w-3xl mb-4">
          Every custody ladder you see is built from this sequence. It uses real industry terminology rather
          than generic labels, including where global and India-specific customs terms differ, since both
          are commonly taught and worth knowing.
        </p>
        <div className="flex flex-col gap-2">
          {[
            { label: "Booking Confirmed", side: "Origin", body: "The shipper reserves space with a carrier or NVOCC for a specific vessel and voyage." },
            { label: "Container Stuffing Completed", side: "Origin", body: "Cargo is physically packed into the container, at the factory (\"factory stuffing\") or a Container Freight Station (CFS)." },
            { label: "VGM Submitted", side: "Origin", body: "Verified Gross Mass, a mandatory SOLAS safety declaration of the container's total weight, required before it can be loaded." },
            { label: "Carrier Seal Affixed", side: "Origin", body: "The carrier's numbered seal is fitted to the container doors, the physical basis for later checking whether a seal was broken in transit." },
            { label: "Container Gate-In (Origin Terminal)", side: "Origin", body: "The container is physically received at the origin port/terminal, entering the terminal's custody." },
            { label: "Customs Export Clearance (LEO Issued)", side: "Origin", body: "The export declaration is filed and cleared. \"LEO\" (Let Export Order) is the Indian customs term for this release; other countries use their own export-declaration systems (e.g. the US's AES)." },
            { label: "Loaded per Stowage Plan", side: "Origin", body: "The container is craned aboard at the position assigned in the vessel's stowage plan (bay plan), which bay, row, and tier it sits in." },
            { label: "Bill of Lading Issued", side: "Origin", body: "The carrier issues the B/L, the contract of carriage and title document for the cargo. A Master B/L covers the whole shipment; a House B/L may be issued by a freight forwarder to the actual shipper." },
            { label: "Vessel Departure", side: "Origin", body: "ETD, the vessel sails from the origin port." },
            { label: "Transshipment at Hub Port", side: "In transit", body: "Some routes move cargo to a second vessel at a hub port rather than sailing direct, this step only appears when that happens." },
            { label: "Vessel Arrival", side: "Destination", body: "ETA, the vessel arrives and berths at the destination port." },
            { label: "Discharged from Vessel", side: "Destination", body: "The container is craned off the ship onto the destination terminal." },
            { label: "Import Manifest Filed", side: "Destination", body: "The carrier files an arrival manifest with customs before cargo can be released, called the IGM (Import General Manifest) in India; other customs authorities use their own manifest systems." },
            { label: "Customs Import Clearance", side: "Destination", body: "Duty is assessed and the shipment is cleared for release. In India this is the Bill of Entry, filed against the IGM by the importer or their customs broker (CHA)." },
            { label: "Container Gate-Out (Destination Terminal)", side: "Destination", body: "The container physically leaves the terminal, the point past which demurrage/detention charges are avoided if timed well." },
            { label: "Warehouse Received", side: "Destination", body: "The consignee (or their 3PL) confirms receipt at a warehouse or distribution center." },
            { label: "Delivered / Empty Returned", side: "Destination", body: "Final delivery to the consignee, and the empty container is returned to the carrier's depot." },
          ].map((row) => (
            <div key={row.label} className="flex items-start gap-3 p-2.5 rounded-md flex-wrap" style={{ borderTop: `1px solid ${C.borderSoft}` }}>
              <span
                className="shrink-0 px-2 py-0.5 rounded-full text-xs"
                style={{ fontFamily: FONT_MONO, color: C.textFaint, border: `1px solid ${C.border}`, minWidth: 74, textAlign: "center" }}
              >
                {row.side}
              </span>
              <div className="flex-1 min-w-[200px]">
                <div style={{ fontFamily: FONT_BODY, color: C.text, fontSize: 13.5 }}><Glossed text={row.label} /></div>
                <div style={{ fontFamily: FONT_BODY, color: C.textMuted, fontSize: 12.5, lineHeight: 1.5, marginTop: 2 }}>{row.body}</div>
              </div>
            </div>
          ))}
        </div>
        <div
          className="mt-4 p-3 rounded-md text-xs"
          style={{ background: C.panelAlt, border: `1px solid ${C.border}`, fontFamily: FONT_BODY, color: C.textMuted, lineHeight: 1.6 }}
        >
          Two more real details worth knowing: at Rhine-connected ports (Rotterdam, Antwerp, Hamburg), containers
          often move between the deep-sea terminal and inland terminals by barge rather than truck or rail, a
          documented, routine practice called container barging. When a route touches one of those ports, you'll
          see a neutral "Barge Transfer" entry in the custody ladder, it's an intermodal handling detail, not a
          risk event, so it doesn't move the confidence score. And "Customs Import/Export Clearance" above is the
          routine, expected paperwork step, it's distinct from "Customs Inspection Flagged" in the Settings
          weights, which represents the escalation where customs pulls the container for physical examination.
        </div>
      </Panel>

      {/* Weights + mode comparison */}
      <span id="logic-event-weights" aria-hidden="true" style={{ display: "block", scrollMarginTop: 96 }} />
      <Panel className="p-6">
        <div className="flex items-center gap-2 mb-1">
          <Sliders size={16} color={C.amber} />
          <h3 style={{ fontFamily: FONT_DISPLAY, color: C.text, fontSize: 16 }}>Event weights, and how Rule-based differs from Calibrated</h3>
        </div>
        <p style={{ fontFamily: FONT_BODY, color: C.textMuted, fontSize: 14, lineHeight: 1.6 }} className="max-w-3xl mb-4">
          Both modes replay the exact same event history for a SKU, nothing about what happened changes.
          The only difference is how many confidence points each event type costs. <strong style={{ color: C.text }}>Rule-based</strong> uses
          whatever weight is set in the Settings tab (the PRD's own values, unless you've changed them).{" "}
          <strong style={{ color: C.text }}>Calibrated</strong> takes that same starting weight and multiplies it by a fixed
          adjustment factor, a stand-in for what a real historical-outcomes analysis might conclude, since
          no such analysis exists yet. The table below shows both, using your current Settings:
        </p>
        <div className="overflow-x-auto" style={{ overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
          <table className="w-full text-sm" style={{ fontFamily: FONT_BODY, minWidth: 520 }}>
            <thead>
              <tr style={{ color: C.textMuted, fontSize: 11 }} className="text-left">
                <th className="pb-2 font-normal">Event</th>
                <th className="pb-2 font-normal">Rule-based</th>
                <th className="pb-2 font-normal">Calibrated</th>
                <th className="pb-2 font-normal">Why</th>
              </tr>
            </thead>
            <tbody>
              {[...DISRUPTIONS, ...ROUTE_ZONES, { key: "watchlistTouch", label: "Watchlist Touch" }, { key: "dataConflict", label: "Data Conflict" }, { key: "timestampAnomaly", label: "Timestamp Anomaly" }].map((d) => {
                const ruleWeight = weights[d.key];
                const factor = CALIBRATION_FACTORS[d.key] ?? 1;
                const calWeight = Math.round(ruleWeight * factor);
                return (
                  <tr key={d.key} style={{ borderTop: `1px solid ${C.borderSoft}` }}>
                    <td className="py-2.5" style={{ color: C.text }}><Glossed text={d.label} /></td>
                    <td className="py-2.5" style={{ fontFamily: FONT_MONO, color: C.coral }}>{ruleWeight}</td>
                    <td className="py-2.5" style={{ fontFamily: FONT_MONO, color: C.amber }}>
                      {calWeight} <span style={{ color: C.textFaint, fontSize: 11 }}>({factor}×)</span>
                    </td>
                    <td className="py-2.5 text-xs" style={{ color: C.textMuted, maxWidth: 260 }}>
                      {factor > 1
                        ? "Calibration assumes this correlates more strongly with real loss than the raw rule assumes, so it's weighted up."
                        : factor < 1
                        ? "Calibration assumes this rarely translates into an actual missing SKU, so it's weighted down."
                        : "Unchanged in calibration."}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div
          className="mt-4 p-3 rounded-md text-xs"
          style={{ background: C.panelAlt, border: `1px solid ${C.border}`, fontFamily: FONT_BODY, color: C.textMuted, lineHeight: 1.6 }}
        >
          Being direct about it: the calibration multipliers above are illustrative, not derived from real
          historical data, none exists yet. Rule-based is the honest v1: transparent, hand-set weights you
          can defend event by event. Calibrated exists to demonstrate the v2 direction the PRD describes, replacing hand-set weights with ones tuned against real outcomes once that data exists.
        </div>
      </Panel>

      {/* SKU prioritization & filters */}
      <Panel className="p-6">
        <div className="flex items-center gap-2 mb-1">
          <AlertTriangle size={16} color={C.amber} />
          <h3 style={{ fontFamily: FONT_DISPLAY, color: C.text, fontSize: 16 }}>Prioritizing SKUs, not just tracking them</h3>
        </div>
        <p style={{ fontFamily: FONT_BODY, color: C.textMuted, fontSize: 14, lineHeight: 1.6 }} className="max-w-3xl mb-4">
          In reality you need visibility into every SKU, but attention is finite, a planner can't treat a
          $40 phone case and a $12,000 pallet of equipment as equally urgent. The Exceptions tab lets you
          filter and sort on the signals below, on top of the existing risk tiers.
        </p>
        <div className="grid sm:grid-cols-2 gap-3 mb-4">
          <ProblemCard icon={CircleDollarSign} title="Value" body="A per-SKU dollar value (quantity × unit price). High-value SKUs get more weight in the Priority Score." />
          <ProblemCard icon={Clock} title="Urgency (Low/Medium/High)" body="Derived, not manually set: already-late shipments, perishables running low on shelf life, and tight time-to-ETA all raise it." />
          <ProblemCard icon={Scale} title="SLA tier" body="Standard, Priority, or Contractual SLA, a proxy for penalty/relationship exposure if this SKU is late." />
          <ProblemCard icon={CircleDollarSign} title="Perishable / shelf life" body="Pharmaceuticals are always flagged perishable; a small share of other categories are too, with a remaining shelf-life countdown." />
        </div>
        <p style={{ fontFamily: FONT_BODY, color: C.textMuted, fontSize: 14, lineHeight: 1.6 }} className="max-w-3xl">
          Already-late status comes directly from the confidence engine rather than being random: delay,
          weather, customs-hold, and seal-broken events each carry a realistic schedule-slip (in days). A
          shipment is flagged late when its <em>accumulated</em> slip exceeds the schedule buffer it started
          with, meaning known disruptions have already eaten through the cushion, so it's on track to miss
          its original promised date even though the displayed ETA (always shown as a sensible future date,
          never a confusing negative one) has simply moved out to account for it.
        </p>
        <div
          className="mt-4 p-3 rounded-md text-xs"
          style={{ background: C.panelAlt, border: `1px solid ${C.border}`, fontFamily: FONT_BODY, color: C.textMuted, lineHeight: 1.6 }}
        >
          <strong style={{ color: C.text }}>Priority Score</strong> = (100 − confidence) + urgency points
          (Low 0 / Medium 15 / High 30) + SLA points (Standard 0 / Priority 10 / Contractual SLA 20) + value
          points (0 / 10 / 20 by tier). Sort Exceptions by it to get one ranked worklist instead of juggling
          filters separately.
          <br /><br />
          Deliberately not modeled here: <strong style={{ color: C.text }}>production-dependency</strong>{" "}
          (a cheap part halting an assembly line) and <strong style={{ color: C.text }}>substitutability</strong>{" "}
          (how easily a SKU can be re-sourced). Both matter in the real world, they're a reasonable next step,
          not included in this pass.
        </div>
      </Panel>

      {/* Data quality safeguards */}
      <Panel className="p-6">
        <div className="flex items-center gap-2 mb-1">
          <Database size={16} color={C.teal} />
          <h3 style={{ fontFamily: FONT_DISPLAY, color: C.text, fontSize: 16 }}>Data quality: telling "risky" apart from "unreliable data"</h3>
        </div>
        <p style={{ fontFamily: FONT_BODY, color: C.textMuted, fontSize: 14, lineHeight: 1.6 }} className="max-w-3xl mb-4">
          A missing scan is usually a reporting gap, not proof the SKU is actually at risk, treating the two
          the same is one of the biggest gaps between a model like this and a real production system. Four
          safeguards, all tunable in Settings:
        </p>
        <div className="flex flex-col gap-3">
          <div className="p-4 rounded-md" style={{ background: C.panelAlt, border: `1px solid ${C.border}` }}>
            <div style={{ fontFamily: FONT_DISPLAY, color: C.text, fontSize: 13.5 }} className="mb-1">Grace window + self-healing</div>
            <p style={{ fontFamily: FONT_BODY, color: C.textMuted, fontSize: 12.5, lineHeight: 1.55 }}>
              A missing scan under the grace window (default 24h) doesn't cost confidence yet, it's marked{" "}
              <span style={{ color: C.amber }}>PENDING</span>. If a later checkpoint confirms the SKU
              reappeared, the gap is reclassified as{" "}
              <span style={{ color: C.teal }}>SELF-HEALED</span> with zero lasting impact. Only a scan that's
              both overdue past the grace window <em>and</em> never resolved counts as a real gap. Look for
              these tags directly in a SKU's custody ladder.
            </p>
          </div>
          <div className="p-4 rounded-md" style={{ background: C.panelAlt, border: `1px solid ${C.border}` }}>
            <div style={{ fontFamily: FONT_DISPLAY, color: C.text, fontSize: 13.5 }} className="mb-1">Conflict detection</div>
            <p style={{ fontFamily: FONT_BODY, color: C.textMuted, fontSize: 12.5, lineHeight: 1.55 }}>
              A small share of containers get a synthetic "two systems disagree" event (e.g. Carrier EDI vs
              Terminal System), a real category, but seeded at a flat rate here rather than arising from
              genuinely independent live feeds, which a real product would need.
            </p>
          </div>
          <div className="p-4 rounded-md" style={{ background: C.panelAlt, border: `1px solid ${C.border}` }}>
            <div style={{ fontFamily: FONT_DISPLAY, color: C.text, fontSize: 13.5 }} className="mb-1">Timestamp anomaly detection</div>
            <p style={{ fontFamily: FONT_BODY, color: C.textMuted, fontSize: 12.5, lineHeight: 1.55 }}>
              This one isn't seeded, it's real logic that checks whether a disruption was logged before a
              milestone it logically requires (a customs hold before export clearance even started; a broken
              seal before one was ever affixed). When the randomized generation above produces that
              inconsistency, this catches it.
            </p>
          </div>
          <div className="p-4 rounded-md" style={{ background: C.panelAlt, border: `1px solid ${C.border}` }}>
            <div style={{ fontFamily: FONT_DISPLAY, color: C.text, fontSize: 13.5 }} className="mb-1">Source reliability weighting</div>
            <p style={{ fontFamily: FONT_BODY, color: C.textMuted, fontSize: 12.5, lineHeight: 1.55 }}>
              Every disruption is tagged with the system that reported it (Carrier EDI, GPS Telemetry, Manual
              Scan, etc.), and its weight is multiplied by that source's trust factor. GPS Telemetry defaults
              to 0.6, a GPS anomaly moves confidence less than a seal-broken report from the Terminal System,
              because GPS trackers are a known-noisier source. Tune this per source in Settings.
            </p>
          </div>
        </div>
      </Panel>

      {/* What's simulated vs real */}
      <Panel className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Satellite size={16} color={C.coral} />
          <h3 style={{ fontFamily: FONT_DISPLAY, color: C.text, fontSize: 16 }}>What's simulated vs. real in this prototype</h3>
        </div>
        <p style={{ fontFamily: FONT_BODY, color: C.textMuted, fontSize: 14, lineHeight: 1.6 }} className="max-w-3xl mb-5">
          Everything about the confidence engine above is real, working logic running on synthetic data.
          These four things, however, are fabricated stand-ins for systems this environment can't actually reach:
        </p>

        <div className="flex flex-col gap-4">
          <div className="p-4 rounded-md" style={{ background: C.panelAlt, border: `1px solid ${C.border}` }}>
            <div className="flex items-center gap-2 mb-2">
              <Database size={14} color={C.amber} />
              <span style={{ fontFamily: FONT_DISPLAY, color: C.text, fontSize: 13.5 }}>ERP reconciliation</span>
            </div>
            <p style={{ fontFamily: FONT_BODY, color: C.textMuted, fontSize: 12.5, lineHeight: 1.55 }}>
              <strong style={{ color: C.text }}>What you see:</strong> the moment you open Integrations, this
              prototype invents a material number, plant, sales order, and sync status for 10 SKUs. Nothing is
              read from or written to a real SAP, Oracle, or any other ERP system.
            </p>
            <p style={{ fontFamily: FONT_BODY, color: C.textMuted, fontSize: 12.5, lineHeight: 1.55 }} className="mt-2">
              <strong style={{ color: C.text }}>To make it real, you'd need:</strong>
            </p>
            <ul style={{ fontFamily: FONT_BODY, color: C.textMuted, fontSize: 12.5, lineHeight: 1.7 }} className="list-disc pl-5 mt-1">
              <li>A backend server holding ERP credentials, a browser can't safely call SAP/Oracle APIs directly</li>
              <li>A real integration protocol, SAP OData services or IDocs, or Oracle Fusion Cloud REST APIs</li>
              <li>A field-mapping layer connecting this app's SKU ID to the ERP's Material Number, Plant, and Sales Order</li>
              <li>A sync strategy, scheduled polling, or the ERP pushing webhooks when a record changes</li>
            </ul>
          </div>

          <div className="p-4 rounded-md" style={{ background: C.panelAlt, border: `1px solid ${C.border}` }}>
            <div className="flex items-center gap-2 mb-2">
              <CloudRain size={14} color={C.amber} />
              <span style={{ fontFamily: FONT_DISPLAY, color: C.text, fontSize: 13.5 }}>Weather disruptions</span>
            </div>
            <p style={{ fontFamily: FONT_BODY, color: C.textMuted, fontSize: 12.5, lineHeight: 1.55 }}>
              <strong style={{ color: C.text }}>What you see:</strong> every container has a flat, fixed-probability
              chance of a "Weather Disruption" event with a fixed confidence penalty, completely unconnected to
              any real weather data or to that vessel's actual route.
            </p>
            <p style={{ fontFamily: FONT_BODY, color: C.textMuted, fontSize: 12.5, lineHeight: 1.55 }} className="mt-2">
              <strong style={{ color: C.text }}>To make it real, you'd need three things chained together:</strong>
            </p>
            <ul style={{ fontFamily: FONT_BODY, color: C.textMuted, fontSize: 12.5, lineHeight: 1.7 }} className="list-disc pl-5 mt-1">
              <li>A real vessel position feed (see AIS below, it has the same gap)</li>
              <li>A real marine-weather data source (e.g. NOAA, StormGlass, or a marine weather-routing provider) queried along that vessel's actual route</li>
              <li>A model connecting storm severity to actual delay or damage risk, ideally tuned against real historical outcomes rather than guessed, the same way the event weights above should eventually be calibrated</li>
            </ul>
          </div>

          <div className="p-4 rounded-md" style={{ background: C.panelAlt, border: `1px solid ${C.border}` }}>
            <div className="flex items-center gap-2 mb-2">
              <Satellite size={14} color={C.amber} />
              <span style={{ fontFamily: FONT_DISPLAY, color: C.text, fontSize: 13.5 }}>Live AIS vessel feed</span>
            </div>
            <p style={{ fontFamily: FONT_BODY, color: C.textMuted, fontSize: 12.5, lineHeight: 1.55 }}>
              <strong style={{ color: C.text }}>What you see:</strong> a timer that invents a new fake vessel
              position every few seconds. To make it real you'd need an actual AIS data provider, e.g.
              MarineTraffic, Spire, or a direct AIS receiver feed, rather than a timer.
            </p>
          </div>

          <div className="p-4 rounded-md" style={{ background: C.panelAlt, border: `1px solid ${C.border}` }}>
            <div className="flex items-center gap-2 mb-2">
              <MapPinned size={14} color={C.amber} />
              <span style={{ fontFamily: FONT_DISPLAY, color: C.text, fontSize: 13.5 }}>Route & compliance risk</span>
            </div>
            <p style={{ fontFamily: FONT_BODY, color: C.textMuted, fontSize: 12.5, lineHeight: 1.55 }}>
              <strong style={{ color: C.text }}>What you see:</strong> a shipment is flagged as transiting
              the Strait of Hormuz, the Gulf of Aden, the Strait of Malacca, or the Red Sea based only on
              whether its origin or destination port is near that corridor, a coin-flip proxy, not a real
              route. Separately, the "watchlist" in Settings is a plain text-match against a list <em>you</em> type
              in, it is not a legal sanctions or denied-party determination of any kind.
            </p>
            <p style={{ fontFamily: FONT_BODY, color: C.textMuted, fontSize: 12.5, lineHeight: 1.55 }} className="mt-2">
              <strong style={{ color: C.text }}>To make it real, you'd need:</strong>
            </p>
            <ul style={{ fontFamily: FONT_BODY, color: C.textMuted, fontSize: 12.5, lineHeight: 1.7 }} className="list-disc pl-5 mt-1">
              <li>Real AIS waypoint data to reconstruct the actual route a vessel sailed, not just its origin/destination</li>
              <li>A live maritime-security advisory feed for which corridors are currently high-risk and how severe, e.g. UKMTO's Voluntary Reporting Area or the Joint War Committee's listed areas, since these zones and their risk level change over time</li>
              <li>A real denied-party/sanctions screening service (e.g. an OFAC SDN list checker, or a commercial screening provider) wired into your actual compliance process, not a free-text box in a prototype</li>
            </ul>
          </div>
        </div>
      </Panel>

      {/* How the pieces connect */}
      <Panel className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <HelpCircle size={16} color={C.amber} />
          <h3 style={{ fontFamily: FONT_DISPLAY, color: C.text, fontSize: 16 }}>Where to look for what</h3>
        </div>
        <div className="grid sm:grid-cols-3 gap-3">
          <HelpLink icon={Gauge} title="Dashboard" body="Fleet-wide health: how many shipments are moving, average confidence, and how many containers or SKUs need attention right now." />
          <HelpLink icon={Search} title="SKU Search" body="Look up one SKU and see its custody ladder, every event in its chain of custody and exactly how each one moved its confidence score." />
          <HelpLink icon={AlertTriangle} title="Exceptions" body="A worklist of the SKUs that most need attention, filter by urgency, SLA tier, value, perishability, or a custom list, and sort by confidence or Priority Score." />
          <HelpLink icon={PlayCircle} title="Simulator" body="Test a hypothetical event against a real SKU, e.g. 'what if this container is held at customs?', before deciding whether to expedite a backup." />
          <HelpLink icon={Settings} title="Settings" body="Adjust risk thresholds, event weights, the compliance watchlist, and data-quality controls like source reliability and the missing-scan grace window." />
          <HelpLink icon={Satellite} title="Integrations" body="Illustrates what a live AIS vessel feed and an ERP sync (SAP/Oracle) would surface once this prototype is connected to real systems, see above for exactly what's fake and how to make it real." />
        </div>
        <p
          className="mt-4 p-3 rounded-md text-xs"
          style={{ background: C.panelAlt, border: `1px solid ${C.border}`, fontFamily: FONT_BODY, color: C.textMuted, lineHeight: 1.6 }}
        >
          In one line: this is a rule-based confidence engine plus a what-if simulator, running on
          synthetic shipment data with illustrative AIS/EDI feeds. Nothing here is connected to a live
          carrier, terminal or customs system.
        </p>
      </Panel>
    </div>
  );
}

function ProblemCard({ icon: Icon, title, body }) {
  return (
    <div className="p-4 rounded-md" style={{ background: C.panelAlt, border: `1px solid ${C.border}` }}>
      <Icon size={16} color={C.coral} className="mb-2" />
      <div style={{ fontFamily: FONT_DISPLAY, color: C.text, fontSize: 13.5 }} className="mb-1.5">{title}</div>
      <div style={{ fontFamily: FONT_BODY, color: C.textMuted, fontSize: 12.5, lineHeight: 1.55 }}>{body}</div>
    </div>
  );
}

function HelpLink({ icon: Icon, title, body }) {
  return (
    <div className="p-4 rounded-md" style={{ background: C.panelAlt, border: `1px solid ${C.border}` }}>
      <Icon size={16} color={C.teal} className="mb-2" />
      <div style={{ fontFamily: FONT_DISPLAY, color: C.text, fontSize: 13.5 }} className="mb-1.5">{title}</div>
      <div style={{ fontFamily: FONT_BODY, color: C.textMuted, fontSize: 12.5, lineHeight: 1.55 }}>{body}</div>
    </div>
  );
}

/* ---------------------------------------------------------
   APP SHELL
--------------------------------------------------------- */
export default function App() {
  const data = useMemo(() => generateData(), []);
  const [tab, setTab] = useState("dashboard");
  const [selectedSkuId, setSelectedSkuId] = useState(null);
  const [exceptionPreset, setExceptionPreset] = useState(null);
  const [mode, setMode] = useState("rule");
  const [weights, setWeights] = useState(DEFAULT_WEIGHTS);
  const [thresholds, setThresholds] = useState(DEFAULT_THRESHOLDS);
  const [watchlist, setWatchlist] = useState([]);
  const [sourceReliability, setSourceReliability] = useState(DEFAULT_SOURCE_RELIABILITY);
  const [graceHours, setGraceHours] = useState(DEFAULT_GRACE_HOURS);

  const derive = useCallback((mode) => {
    const shipmentById = Object.fromEntries(data.shipments.map((s) => [s.id, s]));

    // A shipment "touches" the watchlist if its origin or destination
    // matches any entry the user has configured in Settings. This is a
    // simplified name-match, not a real denied-party/sanctions screen, // see the Logic tab for what a real check would require.
    const touchesWatchlist = (shipmentId) => {
      const s = shipmentById[shipmentId];
      if (!s || watchlist.length === 0) return false;
      return watchlist.some((w) => {
        const needle = w.trim().toLowerCase();
        return needle && (s.origin.toLowerCase().includes(needle) || s.destination.toLowerCase().includes(needle));
      });
    };

    // Dynamically splice a watchlist-touch event into a raw timeline (this
    // can't be baked in at generation time, since the watchlist is live
    // user Settings, not fixed data) and re-sort chronologically.
    const withWatchlistEvent = (timeline, shipmentId) => {
      if (!touchesWatchlist(shipmentId)) return timeline;
      const s = shipmentById[shipmentId];
      const anchor = timeline[0]?.timestamp ?? new Date();
      const injected = {
        type: "watchlistTouch",
        label: "Route touches a watchlisted location",
        timestamp: new Date(anchor.getTime() + 3600000),
        location: `${s.origin} / ${s.destination}`,
        delta: 0,
      };
      return [...timeline, injected].sort((a, b) => a.timestamp - b.timestamp);
    };

    // Urgency is driven by real signals already in the model: a shipment
    // already running late, a perishable SKU running low on shelf life, how
    // little time is left before the (current, slip-adjusted) ETA, and
    // contractual exposure. Deliberately excludes production-dependency and
    // substitutability, not modeled in this prototype.
    const computeUrgency = (sku, shipment) => {
      if (!shipment) return "Low";
      if (shipment.isLate) return "High";
      if (sku.perishable && sku.shelfLifeDays <= 14) return "High";
      const daysUntilEta = Math.ceil((shipment.eta.getTime() - NOW.getTime()) / 86400000);
      if (daysUntilEta <= 3) return "High";
      if (sku.perishable && sku.shelfLifeDays <= 30) return "Medium";
      if (daysUntilEta <= 7) return "Medium";
      if (sku.slaTier === "Contractual SLA") return "Medium";
      return "Low";
    };
    const URGENCY_POINTS = { Low: 0, Medium: 15, High: 30 };
    const SLA_POINTS = { Standard: 0, Priority: 10, "Contractual SLA": 20 };
    const computePriorityScore = (sku, urgency, confidence) => {
      const confidenceGap = 100 - confidence;
      const valuePoints = sku.value >= 10000 ? 20 : sku.value >= 1000 ? 10 : 0;
      return confidenceGap + URGENCY_POINTS[urgency] + SLA_POINTS[sku.slaTier] + valuePoints;
    };

    const skus = data.skus.map((s) => {
      const rawTimeline = withWatchlistEvent(s.timeline, s.shipmentId);
      const timeline = computeTimeline(rawTimeline, weights, mode, sourceReliability, graceHours);
      const confidence = timeline.length ? timeline[timeline.length - 1].confidenceAfter : 100;
      const shipment = shipmentById[s.shipmentId];
      const urgency = computeUrgency(s, shipment);
      const priorityScore = computePriorityScore(s, urgency, confidence);
      return { ...s, timeline, confidence, risk: riskFromConfidence(confidence, thresholds), urgency, priorityScore, isLate: shipment?.isLate ?? false };
    });
    const containers = data.containers.map((c) => {
      const rawTimeline = withWatchlistEvent(c.timeline, c.shipmentId);
      const timeline = computeTimeline(rawTimeline, weights, mode, sourceReliability, graceHours);
      const confidence = timeline.length ? timeline[timeline.length - 1].confidenceAfter : 100;
      return { ...c, timeline, confidence };
    });
    return { shipments: data.shipments, skus, containers, thresholds };
  }, [data, weights, thresholds, watchlist, sourceReliability, graceHours]);

  const viewData = useMemo(() => derive(mode), [derive, mode]);
  const altMode = mode === "rule" ? "calibrated" : "rule";
  const altData = useMemo(() => derive(altMode), [derive, altMode]);

  const drillToExceptions = (key) => {
    setExceptionPreset({ key, at: Date.now() });
    setTab("exceptions");
  };

  const goToSku = (skuId) => {
    setSelectedSkuId(skuId);
    setTab("search");
  };

  const goToWeightsLogic = () => {
    setTab("logic");
    // wait for the Logic tab to mount before scrolling to the weights section
    setTimeout(() => {
      document
        .getElementById("logic-event-weights")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 60);
  };

  const TABS = [
    { key: "dashboard", label: "Overview", icon: Gauge },
    { key: "search", label: "SKU", icon: Search },
    { key: "exceptions", label: "Exceptions", icon: AlertTriangle },
    { key: "simulator", label: "Simulator", icon: PlayCircle },
    { key: "settings", label: "Model", icon: Settings },
    { key: "integrations", label: "Feeds", icon: Satellite },
    { key: "logic", label: "Logic", icon: HelpCircle },
  ];

  return (
    <div style={{ background: C.bg, minHeight: "100vh", color: C.text }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500;600&display=swap');
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 8px; height: 8px; }
        ::-webkit-scrollbar-thumb { background: ${C.border}; border-radius: 4px; }
        @keyframes ping-slow {
          0% { transform: scale(0.8); opacity: 0.9; }
          80% { transform: scale(2.2); opacity: 0; }
          100% { opacity: 0; }
        }
        @keyframes live-blink {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.25; transform: scale(0.75); }
        }
        @keyframes live-halo {
          0% { transform: scale(0.6); opacity: 0.55; }
          70% { transform: scale(2.6); opacity: 0; }
          100% { opacity: 0; }
        }
        @keyframes logo-sweep {
          0% { transform: translateX(-100%); }
          55%, 100% { transform: translateX(240%); }
        }
        @keyframes logo-bob {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-1.5px); }
        }
        @media (prefers-reduced-motion: reduce) {
          .sonar-ping, .live-dot, .live-halo, .logo-sweep, .logo-bob { animation: none !important; }
        }
      `}</style>

      <header
        className="sticky top-0 z-10 px-3 sm:px-5 pt-2 pb-0 flex flex-col gap-2"
        style={{ background: "rgba(11,15,20,0.94)", backdropFilter: "blur(8px)", borderBottom: `1px solid ${C.border}` }}
      >
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <button
              onClick={() => setTab("dashboard")}
              className="flex items-center gap-2 shrink-0"
              style={{ background: "transparent", border: "none", padding: 0, cursor: "pointer" }}
              aria-label="Where Is My Shipment, back to Overview"
            >
              <Anchor size={16} color={C.teal} className="logo-bob" style={{ animation: "logo-bob 4s ease-in-out infinite" }} />
              <span
                className="whitespace-nowrap"
                style={{ fontFamily: FONT_DISPLAY, fontSize: 12.5, fontWeight: 600, color: C.text, letterSpacing: 0.2 }}
              >
                Where Is My Shipment
              </span>
            </button>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <a
              href="https://github.com/shubhamgambhire"
              target="_blank"
              rel="noreferrer"
              className="hidden sm:inline"
              style={{ fontFamily: FONT_MONO, fontSize: 10.5, color: C.textMuted, textDecoration: "none" }}
            >
              GITHUB ↗
            </a>
            <AlertsBell skus={viewData.skus} onSelectSku={goToSku} />
          </div>
        </div>


        <div className="flex items-end justify-between gap-3 overflow-x-auto" style={{ scrollbarWidth: "thin" }}>
          <nav className="flex gap-4 shrink-0">
            {TABS.map((t) => {
              const active = tab === t.key;
              return (
                <button
                  key={t.key}
                  onClick={() => setTab(t.key)}
                  className="whitespace-nowrap shrink-0 pb-2 pt-1"
                  style={{
                    fontFamily: FONT_BODY,
                    fontSize: 12.5,
                    fontWeight: active ? 600 : 400,
                    background: "transparent",
                    border: "none",
                    borderBottom: `2px solid ${active ? C.teal : "transparent"}`,
                    color: active ? C.text : C.textMuted,
                    transition: "color 150ms ease",
                  }}
                >
                  {t.label}
                </button>
              );
            })}
          </nav>
        </div>
      </header>

      <main className="px-3 sm:px-5 py-4 max-w-[1440px] mx-auto">
        {tab === "dashboard" && <BrandMark />}
        <TabIntro tab={tab} />
        {tab === "dashboard" && (
          <DashboardView
            shipments={viewData.shipments} containers={viewData.containers} skus={viewData.skus}
            onSelectSku={goToSku} onDrill={drillToExceptions}
            modeBar={
              <ModeBar
                mode={mode}
                active={viewData}
                alt={altData}
                onSwitch={() => setMode(altMode)}
                onExplain={goToWeightsLogic}
              />
            }
          />
        )}
        {tab === "search" && (
          <SearchView data={viewData} selectedId={selectedSkuId} onSelectId={setSelectedSkuId} />
        )}
        {tab === "exceptions" && (
          <ExceptionsView skus={viewData.skus} onSelectSku={goToSku} preset={exceptionPreset} />
        )}
        {tab === "simulator" && (
          <WhatIfView skus={viewData.skus} mode={mode} weights={weights} thresholds={thresholds} sourceReliability={sourceReliability} />
        )}
        {tab === "settings" && (
          <SettingsView
            weights={weights} setWeights={setWeights}
            thresholds={thresholds} setThresholds={setThresholds}
            watchlist={watchlist} setWatchlist={setWatchlist}
            sourceReliability={sourceReliability} setSourceReliability={setSourceReliability}
            graceHours={graceHours} setGraceHours={setGraceHours}
            previewSkus={viewData.skus}
            mode={mode} setMode={setMode}
          />
        )}
        {tab === "integrations" && (
          <IntegrationsView skus={viewData.skus} />
        )}
        {tab === "logic" && <LogicView weights={weights} thresholds={thresholds} />}
      </main>

      <footer
        className="max-w-[1440px] mx-auto px-3 sm:px-5 py-5 flex flex-wrap items-center justify-between gap-2"
        style={{ fontFamily: FONT_MONO, fontSize: 10.5, color: C.textFaint, borderTop: `1px solid ${C.borderSoft}` }}
      >
        <span className="flex items-center gap-3">
          <span>Built by Shubham Gambhire</span>
          <a href="https://github.com/shubhamgambhire" target="_blank" rel="noreferrer" style={{ color: C.textMuted, textDecoration: "none" }}>
            GitHub ↗
          </a>
        </span>
      </footer>

    </div>
  );
}

function SearchView({ data, selectedId, onSelectId }) {
  const [query, setQuery] = useState("");
  const { skus, containers, shipments, thresholds } = data;

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    const matched = q
      ? skus.filter((s) => s.id.toLowerCase().includes(q) || s.customer.toLowerCase().includes(q) || s.category.toLowerCase().includes(q))
      : skus;
    if (!selectedId) return matched;
    const sel = matched.find((s) => s.id === selectedId);
    return sel ? [sel, ...matched.filter((s) => s.id !== selectedId)] : matched;
  }, [query, skus, selectedId]);

  const selected = skus.find((s) => s.id === selectedId) || results[0];
  const container = selected ? containers.find((c) => c.id === selected.containerId) : null;
  const shipment = selected ? shipments.find((s) => s.id === selected.shipmentId) : null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-[minmax(0,300px)_minmax(0,1fr)] gap-4 min-w-0">
      <div className="flex flex-col gap-2 min-w-0 w-full overflow-hidden">
        <div className="relative">
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2" color={C.textFaint} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search SKU, customer, category…"
            aria-label="Search SKU, customer, or category"
            className="w-full min-w-0 pl-8 pr-3 py-1.5 outline-none"
            style={{ background: C.panelAlt, border: `1px solid ${C.border}`, borderRadius: 6, color: C.text, fontFamily: FONT_MONO, fontSize: 12 }}
          />
        </div>
        <div className="flex items-center justify-between px-0.5" style={{ fontFamily: FONT_MONO, fontSize: 10.5, letterSpacing: 0.6, color: C.textFaint }}>
          <span>SHOWING {results.length} OF {skus.length} SKUS</span>
          {selected && <span style={{ color: C.teal }}>1 SELECTED</span>}
        </div>
        <div
          className="overflow-y-auto overflow-hidden"
          style={{ maxHeight: 620, border: `1px solid ${C.border}`, borderRadius: 6, background: C.panel }}
        >
          {results.map((s, i) => {
            const active = selected && s.id === selected.id;
            const m = RISK_META[s.risk];
            return (
              <button
                key={s.id}
                onClick={() => onSelectId(s.id)}
                className="text-left w-full pl-3 pr-2 py-2 flex items-center justify-between gap-2"
                style={{
                  background: active ? `${C.teal}14` : "transparent",
                  border: "none",
                  borderTop: i ? `1px solid ${C.borderSoft}` : "none",
                  borderLeft: `3px solid ${active ? C.teal : "transparent"}`,
                  boxShadow: active ? `inset 0 0 0 1px ${C.teal}55` : "none",
                  transition: "background 150ms ease, box-shadow 150ms ease",
                }}
              >
                <div className="flex items-center gap-2 min-w-0">
                  {active && <CheckCircle2 size={13} color={C.teal} className="shrink-0" />}
                  <div className="flex flex-col min-w-0">
                    <span className="truncate" style={{ fontFamily: FONT_MONO, color: active ? C.teal : C.text, fontSize: 11.5 }}>{s.id}</span>
                    <span className="truncate" style={{ fontFamily: FONT_BODY, color: C.textFaint, fontSize: 11 }}>{s.customer}</span>
                  </div>
                </div>
                <span style={{ fontFamily: FONT_MONO, color: m.color, fontSize: 11.5 }}>{s.confidence.toFixed(0)}%</span>
              </button>
            );
          })}
          {results.length === 0 && (
            <div className="px-3 py-6 text-center" style={{ fontFamily: FONT_BODY, fontSize: 12, color: C.textMuted }}>No SKU matches that search.</div>
          )}
        </div>
      </div>

      <div className="min-w-0">
        {selected ? (
          <Panel className="p-4 flex flex-col gap-4">
            <div className="grid lg:grid-cols-[minmax(0,1fr)_minmax(0,280px)] gap-4 items-start">
              <div className="min-w-0 flex flex-col gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span style={{ fontFamily: FONT_MONO, fontSize: 16, color: C.text }}>{selected.id}</span>
                    <RiskBadge risk={selected.risk} />
                  </div>
                  <span style={{ fontFamily: FONT_BODY, color: C.textMuted, fontSize: 12 }}>
                    {selected.description} · {selected.customer} · qty {selected.quantity} · ${selected.value.toLocaleString()}
                  </span>
                </div>

                <div
                  className="grid grid-cols-2 sm:grid-cols-3 gap-y-2 py-1"
                  style={{ borderTop: `1px solid ${C.borderSoft}`, borderBottom: `1px solid ${C.borderSoft}` }}
                >
              <InfoCell label="Container" value={selected.containerId} />
              <InfoCell label="Pallet" value={selected.palletId} />
              <InfoCell label="Shipment" value={selected.shipmentId} />
              <InfoCell
                label="ETA"
                value={shipment ? `${shipment.eta.toISOString().slice(0, 10)}${shipment.isLate ? " (LATE)" : ""}` : "n/a"}
                highlight={shipment?.isLate}
              />

              {shipment && shipment.eta.getTime() !== shipment.plannedEta.getTime() && (
                <InfoCell label="Originally Due" value={shipment.plannedEta.toISOString().slice(0, 10)} />
              )}
              <InfoCell label="Vessel" value={shipment ? shipment.vessel : "n/a"} />
              <InfoCell label="Route" value={shipment ? `${shipment.origin} → ${shipment.destination}` : "n/a"} />
              <InfoCell label="Seal Status" value={container ? container.sealStatus : "n/a"} highlight={container?.sealStatus === "Broken"} />
              <InfoCell label="GPS Status" value={container ? container.gpsStatus : "n/a"} highlight={container?.gpsStatus === "Anomaly"} />
              <InfoCell
                label="Route Risk"
                value={shipment && shipment.routeZones.length > 0 ? shipment.routeZones.map((z) => ROUTE_ZONE_LABELS[z]).join(", ") : "None flagged"}
                highlight={shipment && shipment.routeZones.length > 0}
              />
              <InfoCell label="SLA Tier" value={selected.slaTier} highlight={selected.slaTier === "Contractual SLA"} />
              <InfoCell label="Urgency" value={selected.urgency} highlight={selected.urgency === "High"} />
              {selected.perishable && (
                <InfoCell label="Shelf Life" value={`${selected.shelfLifeDays} days`} highlight={selected.shelfLifeDays <= 14} />
              )}
                </div>
              </div>
              <ConfidenceGauge value={selected.confidence} thresholds={thresholds} timeline={selected.timeline} />
            </div>

            <div>
              <div className="flex flex-wrap items-baseline justify-between gap-2 mb-2">
                <h4 style={{ fontFamily: FONT_DISPLAY, color: C.text, fontSize: 13, fontWeight: 600, letterSpacing: 0.2 }}>
                  Chain of custody
                </h4>
                <div className="flex flex-wrap gap-3" style={{ fontFamily: FONT_MONO, fontSize: 9.5, color: C.textFaint }}>
                  {[
                    ["VERIFIED", C.teal],
                    ["EXCEPTION", C.coral],
                    ["DELAYED", C.amber],
                    ["PREDICTED", C.textMuted],
                  ].map(([l, col]) => (
                    <span key={l} className="flex items-center gap-1">
                      <span style={{ width: 6, height: 6, borderRadius: 3, background: col, display: "inline-block" }} />
                      {l}
                    </span>
                  ))}
                </div>
              </div>
              <div
                className="hidden md:grid gap-x-3 pl-5 pr-1 pb-1 md:grid-cols-[1fr_120px_86px_54px]"
                style={{ fontFamily: FONT_MONO, fontSize: 9.5, letterSpacing: 0.7, color: C.textFaint }}
              >
                <span>EVENT · LOCATION · EVIDENCE</span>
                <span>TIMESTAMP (UTC)</span>
                <span>STATE</span>
                <span className="text-right">CONF.</span>
              </div>
              <CustodyLadder timeline={selected.timeline} thresholds={thresholds} />
            </div>

          </Panel>
        ) : (
          <Panel className="p-8 flex items-center justify-center text-sm" style={{ color: C.textMuted }}>
            Select a SKU to view its custody ladder.
          </Panel>
        )}
      </div>
    </div>
  );
}
