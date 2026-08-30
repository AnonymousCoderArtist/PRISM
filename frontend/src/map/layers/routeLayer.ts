import * as maplibregl from "maplibre-gl";
import type { PrismResource } from "../../resources/resourceTypes";
import { buildRouteCollection } from "../../resources/ResourceRoutes";

/**
 * Predicted route only — clean, no extra lines underneath (per user request).
 * Single dashed line from current position to destination for en_route resources.
 */

export function ensureRouteLayers(map: maplibregl.Map): void {
  if (map.getSource("prism-resource-routes")) return;
  map.addSource("prism-resource-routes", {
    type: "geojson",
    data: { type: "FeatureCollection", features: [] } as unknown as never,
  });
  // predicted dashed line — subtle professional
  map.addLayer({
    id: "prism-route-remaining",
    type: "line",
    source: "prism-resource-routes",
    paint: {
      "line-color": ["match", ["get", "kind"], "ambulance", "rgba(255,255,255,0.42)", "helicopter", "rgba(204,255,0,0.52)", "boat", "rgba(72,216,255,0.48)", "rescue_vehicle", "rgba(245,185,66,0.48)", "rgba(138,150,152,0.42)"],
      "line-width": 1.8,
      "line-opacity": 0.58,
      "line-dasharray": [1.6, 1.6],
    },
    layout: { "line-cap": "round", "line-join": "round" } as never,
  });
}

export function updateRoutes(map: maplibregl.Map, resources: PrismResource[], _trails: Map<string, [number, number][]>, _minZoom = 0): void {
  const remSrc = map.getSource("prism-resource-routes") as maplibregl.GeoJSONSource | undefined;
  if (!remSrc) return;
  const remaining = buildRouteCollection(resources);
  const filteredRemaining = {
    type: "FeatureCollection" as const,
    features: remaining.features.filter((f: unknown) => ((f as { properties: { status: string } }).properties.status) === "en_route"),
  };
  remSrc.setData(filteredRemaining as unknown as never);
}
