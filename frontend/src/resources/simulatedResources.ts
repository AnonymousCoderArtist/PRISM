import type { PrismResource } from "./resourceTypes";
import { curvePoints } from "./ResourceRoutes";

/**
 * Simulated fleet — demo mode.
 * Each resource originates from a DISTINCT named operational base
 * (river stations, fire stations, hospitals, depots, helipad) spread
 * across Guwahati. No two share the same start point. Routes fan out
 * from the nearest base to the dispatched incident, then loop back.
 * Each has a unique speed (km/h) so the demo feels realistic.
 *
 * Bases are real-ish Guwahati operational points.
 */

const BASES = {
  PANDU_GHAT:    { lat: 26.1675, lng: 91.6850, label: "Pandu Ghat" },
  FATAZIL_GHAT:  { lat: 26.1080, lng: 91.7200, label: "Fatasil Ghat" },
  GUWAHATI_PORT: { lat: 26.1900, lng: 91.7400, label: "Guwahati Port" },
  GMCH_HOSPITAL: { lat: 26.1530, lng: 91.7680, label: "GMCH Hospital" },
  DISPUR_HOSP:   { lat: 26.1445, lng: 91.7362, label: "Dispur Hospital" },
  PANBAZAR_FIRE: { lat: 26.1585, lng: 91.7485, label: "Panbazar Fire Stn" },
  JALUKBARI:     { lat: 26.1215, lng: 91.7225, label: "Jalukbari Depot" },
  BORJHAR:       { lat: 26.1040, lng: 91.5850, label: "Borjhar Airbase" },
  ZOO_ROAD:      { lat: 26.1370, lng: 91.7520, label: "Zoo Road Depot" },
  CHANDMARI:     { lat: 26.1655, lng: 91.7555, label: "Chandmari Station" },
  KHANAPARA:     { lat: 26.1280, lng: 91.7820, label: "Khanapara Station" },
  AZARA:         { lat: 26.0950, lng: 91.6200, label: "Azara Station" },
} as const;

const INCIDENTS = {
  BHANGAGARH:  { lat: 26.1495, lng: 91.7655, label: "Bhangagarh" },
  PALTAN_BZR:  { lat: 26.1585, lng: 91.7485, label: "Paltan Bazaar" },
  MALIGAON:    { lat: 26.1325, lng: 91.7255, label: "Maligaon" },
  DISPUR:      { lat: 26.1445, lng: 91.7362, label: "Dispur" },
  LOKHRA:      { lat: 26.1285, lng: 91.7355, label: "Lokhra" },
  JALUKBARI_W: { lat: 26.1215, lng: 91.7225, label: "Jalukbari W" },
  GANESHGURI:  { lat: 26.1425, lng: 91.7405, label: "Ganeshguri" },
  BELTOLA:     { lat: 26.1385, lng: 91.7455, label: "Beltola" },
  SIX_MILE:    { lat: 26.1515, lng: 91.7425, label: "Six Mile" },
  CHANDMARI:   { lat: 26.1655, lng: 91.7555, label: "Chandmari" },
  KHANAPARA:   { lat: 26.1280, lng: 91.7820, label: "Khanapara" },
  NOONMATI:    { lat: 26.1090, lng: 91.7500, label: "Noonmati" },
} as const;

type DispatchDef = {
  id: string;
  kind: PrismResource["kind"];
  speed: number; // km/h, distinct for every resource
  mission: string;
  base: { lat: number; lng: number; label: string };
  target: { lat: number; lng: number; label: string };
  altTarget: { lat: number; lng: number; label: string };
};

/** Each dispatch originates from a DIFFERENT base and dispatches to a DIFFERENT incident.
 *  All 12 resources are dispatched one by one (staggered) after the plan is ready. */
const DISPATCHES: DispatchDef[] = [
  // 4 BOATS — distinct river stations
  { id: "BOAT-174", kind: "boat", speed: 22, mission: "Flood rescue — Brahmaputra",   base: BASES.PANDU_GHAT,    target: INCIDENTS.DISPUR,      altTarget: INCIDENTS.MALIGAON },
  { id: "BOAT-181", kind: "boat", speed: 14, mission: "Evacuation — Pandu waters",    base: BASES.FATAZIL_GHAT,  target: INCIDENTS.PALTAN_BZR,  altTarget: INCIDENTS.GANESHGURI },
  { id: "BOAT-192", kind: "boat", speed: 18, mission: "Rescue — upper river",         base: BASES.GUWAHATI_PORT, target: INCIDENTS.SIX_MILE,    altTarget: INCIDENTS.PALTAN_BZR },
  { id: "BOAT-205", kind: "boat", speed: 26, mission: "Supply — Noonmati refinery",   base: BASES.JALUKBARI,     target: INCIDENTS.NOONMATI,    altTarget: INCIDENTS.LOKHRA },

  // 3 AMBULANCES — distinct hospitals
  { id: "AMB-021",  kind: "ambulance", speed: 34, mission: "Medical — Paltan Bazaar",    base: BASES.GMCH_HOSPITAL, target: INCIDENTS.PALTAN_BZR,  altTarget: INCIDENTS.BHANGAGARH },
  { id: "AMB-014",  kind: "ambulance", speed: 18, mission: "Medical — Maligaon",         base: BASES.DISPUR_HOSP,   target: INCIDENTS.MALIGAON,    altTarget: INCIDENTS.LOKHRA },
  { id: "AMB-033",  kind: "ambulance", speed: 28, mission: "Medical — Khanapara",         base: BASES.PANBAZAR_FIRE, target: INCIDENTS.KHANAPARA,   altTarget: INCIDENTS.SIX_MILE },

  // 2 HELICOPTERS — distinct airbases
  { id: "AIR-007",  kind: "helicopter", speed: 145, mission: "Aerial — Six Mile",         base: BASES.BORJHAR,       target: INCIDENTS.SIX_MILE,    altTarget: INCIDENTS.BHANGAGARH },
  { id: "AIR-011",  kind: "helicopter", speed: 162, mission: "Aerial — Chandmari",        base: BASES.AZARA,         target: INCIDENTS.CHANDMARI,   altTarget: INCIDENTS.DISPUR },

  // 2 RESCUE VEHICLES — distinct stations
  { id: "RV-009",   kind: "rescue_vehicle", speed: 28, mission: "Rescue — Fatasil corridor", base: BASES.PANBAZAR_FIRE, target: INCIDENTS.BELTOLA,     altTarget: INCIDENTS.DISPUR },
  { id: "RV-015",   kind: "rescue_vehicle", speed: 36, mission: "Rescue — Khanapara",        base: BASES.KHANAPARA,     target: INCIDENTS.KHANAPARA,   altTarget: INCIDENTS.JALUKBARI_W },

  // 1 EXCAVATOR — Chandmari station
  { id: "EXC-002",  kind: "rescue_vehicle", speed: 12, mission: "Clear debris — Bhangagarh", base: BASES.CHANDMARI,    target: INCIDENTS.BHANGAGARH,  altTarget: INCIDENTS.PALTAN_BZR },
];

export const SIMULATED_RESOURCES: PrismResource[] = DISPATCHES.map(d => ({
  id: d.id,
  kind: d.kind,
  lat: d.base.lat,
  lng: d.base.lng,
  heading: 0,
  status: "available",
  speed: d.speed,
  destination: d.target.label,
  destLat: d.target.lat,
  destLon: d.target.lng,
  origin: { lat: d.base.lat, lng: d.base.lng },
  altTarget: { lat: d.altTarget.lat, lng: d.altTarget.lng },
  mission: d.mission,
  etaMin: 12,
  dispatchDelay: 0,
  progress: 0, // 0..1 along the current segment
}));

SIMULATED_RESOURCES.forEach((r, i) => { r.dispatchDelay = i * 1.8; });

/**
 * Polyline length (sum of segment lengths) — used to convert km/h + tick duration into
 * progress-along-curve per tick so the icon travels at real-world speed.
 */
function polylineLength(pts: [number, number][]): number {
  let total = 0;
  for (let i = 1; i < pts.length; i++) {
    total += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
  }
  return total;
}

/** Look up the point on a polyline at progress (0..1) */
function pointAtProgress(pts: [number, number][], progress: number): [number, number] {
  if (pts.length < 2) return pts[0] ?? [0, 0];
  const clamped = Math.max(0, Math.min(1, progress));
  const total = polylineLength(pts);
  if (total === 0) return pts[pts.length - 1];
  const target = total * clamped;
  let acc = 0;
  for (let i = 1; i < pts.length; i++) {
    const seg = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
    if (acc + seg >= target) {
      const localT = (target - acc) / seg;
      return [
        pts[i - 1][0] + (pts[i][0] - pts[i - 1][0]) * localT,
        pts[i - 1][1] + (pts[i][1] - pts[i - 1][1]) * localT,
      ];
    }
    acc += seg;
  }
  return pts[pts.length - 1];
}

/** Tangent direction (heading) at progress along the polyline (degrees, 0=north) */
function headingAtProgress(pts: [number, number][], progress: number): number {
  if (pts.length < 2) return 0;
  const eps = 0.005;
  const a = pointAtProgress(pts, Math.max(0, progress - eps));
  const b = pointAtProgress(pts, Math.min(1, progress + eps));
  // atan2 of delta longitude (east), delta latitude (north) — clockwise from north
  return (Math.atan2(b[0] - a[0], b[1] - a[1]) * 180) / Math.PI;
}

/**
 * Step every resource forward.
 * Each resource has a unique speed (km/h) → progress-along-curve per tick.
 * The position is read from the SAME curve that's drawn on the map, so the icon
 * travels along the visible curved path (not a straight line).
 *
 * Loop: base → target → altTarget → base, so the path keeps fanning out across Guwahati.
 */
export function stepSimulatedResources(prev: PrismResource[], t: number): PrismResource[] {
  // `t` here is in SECONDS (PrismContext passes `tick * 0.12`). 0.12s per tick at 120ms.
  return prev.map(r => {
    // Stagger: stay available until dispatchDelay seconds elapse, then start moving
    if (r.status === "available") {
      if (t >= (r.dispatchDelay ?? 0)) {
        const home = r.origin ?? { lat: r.lat, lng: r.lng };
        const destLat = r.destLat ?? r.lat;
        const destLng = r.destLon ?? r.lng;
        const curve = curvePoints([home.lng, home.lat], [destLng, destLat]);
        const curveLenDeg = polylineLength(curve);
        const curveLenKm = curveLenDeg * 111;
        const etaMin = Math.max(1, Math.round((curveLenKm / Math.max(1, r.speed ?? 20)) * 60));
        return { ...r, status: "en_route" as const, progress: 0, etaMin };
      }
      return r;
    }
    if (r.status === "offline") return r;
    const home = r.origin ?? { lat: r.lat, lng: r.lng };
    const alt = r.altTarget;
    const destLat = r.destLat ?? r.lat;
    const destLng = r.destLon ?? r.lng;
    // Build the current curve (must match the routeLayer's curve exactly)
    const curve = curvePoints([r.lng, r.lat], [destLng, destLat]);
    const curveLenDeg = polylineLength(curve);
    const curveLenKm = curveLenDeg * 111;
    // Speed → progress per tick (120ms ≈ 0.12s)
    const speed = r.speed ?? 20;
    const kmPerTick = (speed / 3600) * 0.12;
    const advance = curveLenKm > 0 ? kmPerTick / curveLenKm : 0;
    let progress = (r.progress ?? 0) + advance;
    let lon = r.lng;
    let lat = r.lat;
    let heading = r.heading;
    let etaMin = r.etaMin ?? 1;
    if (progress >= 1) {
      // Reached destination — advance to next point in the loop
      progress = 1;
      const pt = curve[curve.length - 1];
      lon = pt[0];
      lat = pt[1];
      // Pick the next destination
      const atHome = Math.hypot(r.lat - home.lat, r.lng - home.lng) < 0.0008;
      if (alt && !atHome) {
        // Just arrived at target → go home
        return { ...r, lat: home.lat, lng: home.lng, destLat: home.lat, destLon: home.lng, destination: "return base", progress: 1, etaMin: 8 };
      }
      if (alt && atHome) {
        // Just arrived back home → go to alt target
        return { ...r, lat: alt.lat, lng: alt.lng, destLat: alt.lat, destLon: alt.lng, destination: "redeploy", progress: 0, etaMin: 10 };
      }
      // No alt target — bounce
      return { ...r, lat: home.lat, lng: home.lng, destLat: home.lat, destLon: home.lng, destination: "return", progress: 0, etaMin: 8 };
    }
    // Walk along curve
    const pt = pointAtProgress(curve, progress);
    lon = pt[0];
    lat = pt[1];
    heading = headingAtProgress(curve, progress);
    const remainKm = curveLenKm * (1 - progress);
    etaMin = Math.max(1, Math.round((remainKm / Math.max(1, speed)) * 60));
    return { ...r, lat, lng: lon, heading, progress, etaMin };
  });
}
