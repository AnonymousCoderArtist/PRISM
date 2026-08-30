import type { PrismResource } from "./resourceTypes";

// Use plain GeoJSON-like objects to avoid requiring @types/geojson at build
export type RouteGeoJSON = {
  type: "FeatureCollection";
  features: { type: "Feature"; properties: Record<string, unknown>; geometry: { type: "LineString"; coordinates: number[][] } }[];
};

function arcCoordinates(sLng: number, sLat: number, eLng: number, eLat: number, helico: boolean): number[][] {
  const steps = 28;
  const mx = (sLng + eLng) / 2;
  const my = (sLat + eLat) / 2;
  const dx = eLng - sLng;
  const dy = eLat - sLat;
  const len = Math.hypot(dx, dy) || 0.001;
  const off = helico ? len * 0.38 : len * 0.22;
  const nx = -dy / len;
  const ny = dx / len;
  // alternate side per id hash to avoid overlapping
  const cx = mx + nx * off;
  const cy = my + ny * off;
  const pts: number[][] = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    // quadratic bezier
    const x = (1 - t) * (1 - t) * sLng + 2 * (1 - t) * t * cx + t * t * eLng;
    const y = (1 - t) * (1 - t) * sLat + 2 * (1 - t) * t * cy + t * t * eLat;
    // add subtle airplane-like lift (sin) — visual 3D over map
    const lift = Math.sin(t * Math.PI) * (helico ? 0.007 : 0.003);
    pts.push([x, y + lift]);
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
          coordinates: arcCoordinates(r.lng, r.lat, r.destLon!, r.destLat!, r.kind === "helicopter"),
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
