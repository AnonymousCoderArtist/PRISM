export type ResourceKind = "ambulance" | "helicopter" | "boat" | "rescue_vehicle";
export type ResourceStatus = "available" | "en_route" | "active" | "arrived" | "offline";

export type PrismResource = {
  id: string;
  kind: ResourceKind;
  lat: number;
  lng: number;
  heading: number; // degrees 0-360, 0=north
  status: ResourceStatus;
  speed?: number; // km/h
  destination?: string; // incident id or label
  destLon?: number;
  destLat?: number;
  origin?: { lat: number; lng: number };
  etaMin?: number;
  mission?: string;
};

/** Lightweight descriptor for backend GET /api/resources → PrismResource adapter */
export function toPrismResource(raw: unknown): PrismResource | null {
  const r = raw as Record<string, unknown>;
  if (!r || typeof r.id !== "string") return null;
  const kind = String(r.kind ?? r.type ?? "ambulance");
  const validKinds: ResourceKind[] = ["ambulance", "helicopter", "boat", "rescue_vehicle"];
  // Map backend status to a ResourceStatus the map can render
  const rawStatus = String(r.status ?? "available").toLowerCase();
  let status: ResourceStatus = "available";
  if (rawStatus === "deployed" || rawStatus === "en_route" || rawStatus === "dispatched") status = "en_route";
  else if (rawStatus === "active" || rawStatus === "in_use") status = "active";
  else if (rawStatus === "arrived" || rawStatus === "onscene" || rawStatus === "on_scene") status = "arrived";
  else if (rawStatus === "offline" || rawStatus === "maintenance") status = "offline";
  return {
    id: String(r.id),
    kind: (validKinds.includes(kind as ResourceKind) ? (kind as ResourceKind) : "ambulance"),
    lat: Number(r.lat ?? r.latitude ?? 26.14),
    lng: Number(r.lng ?? r.lon ?? r.longitude ?? 91.73),
    heading: Number(r.heading ?? 0),
    status,
    speed: r.speed != null ? Number(r.speed) : undefined,
    destination: r.destination ? String(r.destination) : undefined,
    destLon: r.destLon != null ? Number(r.destLon) : r.dest_lng != null ? Number(r.dest_lng) : undefined,
    destLat: r.destLat != null ? Number(r.destLat) : r.dest_lat != null ? Number(r.dest_lat) : undefined,
    etaMin: r.etaMin != null ? Number(r.etaMin) : r.eta_minutes != null ? Number(r.eta_minutes) : undefined,
    mission: r.mission ? String(r.mission) : undefined,
    origin: r.origin ? (r.origin as { lat: number; lng: number }) : { lat: Number(r.lat ?? r.latitude ?? 26.14), lng: Number(r.lng ?? r.lon ?? r.longitude ?? 91.73) },
  };
}
