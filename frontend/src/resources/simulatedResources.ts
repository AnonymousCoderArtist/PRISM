import type { PrismResource } from "./resourceTypes";

/**
 * Simulated fleet — makes demo runnable without backend.
 * Covers acceptance: 3 boats, 2 ambulances, 1 heli, 1 rescue_vehicle.
 * Routes point to incident wards from mockIncidents.
 */
export const SIMULATED_RESOURCES: PrismResource[] = [
  {
    id: "BOAT-174",
    kind: "boat",
    lat: 26.145, lng: 91.735, heading: 45,
    status: "en_route",
    speed: 22,
    destination: "INC-001",
    destLat: 26.1395, destLon: 91.6367,
    etaMin: 18,
    mission: "Flood rescue — Ward 1 Bharalu",
  },
  {
    id: "BOAT-181",
    kind: "boat",
    lat: 26.162, lng: 91.682, heading: 128,
    status: "active",
    speed: 14,
    destination: "INC-004",
    destLat: 26.168, destLon: 91.685,
    etaMin: 6,
    mission: "Evacuation support — Pandu ghat",
  },
  {
    id: "BOAT-192",
    kind: "boat",
    lat: 26.122, lng: 91.758, heading: 312,
    status: "available",
    speed: 0,
    mission: "Standby — Brahmaputra south scarp",
  },
  {
    id: "AMB-021",
    kind: "ambulance",
    lat: 26.150, lng: 91.740, heading: 120,
    status: "en_route",
    speed: 34,
    destination: "INC-002",
    destLat: 26.158, destLon: 91.772,
    etaMin: 9,
    mission: "Medical to GS Road block",
  },
  {
    id: "AMB-014",
    kind: "ambulance",
    lat: 26.131, lng: 91.712, heading: 78,
    status: "active",
    speed: 18,
    destination: "INC-001",
    destLat: 26.1395, destLon: 91.6367,
    etaMin: 4,
    mission: "On-scene stabilisation — Bharalu",
  },
  {
    id: "AIR-007",
    kind: "helicopter",
    lat: 26.155, lng: 91.728, heading: 300,
    status: "en_route",
    speed: 145,
    destination: "INC-004",
    destLat: 26.168, destLon: 91.685,
    etaMin: 7,
    mission: "Airlift assessment — Pandu Port",
  },
  {
    id: "RV-009",
    kind: "rescue_vehicle",
    lat: 26.138, lng: 91.768, heading: 195,
    status: "en_route",
    speed: 28,
    destination: "INC-003",
    destLat: 26.108, destLon: 91.72,
    etaMin: 11,
    mission: "Utility crew — Fatasil feeder",
  },
];

/** Small deterministic jitter so demo feels alive even before backend */
export function stepSimulatedResources(prev: PrismResource[], t: number): PrismResource[] {
  return prev.map(r => {
    if (r.status === "available" || r.status === "offline") return r;
    // interpolate toward destination at speed-based increment, then loop once reached
    const destLat = r.destLat ?? r.lat;
    const destLng = r.destLon ?? r.lng;
    const totalDist = Math.hypot(destLat - r.lat, destLng - r.lng);
    if (totalDist < 0.00055) {
      // arrived → bounce to slight orbit then reset
      if (r.status === "en_route" && t % 240 < 6) {
        return { ...r, status: "arrived" as const, etaMin: 0, heading: r.heading };
      }
      if (r.status === "arrived") return r;
      return r;
    }
    // speed → step (helicopter larger)
    const base = r.kind === "helicopter" ? 0.00042 : r.kind === "boat" ? 0.00012 : 0.00016;
    const f = Math.min(1, base * (0.9 + Math.sin(t * 0.6) * 0.12));
    const ratio = Math.min(1, f / totalDist);
    const nlng = r.lng + (destLng - r.lng) * ratio;
    const nlat = r.lat + (destLat - r.lat) * ratio;
    const dh = Math.atan2(destLng - r.lng, destLat - r.lat) * 180 / Math.PI;
    let nh = dh;
    // shortest rotate for heading
    let diff = ((nh - r.heading + 540) % 360) - 180;
    nh = r.heading + diff * 0.18;
    const remain = Math.hypot(destLat - nlat, destLng - nlng);
    const totalRoute = Math.hypot((r.destLat ?? nlat) - (r.lat - (destLng - nlng) * 0), (r.destLon ?? nlng) - r.lng);
    void totalRoute;
    const eta = Math.max(1, Math.ceil((remain / Math.max(0.0001, totalDist)) * (r.etaMin ?? 12)));
    return { ...r, lng: nlng, lat: nlat, heading: (nh + 360) % 360, etaMin: remain < 0.0006 ? 1 : eta };
  });
}
