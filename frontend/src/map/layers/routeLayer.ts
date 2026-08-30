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
  // shadow for 3D airplane-like lift (soft, below)
  map.addLayer({
    id: "prism-route-shadow",
    type: "line",
    source: "prism-resource-routes",
    paint: {
      "line-color": "rgba(0,0,0,0.5)",
      "line-width": 12,
      "line-opacity": 0.45,
      "line-blur": 2,
      "line-translate": [3, 7],
      "line-translate-anchor": "viewport" as never,
    },
    layout: { "line-cap": "round", "line-join": "round" } as never,
  } as never);
  // predicted curved dashed line — 3D live over map
  map.addLayer({
    id: "prism-route-remaining",
    type: "line",
    source: "prism-resource-routes",
    paint: {
      "line-color": [
        "match", ["get", "kind"],
        "ambulance", "#FFFFFF",
        "helicopter", "#CCFF00",
        "boat", "#48D8FF",
        "rescue_vehicle", "#F5B942",
        "#8A9698"
      ],
      "line-width": [
        "interpolate", ["linear"], ["zoom"],
        10, 3,
        13, 5.5,
        16, 7
      ],
      "line-opacity": 1.0,
      "line-dasharray": [1.5, 1.5],
    },
    layout: { "line-cap": "round", "line-join": "round" } as never,
  });
}

export function updateRoutes(map: maplibregl.Map, resources: PrismResource[], _trails: Map<string, [number, number][]>, _minZoom = 0): void {
  const remSrc = map.getSource("prism-resource-routes") as maplibregl.GeoJSONSource | undefined;
  if (!remSrc) return;
  const remaining = buildRouteCollection(resources);
  // Show routes for any resource that is moving or has moved (en_route, active, arrived) — keeps path visible after plan
  const filteredRemaining = {
    type: "FeatureCollection" as const,
    features: remaining.features.filter((f: unknown) => {
      const s = (f as { properties: { status: string } }).properties.status;
      return s === "en_route" || s === "active" || s === "arrived";
    }),
  };
  remSrc.setData(filteredRemaining as unknown as never);
}
