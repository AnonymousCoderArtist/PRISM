import type { PrismResource } from "./resourceTypes";

/**
 * Simulated fleet — demo mode.
 * Each resource originates from a DISTINCT named operational base
 * (river stations, fire stations, hospitals, depots, helipad) spread
 * across Guwahati. No two share the same start point. Routes fan out
 * from the nearest base to the dispatched incident, then loop back to
 * a different base so the demo never collapses to a single origin.
 *
 * Bases are real-ish Guwahati operational points:
 *  - PANDU GHAT         (boat station on Brahmaputra, west)
 *  - FATAZIL GHAT        (boat station, central south)
 *  - GUWAHATI PORT       (boat station, north)
 *  - GMCH HOSPITAL       (medical hub, central)
 *  - DISPUR HOSPITAL     (medical hub, south-central)
 *  - PANBAZAR FIRE STN   (fire/rescue, central)
 *  - JALUKBARI DEPOT     (rescue, west)
 *  - BORJHAR AIRBASE     (helicopter, south-west)
 *  - ZOO ROAD DEPOT      (utility, south)
 *  - CHANDMARI STATION   (north-east)
 */

// Operational bases — each with a real-ish lat/lng for the Guwahati area.
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
} as const;

// Spread of incident target locations so routes fan out across the city
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
} as const;

/**
 * Each entry:
 *  - `base`        → where the resource originates (its home station)
 *  - `target`      → first incident location it dispatches to
 *  - `altTarget`   → next incident it will cycle to after the first dispatch
 *                    (so on loop the path actually moves between areas instead
 *                    of bouncing between the same two points)
 */
const DISPATCHES: { id: string; kind: PrismResource["kind"]; speed: number; mission: string; base: { lat: number; lng: number; label: string }; target: { lat: number; lng: number; label: string }; altTarget: { lat: number; lng: number; label: string } }[] = [
  // 3 BOATS — each from a different river station
  { id: "BOAT-174", kind: "boat",        speed: 22, mission: "Flood rescue — Brahmaputra",         base: BASES.PANDU_GHAT,    target: INCIDENTS.DISPUR,      altTarget: INCIDENTS.MALIGAON },
  { id: "BOAT-181", kind: "boat",        speed: 14, mission: "Evacuation — Pandu waters",          base: BASES.FATAZIL_GHAT,  target: INCIDENTS.PALTAN_BZR,  altTarget: INCIDENTS.GANESHGURI },
  { id: "BOAT-192", kind: "boat",        speed: 18, mission: "Rescue deployment — upper river",    base: BASES.GUWAHATI_PORT, target: INCIDENTS.SIX_MILE,    altTarget: INCIDENTS.PALTAN_BZR },

  // 2 AMBULANCES — each from a different hospital
  { id: "AMB-021",  kind: "ambulance",   speed: 34, mission: "Medical — Paltan Bazaar",            base: BASES.GMCH_HOSPITAL, target: INCIDENTS.PALTAN_BZR,  altTarget: INCIDENTS.BHANGAGARH },
  { id: "AMB-014",  kind: "ambulance",   speed: 18, mission: "Medical — Maligaon",                  base: BASES.DISPUR_HOSP,   target: INCIDENTS.MALIGAON,    altTarget: INCIDENTS.LOKHRA },

  // 1 HELICOPTER — Borjhar airbase
  { id: "AIR-007",  kind: "helicopter",  speed: 145, mission: "Aerial assessment — Six Mile",       base: BASES.BORJHAR,       target: INCIDENTS.SIX_MILE,    altTarget: INCIDENTS.BHANGAGARH },

  // 1 RESCUE VEHICLE — fire station
  { id: "RV-009",   kind: "rescue_vehicle", speed: 28, mission: "Rescue — Fatasil corridor",        base: BASES.PANBAZAR_FIRE, target: INCIDENTS.BELTOLA,     altTarget: INCIDENTS.DISPUR },
];

export const SIMULATED_RESOURCES: PrismResource[] = DISPATCHES.map(d => ({
  id: d.id,
  kind: d.kind,
  lat: d.base.lat,
  lng: d.base.lng,
  heading: 0,
  status: "en_route",
  speed: d.speed,
  destination: d.target.label,
  destLat: d.target.lat,
  destLon: d.target.lng,
  origin: { lat: d.base.lat, lng: d.base.lng },
  altTarget: { lat: d.altTarget.lat, lng: d.altTarget.lng },
  mission: d.mission,
  etaMin: 12,
}));

/** Straight movement + 3-stage loop (base → target → altTarget → base) so the fleet
 *  visibly fans out from many origins and cycles through distinct incident areas. */
export function stepSimulatedResources(prev: PrismResource[], t: number): PrismResource[] {
  return prev.map(r => {
    if (r.status === "available" || r.status === "offline") return r;
    const destLat = r.destLat ?? r.lat;
    const destLng = r.destLon ?? r.lng;
    const totalDist = Math.hypot(destLat - r.lat, destLng - r.lng);
    if (totalDist < 0.00055) {
      // Arrived at the current target — advance to the next point in the loop
      if (r.status === "en_route") {
        const home = r.origin ?? { lat: r.lat, lng: r.lng };
        const alt = r.altTarget;
        if (alt && Math.hypot(r.lat - alt.lat, r.lng - alt.lng) > 0.0008) {
          // Currently at home (just looped) → go to altTarget first
          // Currently at target → go to home base to "resupply"
          const atHome = Math.hypot(r.lat - home.lat, r.lng - home.lng) < 0.0008;
          if (atHome) {
            return { ...r, destLat: alt.lat, destLon: alt.lng, destination: "redeploy", etaMin: 10 };
          }
          // Otherwise, head home
          return { ...r, destLat: home.lat, destLon: home.lng, destination: "return", etaMin: 8 };
        }
        // No alt target — just bounce between current and home
        return { ...r, destLat: home.lat, destLon: home.lng, etaMin: 8 };
      }
      return r;
    }
    const base = r.kind === "helicopter" ? 0.00042 : r.kind === "boat" ? 0.00012 : 0.00016;
    const f = Math.min(1, base * (0.9 + Math.sin(t * 0.6) * 0.12));
    const ratio = Math.min(1, f / totalDist);
    const nlng = r.lng + (destLng - r.lng) * ratio;
    const nlat = r.lat + (destLat - r.lat) * ratio;
    // Heading: bearing from current → destination
    const bearing = (Math.atan2(destLng - r.lng, destLat - r.lat) * 180) / Math.PI;
    const remain = Math.hypot(destLat - nlat, destLng - nlng);
    const eta = Math.max(1, Math.ceil((remain / Math.max(0.0001, totalDist)) * (r.etaMin ?? 12)));
    return { ...r, lng: nlng, lat: nlat, heading: bearing, etaMin: remain < 0.0006 ? 1 : eta };
  });
}
