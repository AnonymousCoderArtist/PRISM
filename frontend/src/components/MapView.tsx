import { useEffect, useRef, useState } from "react";
import * as maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { DARK_STYLE, GUWAHATI_CAMERA, WARD_FILL } from "../lib/mapStyle";
import { usePrism } from "../store/PrismContext";
import { EmergencyBanner } from "./EmergencyBanner";
import { ensureRouteLayers, updateRoutes } from "../map/layers/routeLayer";

const WARDS_URL = "/data/guwahati/geojson/wards_guwahati.geojson";
const ROADS_URL = "/data/guwahati/geojson/roads.geojson";
const POLYGONS_URL = "/data/guwahati/geojson/polygons.geojson";

export function MapView() {
  const mapRef = useRef<maplibregl.Map | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [phase, setPhase] = useState<"global" | "india" | "assam" | "guwahati">("global");
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hoverWard, setHoverWard] = useState<{ code: string; name: string; area: string } | null>(null);
  const [cursor, setCursor] = useState<{ x: number; y: number } | null>(null);
  const [hoverAsset, setHoverAsset] = useState<{ id: string; label: string; kind: string; eta: number; x: number; y: number; lon: number; lat: number; progress: number; destination?: string; destLat?: number; destLon?: number; status?: string } | null>(null);
  const [hoverIncident, setHoverIncident] = useState<{ id: string; title: string; severity: string; event_type: string; people: number; priority: number; x: number; y: number } | null>(null);
  const [hoverSignalLoss, setHoverSignalLoss] = useState<{ ward: string; name: string; x: number; y: number } | null>(null);
  const { selectedWardCode, selectWard, selectIncident, incidents, movingAssets, simulationState, planPhase, prismResources, resourceTrails, selectedResourceId, selectResource, selectedResource } = usePrism();
  const prismResRef = useRef(prismResources);
  prismResRef.current = prismResources;
  const selectedResIdRef = useRef(selectedResourceId);
  selectedResIdRef.current = selectedResourceId;
  const FILL = WARD_FILL;
  const pngReadyRef = useRef(false);
  const isEmergency = simulationState === "running" && (planPhase === "connecting" || planPhase === "collecting" || planPhase === "verifying" || planPhase === "optimizing");
  const isDispatched = planPhase === "ready";

  const incidentsRef = useRef(incidents);
  incidentsRef.current = incidents;
  const movingRef = useRef(movingAssets);
  movingRef.current = movingAssets;

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    let signalLossInterval: ReturnType<typeof setInterval> | null = null;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: DARK_STYLE,
      center: GUWAHATI_CAMERA.global.center,
      zoom: GUWAHATI_CAMERA.global.zoom,
      pitch: 0,
      bearing: 0,
      attributionControl: false,
      maxPitch: 65,
      ...( { projection: { type: "globe" } } as unknown as Record<string, unknown>),
    } as maplibregl.MapOptions);

    mapRef.current = map;

    map.addControl(new maplibregl.AttributionControl({ compact: true }), "bottom-right");
    map.addControl(new maplibregl.NavigationControl({ showCompass: true }), "bottom-right");
    map.addControl(new maplibregl.ScaleControl({ unit: "metric" }), "bottom-left");

    map.on("load", async () => {
      try {
        setPhase("global");
        map.flyTo({ ...GUWAHATI_CAMERA.india, duration: 2100, essential: true, curve: 1.42, easing: (t: number) => 1 - Math.pow(1 - t, 3) });
        await delay(2200);
        setPhase("india");
        map.flyTo({ ...GUWAHATI_CAMERA.assam, duration: 2000, essential: true, curve: 1.35, easing: (t: number) => 1 - Math.pow(1 - t, 3) });
        await delay(2100);
        setPhase("assam");
        map.flyTo({ ...GUWAHATI_CAMERA.guwahati, duration: 2400, essential: true, curve: 1.25, easing: (t: number) => 1 - Math.pow(1 - t, 3) });
        await delay(2500);
        setPhase("guwahati");

        const res = await fetch(WARDS_URL);
        if (!res.ok) throw new Error(`Failed to fetch wards: ${res.status}`);
        const geo = await res.json();

        map.addSource("wards", { type: "geojson", data: geo });

        map.addLayer({
          id: "wards-fill",
          type: "fill",
          source: "wards",
          paint: {
            "fill-color": FILL.base,
            "fill-opacity": 0.85,
          },
        });

        const wardsSrc = map.getSource("wards") as unknown as { _data?: { features?: { properties?: { ward_lgd_code?: string | number; sourcewardcode?: string | number } }[] } } | undefined;
        const allFeatures = wardsSrc && wardsSrc._data && Array.isArray(wardsSrc._data.features) ? wardsSrc._data.features : [];
        const silentCodes = ["33", "41", "57"];
        let silentFeatures = allFeatures.filter(f => {
          if (!f.properties) return false;
          const swc = f.properties.sourcewardcode;
          const lgd = f.properties.ward_lgd_code;
          const lgdTail = typeof lgd === "number" ? String(lgd % 100) : typeof lgd === "string" ? (lgd.length > 2 ? lgd.slice(-2) : lgd) : "";
          return silentCodes.includes(String(swc)) || silentCodes.includes(lgdTail);
        });
        if (silentFeatures.length === 0) {
          silentFeatures = allFeatures.slice(0, 3);
        }
        const signalLossGeo = {
          type: "FeatureCollection",
          features: silentFeatures,
        } as unknown as never;
        map.addSource("cities-signal-loss", { type: "geojson", data: signalLossGeo });
        map.addLayer({
          id: "cities-signal-loss-fill",
          type: "fill",
          source: "cities-signal-loss",
          paint: {
            "fill-color": "#F5B942",
            "fill-opacity": 0.28,
          },
        } as unknown as never);
        map.addLayer({
          id: "cities-signal-loss-pulse",
          type: "line",
          source: "cities-signal-loss",
          paint: {
            "line-color": "#F5B942",
            "line-width": 2,
            "line-opacity": 0.85,
            "line-dasharray": [3, 2],
          },
        } as unknown as never);

        map.addLayer({
          id: "wards-fill-hover",
          type: "fill",
          source: "wards",
          paint: {
            "fill-color": FILL.hover,
            "fill-opacity": 0.95,
          },
          filter: ["==", ["get", "ward_lgd_code"], -1],
        });

        map.addLayer({
          id: "wards-fill-selected",
          type: "fill",
          source: "wards",
          paint: {
            "fill-color": FILL.selected,
            "fill-opacity": 0.95,
          },
          filter: ["==", ["get", "ward_lgd_code"], -1],
        });

        map.addLayer({
          id: "wards-line",
          type: "line",
          source: "wards",
          paint: {
            "line-color": FILL.stroke,
            "line-width": 0.9,
            "line-opacity": 0.9,
          },
        });

        map.addLayer({
          id: "wards-line-selected",
          type: "line",
          source: "wards",
          paint: {
            "line-color": FILL.selectedStroke,
            "line-width": 1.8,
            "line-opacity": 1,
          },
          filter: ["==", ["get", "ward_lgd_code"], -1],
        });

        map.addLayer({
          id: "wards-priority",
          type: "fill",
          source: "wards",
          paint: {
            "fill-color": "#F5B942",
            "fill-opacity": 0.0,
          },
          filter: ["in", ["get", "ward_lgd_code"], ["literal", []]],
        });

        const incidentGeo = {
          type: "FeatureCollection",
          features: incidentsRef.current.map(i => ({
            type: "Feature",
            geometry: { type: "Point", coordinates: [i.lon, i.lat] },
            properties: {
              id: i.id,
              severity: i.severity,
              priority: i.priority,
              title: i.title,
            },
          })),
        } as unknown as never;

        map.addSource("incidents", { type: "geojson", data: incidentGeo });

        map.addLayer({
          id: "incidents-glow",
          type: "circle",
          source: "incidents",
          paint: {
            "circle-radius": 18,
            "circle-color": [
              "match", ["get", "severity"],
              "critical", "#FF4D4D",
              "high", "#F5B942",
              "moderate", "#48D8FF",
              "#8A9698"
            ],
            "circle-opacity": 0.14,
            "circle-blur": 0.6,
          },
        });

        map.addLayer({
          id: "incidents-circle",
          type: "circle",
          source: "incidents",
          paint: {
            "circle-radius": 7,
            "circle-color": [
              "match", ["get", "severity"],
              "critical", "#FF4D4D",
              "high", "#F5B942",
              "moderate", "#48D8FF",
              "#8A9698"
            ],
            "circle-stroke-color": "#050607",
            "circle-stroke-width": 1.6,
            "circle-opacity": 1,
          },
        });

        const adminGeo = {
          type: "FeatureCollection",
          features: [
            { type: "Feature", geometry: { type: "Point", coordinates: [91.752, 26.142] }, properties: { name: "ADMIN HQ — Dispur Annex" } },
          ],
        } as unknown as never;
        map.addSource("admin", { type: "geojson", data: adminGeo });
        map.addLayer({
          id: "admin-core",
          type: "circle",
          source: "admin",
          paint: {
            "circle-radius": 9,
            "circle-color": "#CCFF00",
            "circle-stroke-color": "#050607",
            "circle-stroke-width": 2,
            "circle-opacity": 0.96,
          },
        });
        map.addLayer({
          id: "admin-glow",
          type: "circle",
          source: "admin",
          paint: {
            "circle-radius": 22,
            "circle-color": "#CCFF00",
            "circle-opacity": 0.10,
            "circle-blur": 0.7,
          },
        });
        map.addLayer({
          id: "admin-label",
          type: "symbol",
          source: "admin",
          layout: {
            "text-field": "ADMIN",
            "text-size": 9,
            "text-font": ["Open Sans Bold"],
            "text-offset": [0, 1.6],
          },
          paint: {
            "text-color": "#CCFF00",
            "text-halo-color": "#050607",
            "text-halo-width": 1.2,
          },
        });

        const movingGeo = {
          type: "FeatureCollection",
          features: movingRef.current.map(m => ({
            type: "Feature",
            geometry: { type: "Point", coordinates: [m.lon, m.lat] },
            properties: { id: m.id, kind: m.kind, label: m.label, eta: (m as unknown as { etaMin?: number }).etaMin ?? 0 },
          })),
        } as unknown as never;
        map.addSource("moving-assets", { type: "geojson", data: movingGeo });
        const trailsGeo = {
          type: "FeatureCollection",
          features: movingRef.current
            .filter(m => (m.trail?.length ?? 0) > 1)
            .map(m => ({
              type: "Feature",
              geometry: { type: "LineString", coordinates: (m as unknown as { trail: [number, number][] }).trail },
              properties: { id: m.id, kind: m.kind },
            })),
        } as unknown as never;
        map.addSource("moving-trails", { type: "geojson", data: trailsGeo });

        map.addSource("moving-remaining", { type: "geojson", data: { type: "FeatureCollection", features: [] } as unknown as never });

        void 0;

        const pngDefs: { id: string; url: string }[] = [
          { id: "ambulance-icon", url: "/ambulance_icon.png" },
          { id: "ambulance-icon-flip-h", url: "/ambulance_icon_flip_h.png" },
          { id: "boat-icon", url: "/boat_icon.png" },
          { id: "boat-icon-flip-h", url: "/boat_icon_flip_h.png" },
          { id: "helicopter-icon", url: "/helicopter_icon.png" },
          { id: "helicopter-icon-flip-h", url: "/helicopter_icon_flip_h.png" },
          { id: "rescue-icon", url: "/firevehicle_icon.png" },
          { id: "rescue-icon-flip-h", url: "/firevehicle_icon_flip_h.png" },
        ];
        const loadImg = (url: string) =>
          new Promise<HTMLImageElement>((res, rej) => {
            const im = new Image();
            im.crossOrigin = "anonymous";
            im.onload = () => res(im);
            im.onerror = (e) => rej(e);
            im.src = url;
          });
        for (const d of pngDefs) {
          try {
            const img = await loadImg(d.url);
            if (!map.hasImage(d.id)) map.addImage(d.id, img as unknown as HTMLImageElement, { pixelRatio: 2 } as never);
          } catch (e) {
            console.warn(`[PNG] failed ${d.url}`, e);
            await new Promise<void>((done) => {
              (map as unknown as { loadImage: (u: string, cb: (err: unknown, img: HTMLImageElement) => void) => void }).loadImage(d.url, (err, im2) => {
                if (!err && im2 && !map.hasImage(d.id)) {
                  try { map.addImage(d.id, im2 as unknown as HTMLImageElement); } catch {  }
                }
                done();
              });
            });
          }
        }
        map.addSource("prism-png-resources", { type: "geojson", data: { type: "FeatureCollection", features: [] } as unknown as never });
        map.addLayer({
          id: "prism-png-shadow",
          type: "circle",
          source: "prism-png-resources",
          paint: {
            "circle-radius": 12,
            "circle-color": "rgba(0,0,0,0.5)",
            "circle-blur": 0.9,
            "circle-translate": [4, 8],
            "circle-translate-anchor": "viewport" as never,
            "circle-opacity": 0.55,
          },
        } as unknown as never);
        map.addLayer({
          id: "prism-png-dot",
          type: "circle",
          source: "prism-png-resources",
          paint: {
            "circle-radius": 7,
            "circle-color": "#CCFF00",
            "circle-stroke-color": "#050607",
            "circle-stroke-width": 1.5,
            "circle-opacity": 0.95,
          },
        } as unknown as never);
        map.addLayer({
          id: "prism-png-layer",
          type: "symbol",
          source: "prism-png-resources",
          layout: {
            "icon-image": ["get", "icon"] as unknown as never,
            "icon-size": 0.18 as unknown as never,
            "icon-rotate": ["get", "headingAdj"] as unknown as never,
            "icon-rotation-alignment": "map" as unknown as never,
            "icon-pitch-alignment": "viewport" as unknown as never,
            "icon-allow-overlap": true,
            "icon-ignore-placement": true,
            "icon-anchor": "center",
            "text-field": ["get", "id"] as unknown as never,
            "text-size": 9,
            "text-font": ["Open Sans Bold"] as never,
            "text-offset": [0, 1.15],
            "text-anchor": "top",
            "text-allow-overlap": true,
          },
          paint: {
            "text-color": "#E8ECEB",
            "text-halo-color": "#050607",
            "text-halo-width": 1,
            "icon-opacity": 1,
          },
        } as unknown as never);
        pngReadyRef.current = true;

        let pulseT = 0;
        signalLossInterval = setInterval(() => {
          pulseT = (pulseT + 1) % 100;
          const opacity = 0.28 + 0.25 * Math.abs(Math.sin(pulseT * 0.0628));
          if (map.getLayer("cities-signal-loss-fill")) {
            map.setPaintProperty("cities-signal-loss-fill", "fill-opacity", opacity);
          }
        }, 80);

        map.on("mousemove", "wards-fill", (e: maplibregl.MapLayerMouseEvent) => {
          if (!e.features?.[0]) return;
          const props = e.features[0].properties as Record<string, unknown>;
          const code = String(props.ward_lgd_code);
          const name = String(props.ward_lgd_name ?? `Ward ${code}`);
          const rawArea = (props as Record<string, unknown>)["st_area(shape)"] as number | undefined;
          const areaKm = rawArea ? (rawArea / 1_000_000).toFixed(2) + " km²" : "";
          const wardNameShort = name.replace("Guwahati (M Corp.) - ", "");
          const rect = (map.getContainer() as HTMLElement).getBoundingClientRect();
          setCursor({ x: e.point.x, y: e.point.y });
          void rect;
          if (code !== hoverWard?.code) {
            setHoverWard({ code, name: wardNameShort, area: areaKm });
            map.setFilter("wards-fill-hover", ["==", ["get", "ward_lgd_code"], Number(code)]);
          }
          map.getCanvas().style.cursor = "pointer";
        });

        map.on("mouseleave", "wards-fill", () => {
          setHoverWard(null);
          setCursor(null);
          map.setFilter("wards-fill-hover", ["==", ["get", "ward_lgd_code"], -1]);
          map.getCanvas().style.cursor = "";
        });

        map.on("click", "wards-fill", (e: maplibregl.MapLayerMouseEvent) => {
          if (!e.features?.[0]) return;
          const props = e.features[0].properties as Record<string, unknown>;
          const code = Number(props.ward_lgd_code);
          selectWard(code);
          if (e.lngLat) {
            map.flyTo({ center: [e.lngLat.lng, e.lngLat.lat], zoom: 12.2, pitch: 42, bearing: -10, duration: 900, essential: true });
          }
        });

        map.on("click", "incidents-circle", (e: maplibregl.MapLayerMouseEvent) => {
          if (!e.features?.[0]) return;
          const id = (e.features[0].properties as { id: string }).id;
          selectIncident(id);
          const inc = incidentsRef.current.find(x => x.id === id);
          if (inc) {
            selectWard(inc.wardCode);
            map.flyTo({ center: [inc.lon, inc.lat], zoom: 13, pitch: 48, bearing: -12, duration: 900, essential: true });
          }
        });

        map.on("mousemove", "cities-signal-loss-fill", (e: maplibregl.MapLayerMouseEvent) => {
          if (!e.features?.[0]) return;
          const p = e.features[0].properties as Record<string, unknown>;
          const swc = p.sourcewardcode;
          const lgd = p.ward_lgd_code;
          const ward = swc ? String(swc) : (typeof lgd === "number" ? String(lgd % 100) : "?");
          setHoverSignalLoss({ ward, name: String(p.ward_lgd_name ?? `Ward ${ward}`), x: e.point.x, y: e.point.y });
          map.getCanvas().style.cursor = "pointer";
        });
        map.on("mouseleave", "cities-signal-loss-fill", () => {
          setHoverSignalLoss(null);
          map.getCanvas().style.cursor = "";
        });
        map.on("click", "cities-signal-loss-fill", (e: maplibregl.MapLayerMouseEvent) => {
          if (!e.features?.[0]) return;
          const p = e.features[0].properties as Record<string, unknown>;
          const swc = p.sourcewardcode;
          const lgd = p.ward_lgd_code;
          const lgdTail = typeof lgd === "number" ? lgd % 100 : typeof lgd === "string" ? parseInt(lgd.slice(-2), 10) : NaN;
          const code = swc ? Number(swc) : lgdTail;
          if (code && !isNaN(code)) {
            selectWard(code);
            const center = (e as unknown as { lngLat?: maplibregl.LngLat }).lngLat;
            if (center) map.flyTo({ center: [center.lng, center.lat], zoom: 12.4, pitch: 42, duration: 800, essential: true });
          }
        });

        map.on("mousemove", "incidents-circle", (e: maplibregl.MapLayerMouseEvent) => {
          if (!e.features?.[0]) return;
          const p = e.features[0].properties as Record<string, unknown>;
          const id = String(p.id);
          const inc = incidentsRef.current.find(i => i.id === id);
          setHoverIncident({
            id,
            title: String(p.title),
            severity: String(inc?.severity ?? "moderate"),
            event_type: String(inc?.summary ?? "—"),
            people: inc?.reports ?? 0,
            priority: Number(p.priority) || 0,
            x: e.point.x,
            y: e.point.y,
          });
          map.getCanvas().style.cursor = "pointer";
        });
        map.on("mouseleave", "incidents-circle", () => {
          setHoverIncident(null);
          map.getCanvas().style.cursor = "";
        });

        const bounds = new maplibregl.LngLatBounds([91.62, 26.06], [91.88, 26.23]);
        map.fitBounds(bounds, { padding: 36, duration: 0 });
        setTimeout(() => map.flyTo({ ...GUWAHATI_CAMERA.guwahati, duration: 900, essential: true }), 100);

        setLoaded(true);

        (async () => {
          try {
            const rRes = await fetch(ROADS_URL);
            if (rRes.ok) {
              const roads = await rRes.json();
              map.addSource("roads", { type: "geojson", data: roads });
              map.addLayer({
                id: "roads-line",
                type: "line",
                source: "roads",
                minzoom: 10.5,
                paint: {
                  "line-color": "#2c4148",
                  "line-width": ["interpolate", ["linear"], ["zoom"], 11, 0.7, 13, 1.1, 15, 1.8],
                  "line-opacity": ["interpolate", ["linear"], ["zoom"], 11, 0.25, 13, 0.55, 15, 0.9],
                },
                layout: { "line-cap": "round", "line-join": "round" } as never,
              });
              map.addLayer({
                id: "roads-highlight",
                type: "line",
                source: "roads",
                minzoom: 12.5,
                paint: {
                  "line-color": "#3d5a64",
                  "line-width": ["interpolate", ["linear"], ["zoom"], 12.5, 0.9, 15, 2.2],
                  "line-opacity": 0.35,
                },
                filter: ["==", ["get", "highway"], "trunk"],
              });
            }
          } catch {  }

          try {
            const pRes = await fetch(POLYGONS_URL);
            if (pRes.ok) {
              const raw = await pRes.json() as { features: { properties: Record<string, unknown> | null; geometry: { type: string } }[] };
              const filtered = (raw.features as unknown[]).filter((f: unknown) => {
                const p = (f as { properties: Record<string, unknown> | null }).properties;
                return p !== null && (p.building !== undefined || (p as Record<string, unknown>)["building:levels"] !== undefined);
              }).slice(0, 9000);
              const buildings: { type: string; features: typeof filtered } = {
                type: "FeatureCollection",
                features: filtered as never[],
              };
              for (const f of buildings.features as { properties: Record<string, unknown>; geometry: { type: string } }[]) {
                const p = f.properties as Record<string, unknown>;
                const lvlRaw = p["building:levels"] as string | undefined;
                const lvl = lvlRaw ? parseInt(String(lvlRaw).replace(/[^0-9]/g, ""), 10) || 1 : 1;
                p._height = Math.max(8, Math.min(42, lvl * 3.2 + (f.geometry.type === "MultiPolygon" ? 2 : 0) + Math.random() * 2));
                p._color = lvl > 4 ? "#1d3440" : lvl > 2 ? "#1a2a34" : "#162028";
              }
              map.addSource("buildings", { type: "geojson", data: buildings as unknown as never });

              map.addLayer({
                id: "buildings-3d",
                type: "fill-extrusion",
                source: "buildings",
                minzoom: 12.8,
                paint: {
                  "fill-extrusion-color": ["get", "_color"],
                  "fill-extrusion-height": ["get", "_height"],
                  "fill-extrusion-base": 0,
                  "fill-extrusion-opacity": ["interpolate", ["linear"], ["zoom"], 12.8, 0.0, 13.5, 0.82, 16, 0.96],
                },
              } as never);
              map.addLayer({
                id: "buildings-footprint",
                type: "line",
                source: "buildings",
                minzoom: 11,
                maxzoom: 13.2,
                paint: {
                  "line-color": "rgba(72,216,255,0.18)",
                  "line-width": 0.6,
                  "line-opacity": 0.35,
                },
              });
            }
          } catch {  }
        })();

        try {
          ensureRouteLayers(map);
          if (map.getLayer("prism-png-shadow")) {
            map.moveLayer("prism-png-shadow", "prism-route-remaining");
            map.moveLayer("prism-png-dot", "prism-png-shadow");
            map.moveLayer("prism-png-layer", "prism-png-dot");
          }
          if (map.getLayer("prism-route-remaining")) {
            map.moveLayer("prism-route-shadow", "incidents-circle");
            map.moveLayer("prism-route-remaining", "prism-route-shadow");
          }
        } catch {  }
      } catch (err) {
        setError((err as Error).message);
      }
    });

    map.on("error", (e: unknown) => {
      console.error("MapLibre error", e);
    });

    return () => {
      try { if (signalLossInterval) clearInterval(signalLossInterval); } catch {  }
      map.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded() || !loaded) return;
    try {
      map.setPaintProperty("wards-fill", "fill-color", FILL.base);
      map.setPaintProperty("wards-fill-hover", "fill-color", FILL.hover);
      map.setPaintProperty("wards-fill-selected", "fill-color", FILL.selected);
      map.setPaintProperty("wards-line", "line-color", FILL.stroke);
      map.setPaintProperty("wards-line-selected", "line-color", FILL.selectedStroke);
      if (map.getLayer("wards-priority")) map.setPaintProperty("wards-priority", "fill-color", "#F5B942");
    } catch {  }
  }, [loaded, FILL]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded() || !loaded) return;
    if (!map.getLayer("wards-priority")) return;
    if (incidents.length === 0 || planPhase === "idle" || planPhase === "connecting") {
      map.setFilter("wards-priority", ["in", ["get", "ward_lgd_code"], ["literal", []]]);
      map.setPaintProperty("wards-priority", "fill-opacity", 0);
      return;
    }
    const codes = incidents.map(i => i.wardCode);
    map.setFilter("wards-priority", ["in", ["get", "ward_lgd_code"], ["literal", codes]]);
    const op = planPhase === "ready" ? 0.38 : planPhase === "optimizing" ? 0.28 : planPhase === "verifying" ? 0.20 : 0.12;
    map.setPaintProperty("wards-priority", "fill-opacity", op);
  }, [incidents, planPhase, loaded]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded() || !loaded) return;
    if (selectedWardCode) {
      map.setFilter("wards-fill-selected", ["==", ["get", "ward_lgd_code"], selectedWardCode]);
      map.setFilter("wards-line-selected", ["==", ["get", "ward_lgd_code"], selectedWardCode]);
    } else {
      map.setFilter("wards-fill-selected", ["==", ["get", "ward_lgd_code"], -1]);
      map.setFilter("wards-line-selected", ["==", ["get", "ward_lgd_code"], -1]);
    }
  }, [selectedWardCode, loaded]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded() || !loaded) return;
    const src = map.getSource("incidents") as maplibregl.GeoJSONSource | undefined;
    if (!src) return;
    const fc = {
      type: "FeatureCollection",
      features: incidents.map(i => ({
        type: "Feature",
        geometry: { type: "Point", coordinates: [i.lon, i.lat] },
        properties: { id: i.id, severity: i.severity, priority: i.priority, title: i.title },
      })),
    } as unknown as never;
    src.setData(fc as never);
  }, [incidents, loaded]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded() || !loaded) return;
    const src = map.getSource("moving-assets") as maplibregl.GeoJSONSource | undefined;
    if (!src) return;
    const fc = {
      type: "FeatureCollection",
      features: movingAssets.map(m => ({
        type: "Feature",
        geometry: { type: "Point", coordinates: [m.lon, m.lat] },
        properties: { id: m.id, kind: m.kind, label: m.label, eta: m.etaMin },
      })),
    } as unknown as never;
    src.setData(fc as never);
    const trailSrc = map.getSource("moving-trails") as maplibregl.GeoJSONSource | undefined;
    if (trailSrc) {
      const trails = {
        type: "FeatureCollection",
        features: movingAssets.filter(m => m.trail.length > 1).map(m => ({
          type: "Feature",
          geometry: { type: "LineString", coordinates: m.trail },
          properties: { id: m.id, kind: m.kind },
        })),
      } as unknown as never;
      trailSrc.setData(trails as never);
    }
    const remSrc = map.getSource("moving-remaining") as maplibregl.GeoJSONSource | undefined;
    if (remSrc) {
      const makeRemaining = (m: (typeof movingAssets)[number]) => {
        const route: Record<string, { s: [number, number]; e: [number, number] }> = {
          "AMB-01": { s: [91.71, 26.135], e: [91.6367, 26.1395] },
          "AMB-02": { s: [91.74, 26.128], e: [91.720, 26.108] },
          "HELI-01": { s: [91.68, 26.145], e: [91.685, 26.168] },
        };
        const r = route[m.id] ?? { s: [91.71, 26.135] as [number, number], e: [91.6367, 26.1395] as [number, number] };
        const pts: [number, number][] = [];
        const steps = 18;
        for (let i = 0; i <= steps; i++) {
          const t = m.progress + ((1 - m.progress) * i) / steps;
          if (t > 1) break;
          const lon = r.s[0] + (r.e[0] - r.s[0]) * t;
          const lat = r.s[1] + (r.e[1] - r.s[1]) * t + Math.sin(t * Math.PI) * 0.0055;
          pts.push([lon, lat]);
        }
        return pts;
      };
      const remaining = {
        type: "FeatureCollection",
        features: movingAssets.map(m => ({
          type: "Feature",
          geometry: { type: "LineString", coordinates: makeRemaining(m) },
          properties: { id: m.id, kind: m.kind },
        })),
      } as unknown as never;
      remSrc.setData(remaining as never);
    }
    movingRef.current = movingAssets;
  }, [movingAssets, loaded]);

  const getPngIcon = (kind: string): string => {
    if (kind === "boat") return "boat-icon";
    if (kind === "helicopter") return "helicopter-icon";
    if (kind === "rescue_vehicle") return "rescue-icon";
    return "ambulance-icon";
  };

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !loaded || !pngReadyRef.current) return;
    const src = map.getSource("prism-png-resources") as maplibregl.GeoJSONSource | undefined;
    if (!src) return;
    const moving = prismResources.filter(r => r.status === "en_route" || r.status === "active" || r.status === "arrived" || r.status === "available");
    const fc = {
      type: "FeatureCollection",
      features: moving.map(r => {
        const icon = getPngIcon(r.kind);
        return {
          type: "Feature",
          geometry: { type: "Point", coordinates: [r.lng, r.lat] },
          properties: { id: r.id, kind: r.kind, heading: r.heading, headingAdj: r.heading, icon, status: r.status },
        };
      }),
    } as unknown as never;
    src.setData(fc as never);
    try { updateRoutes(map, prismResources.filter(r => r.status === "en_route" || r.status === "active" || r.status === "arrived"), resourceTrails); } catch {  }
    try {
      const trailSrc = map.getSource("moving-trails") as maplibregl.GeoJSONSource | undefined;
      if (trailSrc) {
        const trails = {
          type: "FeatureCollection",
          features: Array.from(resourceTrails.entries())
            .filter(([_, t]) => (t?.length ?? 0) > 1)
            .map(([id, t]) => ({
              type: "Feature",
              properties: { id },
              geometry: { type: "LineString", coordinates: t },
            })),
        };
        trailSrc.setData(trails as never);
      }
    } catch {  }
  }, [prismResources, resourceTrails, loaded]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !loaded || !pngReadyRef.current) return;
    if (selectedResource) {
      const curZ = map.getZoom();
      if (curZ < 12.5) map.flyTo({ center: [selectedResource.lng, selectedResource.lat], zoom: 13.2, pitch: 52, bearing: -10, duration: 700, essential: true });
    }
  }, [selectedResourceId, selectedResource, loaded]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !loaded || !pngReadyRef.current) return;
    const onClick = (e: maplibregl.MapLayerMouseEvent) => {
      const f = e.features?.[0];
      const id = (f?.properties as { id?: string } | undefined)?.id;
      if (id) {
        selectResource(id);
        if (e.originalEvent) (e.originalEvent as MouseEvent).stopPropagation?.();
      }
    };
    const onHover = (e: maplibregl.MapLayerMouseEvent) => {
      const f = e.features?.[0];
      const id = (f?.properties as { id?: string } | undefined)?.id;
      if (!id) return;
      const r = prismResRef.current.find(x => x.id === id);
      if (!r) return;
      map.getCanvas().style.cursor = "pointer";
      setHoverAsset({
        id: r.id,
        label: r.id,
        kind: r.kind,
        eta: r.etaMin ?? 0,
        x: e.point.x,
        y: e.point.y,
        lon: r.lng,
        lat: r.lat,
        progress: 0,
        destination: r.destination,
        destLat: r.destLat,
        destLon: r.destLon,
        status: r.status,
      });
    };
    const onLeave = () => {
      map.getCanvas().style.cursor = "";
      setHoverAsset(null);
    };
    map.on("click", "prism-png-layer", onClick as never);
    map.on("mousemove", "prism-png-layer", onHover as never);
    map.on("mouseleave", "prism-png-layer", onLeave as never);
    map.on("click", "prism-png-selected", onClick as never);
    map.on("mousemove", "prism-png-selected", onHover as never);
    map.on("mouseleave", "prism-png-selected", onLeave as never);
    return () => {
      try { map.off("click", "prism-png-layer", onClick as never); } catch {  }
      try { map.off("mousemove", "prism-png-layer", onHover as never); } catch {  }
      try { map.off("mouseleave", "prism-png-layer", onLeave as never); } catch {  }
    };
  }, [loaded, selectResource]);

  const replay = () => {
    const map = mapRef.current;
    if (!map) return;
    setPhase("global");
    map.flyTo({ ...GUWAHATI_CAMERA.global, duration: 600, essential: true });
    setTimeout(() => { setPhase("india"); map.flyTo({ ...GUWAHATI_CAMERA.india, duration: 1900, essential: true, curve: 1.42 } as never); }, 650);
    setTimeout(() => { setPhase("assam"); map.flyTo({ ...GUWAHATI_CAMERA.assam, duration: 1900, essential: true, curve: 1.35 } as never); }, 2650);
    setTimeout(() => { setPhase("guwahati"); map.flyTo({ ...GUWAHATI_CAMERA.guwahati, duration: 2200, essential: true, curve: 1.25 } as never); }, 4650);
  };

  return (
    <div className="map-container">
      <div ref={containerRef} style={{ width: "100%", height: "100%" }} />
      {isEmergency && <div className="emergency-tint" style={{ zIndex: 2 }} />}
      {isEmergency && <div className="emergency-pulse" style={{ zIndex: 2 }} />}
      <EmergencyBanner />
      {isDispatched && (
        <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", zIndex: 3, pointerEvents: "none", display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
          <div style={{ background: "rgba(204,255,0,0.96)", border: "2px solid #fff", borderRadius: 999, padding: "6px 14px", display: "inline-flex", alignItems: "center", gap: 8, boxShadow: "0 8px 32px rgba(204,255,0,0.55)" }}>
            <span className="mono" style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.14em", color: "#050607" }}>DISPATCHED — AMBULANCE & HELI EN ROUTE</span>
          </div>
          <div className="mono" style={{ fontSize: 9, color: "#fff", background: "rgba(5,6,7,0.85)", border: "1px solid rgba(204,255,0,0.35)", padding: "3px 8px", borderRadius: 999 }}>FROM ADMIN HQ • FOLLOW RED/BLUE TRAILS ON MAP • 3D BUILDINGS ON ZOOM</div>
        </div>
      )}
      <div className="map-fade-edges" style={{ zIndex: 1 }} />
      {}
      <div className="hud-grid" style={{ zIndex: 1 }} />
      <div className="hud-scanline" style={{ zIndex: 1 }} />
      <div className="hud-vignette" style={{ zIndex: 1 }} />
      <div className="hud-crosshair" style={{ zIndex: 1 }} />
      {}
      <div style={{ position: "absolute", inset: 8, border: "1px solid rgba(204,255,0,0.08)", pointerEvents: "none", borderRadius: 2, zIndex: 1 }} />
      <div style={{ position: "absolute", top: 0, left: "50%", transform: "translateX(-50%)", width: 180, height: 2, background: "linear-gradient(90deg, transparent, rgba(204,255,0,0.55), transparent)", pointerEvents: "none", zIndex: 1 }} />

      {}
      <div style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 4 }}>
        {}
        <div style={{
          position: "absolute", top: 10, left: 10,
          background: "rgba(5,6,7,0.92)", border: "1px solid var(--border)",
          borderRadius: 4, padding: "8px 10px", pointerEvents: "auto",
          minWidth: 228, boxShadow: "0 8px 32px rgba(0,0,0,0.55)",
        }}>
          <div className="mono" style={{ fontSize: 9, letterSpacing: "0.12em", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ width: 6, height: 6, borderRadius: 999, background: phase === "guwahati" ? "var(--lime)" : "var(--amber)", boxShadow: phase === "guwahati" ? "0 0 8px var(--lime)" : "0 0 8px var(--amber)" }} />
            CAMERA — {phase.toUpperCase()}
          </div>
          <div className="mono" style={{ fontSize: 10, color: "var(--text-dim)", marginTop: 4, lineHeight: 1.4 }}>
            {phase === "global" && "GLOBAL → Initializing Earth view"}
            {phase === "india" && "INDIA → Descending to subcontinent"}
            {phase === "assam" && "ASSAM → Focusing on Brahmaputra valley"}
            {phase === "guwahati" && "GUWAHATI → Operational ward view (60 wards)"}
          </div>
          <div className="mono" style={{ fontSize: 9, color: "var(--text-faint)", marginTop: 6, display: "flex", gap: 6, flexWrap: "wrap" }}>
            <span>GLOBAL</span><span style={{ opacity: 0.3 }}>›</span><span style={{ color: phase === "india" || phase === "assam" || phase === "guwahati" ? "var(--lime)" : undefined }}>INDIA</span><span style={{ opacity: 0.3 }}>›</span><span style={{ color: phase === "assam" || phase === "guwahati" ? "var(--lime)" : undefined }}>ASSAM</span><span style={{ opacity: 0.3 }}>›</span><span style={{ color: phase === "guwahati" ? "var(--lime)" : undefined }}>GUWAHATI</span>
          </div>
          {phase === "guwahati" && loaded && (
            <button onClick={replay} className="mono" style={{ marginTop: 8, fontSize: 9, letterSpacing: "0.08em", background: "transparent", border: "1px solid var(--border)", color: "var(--text-muted)", padding: "4px 8px", borderRadius: 3, cursor: "pointer", pointerEvents: "auto" }}>
              REPLAY FLIGHT
            </button>
          )}
        </div>

        {}
        <div style={{
          position: "absolute", bottom: 10, left: "50%", transform: "translateX(-50%)",
          background: "rgba(5,6,7,0.88)", border: "1px solid var(--border)", borderRadius: 4,
          padding: "6px 10px", display: "flex", alignItems: "center", gap: 10,
        }}>
          <span className="mono" style={{ fontSize: 9, letterSpacing: "0.1em", color: "var(--text-muted)" }}>
            26.1445°N 91.7362°E • WARDS 60 • PMTILES READY • GEOJSON LIVE
          </span>
          <span className="mono" style={{ fontSize: 9, color: loaded ? "var(--green)" : "var(--amber)", borderLeft: "1px solid var(--border)", paddingLeft: 10 }}>
            {loaded ? "● WARDS LOADED" : error ? `● ERROR ${error}` : "○ LOADING WARDS…"}
          </span>
        </div>

        {}
        {hoverWard && (
          <div style={{
            position: "absolute", top: 10, right: 10,
            background: "rgba(5,6,7,0.96)", border: "1px solid var(--lime-border)", borderRadius: 4,
            padding: "7px 9px", minWidth: 168,
            boxShadow: "0 6px 22px rgba(0,0,0,0.55)", zIndex: 5,
          }}>
            <span className="mono" style={{ fontSize: 10, fontWeight: 800, color: selectedWardCode?.toString() === hoverWard.code ? "var(--lime)" : "var(--text)" }}>
              LGD {hoverWard.code} • {hoverWard.name} {selectedWardCode?.toString() === hoverWard.code ? " ● ACTIVE" : ""}
            </span>
            <div className="mono" style={{ fontSize: 9, color: "var(--text-muted)", marginTop: 2, display: "flex", gap: 6 }}>
              <span>{hoverWard.area}</span><span style={{ opacity: 0.3 }}>•</span><span>{selectedWardCode?.toString() === hoverWard.code ? "selected" : "click to inspect"}</span>
            </div>
          </div>
        )}

        {}
        {hoverWard && cursor && (
          <div style={{
            position: "absolute",
            left: Math.min(cursor.x + 14, 520),
            top: Math.min(cursor.y + 14, 420),
            background: "rgba(5,6,7,0.97)", border: selectedWardCode?.toString() === hoverWard.code ? "1px solid var(--lime)" : "1px solid var(--border)",
            borderRadius: 4, padding: "6px 8px", pointerEvents: "none", zIndex: 6,
            boxShadow: "0 8px 24px rgba(0,0,0,0.6)",
            transform: "translate(0,0)",
          }}>
            <div className="mono" style={{ fontSize: 9, fontWeight: 800, color: selectedWardCode?.toString() === hoverWard.code ? "var(--lime)" : "var(--cyan)", letterSpacing: "0.06em" }}>
              {hoverWard.name.toUpperCase()} {selectedWardCode?.toString() === hoverWard.code ? "— ACTIVE" : ""}
            </div>
            <div className="mono" style={{ fontSize: 9, color: "var(--text-dim)", marginTop: 2 }}>Ward No. {hoverWard.code.replace(/^69/, "")} • {hoverWard.area} • {selectedWardCode?.toString() === hoverWard.code ? "selected ward" : "hover"}</div>
          </div>
        )}
        {hoverSignalLoss && (
          <div style={{
            position: "absolute",
            left: Math.min(hoverSignalLoss.x + 14, 520),
            top: Math.min(hoverSignalLoss.y + 14, 420),
            background: "rgba(8,12,14,0.98)",
            border: "1px solid rgba(245,185,66,0.42)",
            borderLeft: "2px solid #F5B942",
            borderRadius: 4, padding: "8px 9px", pointerEvents: "none", zIndex: 6, minWidth: 220,
            boxShadow: "0 10px 28px rgba(0,0,0,0.55)",
          }}>
            <div className="mono" style={{ fontSize: 9, fontWeight: 800, letterSpacing: "0.08em", color: "#F5B942" }}>⚠ NO SIGNAL — {hoverSignalLoss.name.toUpperCase()}</div>
            <div className="mono" style={{ fontSize: 9, color: "var(--text-dim)", marginTop: 4, lineHeight: 1.4 }}>
              Ward {hoverSignalLoss.ward} silent for &gt; 30 min<br />
              Last report: unknown • Activity graph: flatline
            </div>
            <div className="mono" style={{ fontSize: 8, color: "var(--text-faint)", marginTop: 5 }}>click to pin activity graph to this ward</div>
          </div>
        )}
        {hoverAsset && (
          <div style={{
            position: "absolute",
            left: Math.min(hoverAsset.x + 14, 520),
            top: Math.min(hoverAsset.y + 14, 420),
            background: "rgba(8,12,14,0.98)",
            border: "1px solid rgba(204,255,0,0.22)",
            borderLeft: `2px solid ${hoverAsset.status === "en_route" ? "#CCFF00" : hoverAsset.status === "active" ? "#F5B942" : hoverAsset.status === "arrived" ? "#46E09B" : "#4A5254"}`,
            borderRadius: 4, padding: "8px 9px", pointerEvents: "none", zIndex: 6, minWidth: 228,
            boxShadow: "0 10px 28px rgba(0,0,0,0.55), 0 0 0 1px rgba(204,255,0,0.06)",
          }}>
            <div className="mono" style={{ fontSize: 9, fontWeight: 800, letterSpacing: "0.06em", display: "flex", alignItems: "center", gap: 6 }}>
              <span>{hoverAsset.kind === "ambulance" ? "🚑" : hoverAsset.kind === "helicopter" ? "🚁" : hoverAsset.kind === "boat" ? "🛥️" : "🚒"}</span>
              <span style={{ color: "var(--text)" }}>{hoverAsset.label}</span>
              <span style={{ fontSize: 7, padding: "2px 5px", borderRadius: 999, background: hoverAsset.status === "en_route" ? "rgba(204,255,0,0.14)" : hoverAsset.status === "active" ? "rgba(245,185,66,0.14)" : "rgba(74,82,84,0.18)", color: hoverAsset.status === "en_route" ? "var(--lime)" : hoverAsset.status === "active" ? "var(--amber)" : "var(--text-muted)", border: `1px solid ${hoverAsset.status === "en_route" ? "rgba(204,255,0,0.28)" : "var(--border)"}` }}>{(hoverAsset.status ?? "unknown").toUpperCase()}</span>
              <span style={{ marginLeft: "auto", color: hoverAsset.eta ? "var(--lime)" : "var(--text-faint)", fontSize: 8 }}>ETA {hoverAsset.eta ? `${hoverAsset.eta} min` : "—"}</span>
            </div>
            <div className="mono" style={{ fontSize: 8, color: "var(--text-muted)", marginTop: 5, display: "grid", gap: 3 }}>
              <div style={{ display: "flex", gap: 6 }}>
                <span style={{ color: "var(--text-faint)", minWidth: 28 }}>FROM</span>
                <span style={{ color: "var(--text-dim)" }}>{hoverAsset.lat.toFixed(4)}°N {hoverAsset.lon.toFixed(4)}°E</span>
                <span style={{ color: "var(--text-faint)" }}>• now</span>
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                <span style={{ color: "var(--text-faint)", minWidth: 28 }}>TO</span>
                <span style={{ color: "var(--lime)" }}>{hoverAsset.destination ?? "— hold —"}</span>
                {hoverAsset.destLat != null && hoverAsset.destLon != null && (
                  <span style={{ color: "var(--text-muted)" }}>{hoverAsset.destLat.toFixed(4)}°N {hoverAsset.destLon.toFixed(4)}°E</span>
                )}
              </div>
            </div>
            <div className="mono" style={{ fontSize: 7, color: "var(--text-faint)", marginTop: 6, borderTop: "1px dashed var(--border)", paddingTop: 5, display: "flex", justifyContent: "space-between" }}>
              <span>{hoverAsset.kind.toUpperCase()} • click to focus • follows predicted dashed path</span>
            </div>
          </div>
        )}
        {hoverIncident && (
          <div style={{
            position: "absolute",
            left: Math.min(hoverIncident.x + 14, 520),
            top: Math.min(hoverIncident.y + 14, 420),
            background: "rgba(8,12,14,0.98)",
            border: `1px solid ${hoverIncident.severity === "critical" ? "rgba(255,77,77,0.4)" : hoverIncident.severity === "high" ? "rgba(245,185,66,0.4)" : "rgba(72,216,255,0.4)"}`,
            borderLeft: `2px solid ${hoverIncident.severity === "critical" ? "#FF4D4D" : hoverIncident.severity === "high" ? "#F5B942" : "#48D8FF"}`,
            borderRadius: 4, padding: "8px 9px", pointerEvents: "none", zIndex: 6, minWidth: 220,
            boxShadow: "0 10px 28px rgba(0,0,0,0.55)",
          }}>
            <div className="mono" style={{ fontSize: 9, fontWeight: 800, letterSpacing: "0.08em", color: "var(--text)" }}>{hoverIncident.title}</div>
            <div className="mono" style={{ fontSize: 8, color: hoverIncident.severity === "critical" ? "#FF4D4D" : hoverIncident.severity === "high" ? "#F5B942" : "#48D8FF", fontWeight: 800, letterSpacing: "0.1em", marginTop: 4 }}>SEVERITY {hoverIncident.severity.toUpperCase()}</div>
            <div className="mono" style={{ fontSize: 9, color: "var(--text-muted)", marginTop: 4, lineHeight: 1.4 }}>
              Type: {hoverIncident.event_type} • Reports: {hoverIncident.people} • Priority: {hoverIncident.priority}
            </div>
          </div>
        )}
      </div>

      {}
    </div>
  );
}

function delay(ms: number) { return new Promise(res => setTimeout(res, ms)); }
