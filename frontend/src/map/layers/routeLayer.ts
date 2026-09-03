import * as maplibregl from "maplibre-gl";
import type { PrismResource } from "../../resources/resourceTypes";
import { buildRouteCollection } from "../../resources/ResourceRoutes";

export function ensureRouteLayers(map: maplibregl.Map): void {
  if (map.getSource("prism-resource-routes")) return;
  map.addSource("prism-resource-routes", {
    type: "geojson",
    data: { type: "FeatureCollection", features: [] } as unknown as never,
  });
  map.addLayer({
    id: "prism-route-shadow",
    type: "line",
    source: "prism-resource-routes",
    paint: {
      "line-color": "rgba(0,0,0,0.55)",
      "line-width": 14,
      "line-opacity": 0.55,
      "line-blur": 2.4,
      "line-translate": [3, 8],
      "line-translate-anchor": "viewport" as never,
    },
    layout: { "line-cap": "round", "line-join": "round" } as never,
  } as never);
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
        10, 4,
        13, 7,
        16, 9
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
  const filteredRemaining = {
    type: "FeatureCollection" as const,
    features: remaining.features.filter((f: unknown) => {
      const s = (f as { properties: { status: string } }).properties.status;
      return s === "en_route" || s === "active" || s === "arrived";
    }),
  };
  remSrc.setData(filteredRemaining as unknown as never);
}
