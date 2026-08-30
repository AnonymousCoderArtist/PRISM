import type { PrismResource } from "./resourceTypes";

/**
 * Simulated fleet — makes demo runnable without backend.
 * Covers acceptance: 3 boats, 2 ambulances, 1 heli, 1 rescue_vehicle.
 * Routes point to incident wards from mockIncidents.
 */
// ADMIN HQ — Dispur Annex (single dispatch origin for Google-Maps style fleet)
const ADMIN_LNG = 91.752;
const ADMIN_LAT = 26.142;

export const SIMULATED_RESOURCES: PrismResource[] = [
  {
    id: "BOAT-174",
    kind: "boat",
    lat: ADMIN_LAT + 0.0012, lng: ADMIN_LNG + 0.0008, heading: 268,
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
    lat: ADMIN_LAT - 0.0006, lng: ADMIN_LNG - 0.0005, heading: 291,
    status: "en_route",
    speed: 14,
    destination: "INC-004",
    destLat: 26.168, destLon: 91.685,
    etaMin: 6,
    mission: "Evacuation support — Pandu ghat",
  },
  {
    id: "BOAT-192",
    kind: "boat",
    lat: ADMIN_LAT + 0.0004, lng: ADMIN_LNG - 0.001, heading: 223,
    status: "en_route",
    speed: 18,
    destination: "INC-042 • Pandu South",
    destLat: 26.122, destLon: 91.758,
    etaMin: 9,
    mission: "Standby → dispatched Pandu South",
  },
  {
    id: "AMB-021",
    kind: "ambulance",
    lat: ADMIN_LAT + 0.0009, lng: ADMIN_LNG + 0.0011, heading: 51,
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
    lat: ADMIN_LAT - 0.0009, lng: ADMIN_LNG + 0.0006, heading: 268,
    status: "en_route",
    speed: 18,
    destination: "INC-001",
    destLat: 26.1395, destLon: 91.6367,
    etaMin: 4,
    mission: "On-scene stabilisation — Bharalu",
  },
  {
    id: "AIR-007",
    kind: "helicopter",
    lat: ADMIN_LAT + 0.0015, lng: ADMIN_LNG - 0.0007, heading: 291,
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
    lat: ADMIN_LAT - 0.0011, lng: ADMIN_LNG + 0.0014, heading: 223,
    status: "en_route",
    speed: 28,
    destination: "INC-003",
    destLat: 26.108, destLon: 91.72,
    etaMin: 11,
    mission: "Utility crew — Fatasil feeder",
  },
];

function arcPoint(sLng: number, sLat: number, eLng: number, eLat: number, t: number, helico: boolean): [number, number] {
  const mx = (sLng + eLng) / 2;
  const my = (sLat + eLat) / 2;
  const dx = eLng - sLng;
  const dy = eLat - sLat;
  const len = Math.hypot(dx, dy) || 0.001;
  const off = helico ? len * 0.38 : len * 0.22;
  const nx = -dy / len;
  const ny = dx / len;
  const cx = mx + nx * off;
  const cy = my + ny * off;
  const x = (1 - t) * (1 - t) * sLng + 2 * (1 - t) * t * cx + t * t * eLng;
  const y0 = (1 - t) * (1 - t) * sLat + 2 * (1 - t) * t * cy + t * t * eLat;
  const y = y0 + Math.sin(t * Math.PI) * (helico ? 0.007 : 0.003);
  return [x, y];
}

/** Small deterministic jitter so demo feels alive even before backend — now follows 3D airplane-like arc from ADMIN */
export function stepSimulatedResources(prev: PrismResource[], t: number): PrismResource[] {
  return prev.map(r => {
    if (r.status === "available" || r.status === "offline") return r;
    const destLat = r.destLat ?? r.lat;
    const destLng = r.destLon ?? r.lng;
    const totalDist = Math.hypot(destLat - r.lat, destLng - r.lng);
    if (totalDist < 0.00055) {
      if (r.status === "en_route" && t % 240 < 6) {
        return { ...r, status: "arrived" as const, etaMin: 0, heading: r.heading };
      }
      if (r.status === "arrived") return r;
      return r;
    }
    // progress along ADMIN->dest arc (cool 3D airplane-like)
    const sLng = ADMIN_LNG;
    const sLat = ADMIN_LAT;
    const adminDist = Math.hypot(destLng - sLng, destLat - sLat) || 0.001;
    const curDist = Math.hypot(destLng - r.lng, destLat - r.lat);
    const prog = 1 - curDist / adminDist; // 0 at admin, 1 at dest
    const base = r.kind === "helicopter" ? 0.008 : r.kind === "boat" ? 0.0042 : 0.005;
    const step = base * (0.9 + Math.sin(t * 0.6) * 0.12);
    const nProg = Math.min(1, prog + step);
    const [nlng, nlat] = arcPoint(sLng, sLat, destLng, destLat, nProg, r.kind === "helicopter");
    // heading tangent to arc
    const [prevX, prevY] = arcPoint(sLng, sLat, destLng, destLat, Math.max(0, nProg - 0.02), r.kind === "helicopter");
    const dh = Math.atan2(nlng - prevX, nlat - prevY) * 180 / Math.PI;
    let nh = dh;
    let diff = ((nh - r.heading + 540) % 360) - 180;
    nh = r.heading + diff * 0.35;
    const remain = Math.hypot(destLat - nlat, destLng - nlng);
    const eta = Math.max(1, Math.ceil((remain / adminDist) * (r.etaMin ?? 12)));
    return { ...r, lng: nlng, lat: nlat, heading: (nh + 360) % 360, etaMin: remain < 0.0006 ? 1 : eta };
  });
}
