import type { PrismResource } from "./resourceTypes";

export type RouteGeoJSON = {
  type: "FeatureCollection";
  features: { type: "Feature"; properties: Record<string, unknown>; geometry: { type: "LineString"; coordinates: number[][] } }[];
};

export function curvePoints(s: [number, number], e: [number, number], steps = 56): [number, number][] {
  const dx = e[0] - s[0];
  const dy = e[1] - s[1];
  const dist = Math.hypot(dx, dy);
  const nx = -dy / (dist || 1);
  const ny = dx / (dist || 1);
  const lift = dist * 0.45;
  const cx = (s[0] + e[0]) / 2 + nx * lift;
  const cy = (s[1] + e[1]) / 2 + ny * lift;
  const pts: [number, number][] = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const mt = 1 - t;
    const x = mt * mt * s[0] + 2 * mt * t * cx + t * t * e[0];
    const y = mt * mt * s[1] + 2 * mt * t * cy + t * t * e[1];
    pts.push([x, y]);
  }
  return pts;
}

export function buildRouteCollection(resources: PrismResource[]): RouteGeoJSON {
  return {
    type: "FeatureCollection",
    features: resources
      .filter(r => r.status === "en_route" && r.destLon != null && r.destLat != null)
      .map(r => ({
        type: "Feature" as const,
        properties: { id: r.id, kind: r.kind, status: r.status },
        geometry: {
          type: "LineString" as const,
          coordinates: curvePoints([r.lng, r.lat], [r.destLon!, r.destLat!]),
        },
      })),
  };
}

export function buildCoveredCollection(trails: Map<string, [number, number][]>, resources: PrismResource[]): RouteGeoJSON {
  const feats: RouteGeoJSON["features"] = [];
  for (const r of resources) {
    const t = trails.get(r.id);
    if (!t || t.length < 2) continue;
    feats.push({
      type: "Feature",
      properties: { id: r.id, kind: r.kind },
      geometry: { type: "LineString", coordinates: t as unknown as number[][] },
    });
  }
  return { type: "FeatureCollection", features: feats };
}
