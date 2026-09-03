export const DARK_STYLE = "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json";

export const LIGHT_DEMO_STYLE = "https://demotiles.maplibre.org/style.json";

export const GUWAHATI_CAMERA = {
  global: { center: [78.9629, 20.5937] as [number, number], zoom: 1.18, pitch: 0, bearing: -8 },
  india:  { center: [78.9629, 20.5937] as [number, number], zoom: 3.65, pitch: 10, bearing: -4 },
  assam:  { center: [92.9376, 26.2006] as [number, number], zoom: 6.55, pitch: 22, bearing: -6 },
  guwahati: { center: [91.7434, 26.1468] as [number, number], zoom: 11.35, pitch: 46, bearing: -14 },
};

export const WARD_FILL = {
  base: "rgba(204,255,0,0.06)",
  hover: "rgba(204,255,0,0.18)",
  selected: "rgba(204,255,0,0.5)",
  stroke: "rgba(204,255,0,0.55)",
  selectedStroke: "#CCFF00",
};

export const WARD_LINE_WIDTH = {
  base: 0.85,
  selected: 1.6,
};
