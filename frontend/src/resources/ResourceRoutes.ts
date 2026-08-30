import type { PrismResource } from "./resourceTypes";

// Use plain GeoJSON-like objects to avoid requiring @types/geojson at build
export type RouteGeoJSON = {
  type: "FeatureCollection";
  features: { type: "Feature"; properties: Record<string, unknown>; geometry: { type: "LineString"; coordinates: number[][] } }[];
};

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
          coordinates: [
            [r.lng, r.lat],
            [r.destLon!, r.destLat!],
          ],
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
