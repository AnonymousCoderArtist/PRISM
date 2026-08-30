import type { PrismResource } from "./resourceTypes";

/**
 * Simulated fleet — makes demo runnable without backend.
 * Each resource starts from its nearest operational area (not all from ADMIN),
 * goes straight to destination, no rotation/orientation towards path — keep as is.
 * Covers acceptance: 3 boats, 2 ambulances, 1 heli, 1 rescue_vehicle.
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
    origin: { lat: 26.145, lng: 91.735 },
    etaMin: 18,
    mission: "Incident response — Ward 1",
  },
  {
    id: "BOAT-181",
    kind: "boat",
    lat: 26.162, lng: 91.682, heading: 45,
    status: "en_route",
    speed: 14,
    destination: "INC-004",
    destLat: 26.168, destLon: 91.685,
    origin: { lat: 26.162, lng: 91.682 },
    etaMin: 6,
    mission: "Evacuation support — Pandu ghat",
  },
  {
    id: "BOAT-192",
    kind: "boat",
    lat: 26.122, lng: 91.758, heading: 45,
    status: "en_route",
    speed: 18,
    destination: "INC-042 • Pandu South",
    destLat: 26.122, destLon: 91.758,
    origin: { lat: 26.122, lng: 91.758 },
    etaMin: 9,
    mission: "Dispatched Pandu South",
  },
  {
    id: "AMB-021",
    kind: "ambulance",
    lat: 26.150, lng: 91.740, heading: 225,
    status: "en_route",
    speed: 34,
    destination: "INC-002",
    destLat: 26.158, destLon: 91.772,
    origin: { lat: 26.150, lng: 91.740 },
    etaMin: 9,
    mission: "Medical to GS Road block",
  },
  {
    id: "AMB-014",
    kind: "ambulance",
    lat: 26.131, lng: 91.712, heading: 225,
    status: "en_route",
    speed: 18,
    destination: "INC-001",
    destLat: 26.1395, destLon: 91.6367,
    origin: { lat: 26.131, lng: 91.712 },
    etaMin: 4,
    mission: "On-scene stabilisation — Ward 1",
  },
  {
    id: "AIR-007",
    kind: "helicopter",
    lat: 26.155, lng: 91.728, heading: 225,
    status: "en_route",
    speed: 145,
    destination: "INC-004",
    destLat: 26.168, destLon: 91.685,
    origin: { lat: 26.155, lng: 91.728 },
    etaMin: 7,
    mission: "Airlift assessment — Pandu Port",
  },
  {
    id: "RV-009",
    kind: "rescue_vehicle",
    lat: 26.138, lng: 91.768, heading: 225,
    status: "en_route",
    speed: 28,
    destination: "INC-003",
    destLat: 26.108, destLon: 91.72,
    origin: { lat: 26.138, lng: 91.768 },
    etaMin: 11,
    mission: "Utility crew — Fatasil feeder",
  },
];

/** Straight movement, no rotation, small deterministic step — keep original dimensions, no flatten */
export function stepSimulatedResources(prev: PrismResource[], t: number): PrismResource[] {
  return prev.map(r => {
    if (r.status === "available" || r.status === "offline") return r;
    const destLat = r.destLat ?? r.lat;
    const destLng = r.destLon ?? r.lng;
    const totalDist = Math.hypot(destLat - r.lat, destLng - r.lng);
    if (totalDist < 0.00055) {
      // Arrived — swap start/dest so the resource loops back, keeping the demo live
      if (r.status === "en_route" && t % 240 < 6) {
        const origin = r.origin ?? { lat: r.lat, lng: r.lng };
        return {
          ...r,
          status: "en_route" as const,
          origin: { lat: destLat, lng: destLng },
          destLat: origin.lat,
          destLon: origin.lng,
          destination: r.destination,
          etaMin: 12,
        };
      }
      if (r.status === "arrived") return { ...r, status: "en_route" as const };
      return r;
    }
    const base = r.kind === "helicopter" ? 0.00042 : r.kind === "boat" ? 0.00012 : 0.00016;
    const f = Math.min(1, base * (0.9 + Math.sin(t * 0.6) * 0.12));
    const ratio = Math.min(1, f / totalDist);
    const nlng = r.lng + (destLng - r.lng) * ratio;
    const nlat = r.lat + (destLat - r.lat) * ratio;
    const remain = Math.hypot(destLat - nlat, destLng - nlng);
    const eta = Math.max(1, Math.ceil((remain / Math.max(0.0001, totalDist)) * (r.etaMin ?? 12)));
    return { ...r, lng: nlng, lat: nlat, etaMin: remain < 0.0006 ? 1 : eta };
  });
}
