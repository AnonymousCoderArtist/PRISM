// Dark Matter style (Carto) — OSM attribution preserved, no API key needed
// Alternative fallback: demotiles.maplibre.org/style.json
export const DARK_STYLE = "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json";

// Backup style if dark-matter is blocked
export const LIGHT_DEMO_STYLE = "https://demotiles.maplibre.org/style.json";

export const GUWAHATI_CAMERA = {
  global: { center: [78.9629, 20.5937] as [number, number], zoom: 1.45, pitch: 0, bearing: 0 },
  india:  { center: [78.9629, 20.5937] as [number, number], zoom: 4.2, pitch: 10, bearing: 0 },
  assam:  { center: [92.9376, 26.2006] as [number, number], zoom: 6.9, pitch: 20, bearing: -4 },
  guwahati: { center: [91.7434, 26.1468] as [number, number], zoom: 11.35, pitch: 42, bearing: -14 },
};

export const WARD_FILL = {
  base: "rgba(204,255,0,0.06)",
  hover: "rgba(204,255,0,0.18)",
  selected: "rgba(204,255,0,0.28)",
  stroke: "rgba(204,255,0,0.55)",
  selectedStroke: "#CCFF00",
};

export const WARD_LINE_WIDTH = {
  base: 0.85,
  selected: 1.6,
};
