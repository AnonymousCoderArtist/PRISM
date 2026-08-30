import { useEffect, useRef, useState } from "react";
import * as maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { DARK_STYLE, GUWAHATI_CAMERA, WARD_FILL } from "../lib/mapStyle";
import { usePrism } from "../store/PrismContext";

const WARDS_URL = "/data/guwahati/geojson/wards_guwahati.geojson";

export function MapView() {
  const mapRef = useRef<maplibregl.Map | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [phase, setPhase] = useState<"global" | "india" | "assam" | "guwahati">("global");
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hoverWard, setHoverWard] = useState<{ code: string; name: string; area: string } | null>(null);
  const [cursor, setCursor] = useState<{ x: number; y: number } | null>(null);
  const { selectedWardCode, selectWard, selectIncident, incidents, movingAssets } = usePrism();

  // keep last selected for fly-to incident
  const incidentsRef = useRef(incidents);
  incidentsRef.current = incidents;
  const movingRef = useRef(movingAssets);
  movingRef.current = movingAssets;

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: DARK_STYLE,
      center: GUWAHATI_CAMERA.global.center,
      zoom: GUWAHATI_CAMERA.global.zoom,
      pitch: 0,
      bearing: 0,
      attributionControl: false,
      maxPitch: 65,
      // globe projection — cast to any because types lag behind runtime
      ...( { projection: { type: "globe" } } as unknown as Record<string, unknown>),
    } as maplibregl.MapOptions);

    mapRef.current = map;

    map.addControl(new maplibregl.AttributionControl({ compact: true }), "bottom-right");
    map.addControl(new maplibregl.NavigationControl({ showCompass: true }), "bottom-right");
    map.addControl(new maplibregl.ScaleControl({ unit: "metric" }), "bottom-left");

    map.on("load", async () => {
      try {
        // Slow globe cinematic: true Earth → Guwahati (total ~6.2s, eased)
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

        // Load wards geojson
        const res = await fetch(WARDS_URL);
        if (!res.ok) throw new Error(`Failed to fetch wards: ${res.status}`);
        const geo = await res.json();

        // Add source
        map.addSource("wards", { type: "geojson", data: geo });

        // Fill
        map.addLayer({
          id: "wards-fill",
          type: "fill",
          source: "wards",
          paint: {
            "fill-color": WARD_FILL.base,
            "fill-opacity": 0.85,
          },
        });

        // Highlight fill (hover/selected via filter)
        map.addLayer({
          id: "wards-fill-hover",
          type: "fill",
          source: "wards",
          paint: {
            "fill-color": WARD_FILL.hover,
            "fill-opacity": 0.95,
          },
          filter: ["==", ["get", "ward_lgd_code"], -1],
        });

        map.addLayer({
          id: "wards-fill-selected",
          type: "fill",
          source: "wards",
          paint: {
            "fill-color": WARD_FILL.selected,
            "fill-opacity": 0.95,
          },
          filter: ["==", ["get", "ward_lgd_code"], -1],
        });

        // Outline
        map.addLayer({
          id: "wards-line",
          type: "line",
          source: "wards",
          paint: {
            "line-color": WARD_FILL.stroke,
            "line-width": 0.9,
            "line-opacity": 0.9,
          },
        });

        map.addLayer({
          id: "wards-line-selected",
          type: "line",
          source: "wards",
          paint: {
            "line-color": WARD_FILL.selectedStroke,
            "line-width": 1.8,
            "line-opacity": 1,
          },
          filter: ["==", ["get", "ward_lgd_code"], -1],
        });

        // Add incident markers as GeoJSON source + circle layer — initially empty (verification-gated)
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

        // PMTiles-ready + Roads (local) — remaining tile rendering (next milestone): keep ready, optional
        // We keep roads as optional overlay; if large file, we load lazily later. For now wards are primary.
        // Admin centre headquarters
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
        // label
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

        // Moving assets (ambulance/helicopter) — after plan ready
        const movingGeo = {
          type: "FeatureCollection",
          features: movingRef.current.map(m => ({
            type: "Feature",
            geometry: { type: "Point", coordinates: [m.lon, m.lat] },
            properties: { id: m.id, kind: m.kind, label: m.label },
          })),
        } as unknown as never;
        map.addSource("moving-assets", { type: "geojson", data: movingGeo });
        map.addLayer({
          id: "moving-glow",
          type: "circle",
          source: "moving-assets",
          paint: {
            "circle-radius": 16,
            "circle-color": ["match", ["get", "kind"], "ambulance", "#FF4D4D", "helicopter", "#48D8FF", "#8A9698"],
            "circle-opacity": 0.18,
            "circle-blur": 0.6,
          },
        });
        map.addLayer({
          id: "moving-circle",
          type: "circle",
          source: "moving-assets",
          paint: {
            "circle-radius": 6,
            "circle-color": ["match", ["get", "kind"], "ambulance", "#FF4D4D", "helicopter", "#48D8FF", "#8A9698"],
            "circle-stroke-color": "#E8ECEB",
            "circle-stroke-width": 1.4,
          },
        });
        map.addLayer({
          id: "moving-label",
          type: "symbol",
          source: "moving-assets",
          layout: {
            "text-field": ["get", "label"],
            "text-size": 8.5,
            "text-font": ["Open Sans Bold"],
            "text-offset": [0, -1.2],
          },
          paint: {
            "text-color": "#E8ECEB",
            "text-halo-color": "#050607",
            "text-halo-width": 1,
          },
        });

        // Click handlers for wards
        map.on("mousemove", "wards-fill", (e: maplibregl.MapLayerMouseEvent) => {
          if (!e.features?.[0]) return;
          const props = e.features[0].properties as Record<string, unknown>;
          const code = String(props.ward_lgd_code);
          const name = String(props.ward_lgd_name ?? `Ward ${code}`);
          const rawArea = (props as Record<string, unknown>)["st_area(shape)"] as number | undefined;
          const areaKm = rawArea ? (rawArea / 1_000_000).toFixed(2) + " km²" : "";
          const wardNameShort = name.replace("Guwahati (M Corp.) - ", "");
          // cursor position for tooltip (client pixel relative to container)
          const rect = (map.getContainer() as HTMLElement).getBoundingClientRect();
          setCursor({ x: e.point.x, y: e.point.y });
          // also keep legacy rect for future use if needed
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
          // fit to ward bounds roughly by easing to feature center
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

        // Fit bounds to Guwahati after load for precise framing
        const bounds = new maplibregl.LngLatBounds([91.62, 26.06], [91.88, 26.23]);
        map.fitBounds(bounds, { padding: 36, duration: 0 });
        // then re-apply guwahati camera for cinematic pitch
        setTimeout(() => map.flyTo({ ...GUWAHATI_CAMERA.guwahati, duration: 900, essential: true }), 100);

        setLoaded(true);
      } catch (err) {
        setError((err as Error).message);
      }
    });

    map.on("error", (e: unknown) => {
      // suppress style errors but surface
      console.error("MapLibre error", e);
    });

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Reflect selectedWardCode to map filters
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

  // Keep incidents in sync — verification-gated red/green dots appear only after backend verification
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

  // Keep moving assets in sync — ambulance/helicopter simulation after plan
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
        properties: { id: m.id, kind: m.kind, label: m.label },
      })),
    } as unknown as never;
    src.setData(fc as never);
  }, [movingAssets, loaded]);

  // Replay flight (same slow globe curve)
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
      <div className="map-fade-edges" style={{ zIndex: 1 }} />
      {/* HUD decorations — below text */}
      <div className="hud-grid" style={{ zIndex: 1 }} />
      <div className="hud-scanline" style={{ zIndex: 1 }} />
      <div className="hud-vignette" style={{ zIndex: 1 }} />
      <div className="hud-crosshair" style={{ zIndex: 1 }} />
      {/* outer frame */}
      <div style={{ position: "absolute", inset: 8, border: "1px solid rgba(204,255,0,0.08)", pointerEvents: "none", borderRadius: 2, zIndex: 1 }} />
      <div style={{ position: "absolute", top: 0, left: "50%", transform: "translateX(-50%)", width: 180, height: 2, background: "linear-gradient(90deg, transparent, rgba(204,255,0,0.55), transparent)", pointerEvents: "none", zIndex: 1 }} />

      {/* HUD Overlay — must be ABOVE fade/grid, grid-aligned corners */}
      <div style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 4 }}>
        {/* Top-left HUD */}
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

        {/* Bottom-center coords */}
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

        {/* Right HUD — ward hover with area (corner) */}
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

        {/* Cursor-anchored tooltip */}
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
      </div>

      {/* Attribution is handled by control, but ensure OSM credit remains visible via default control */}
    </div>
  );
}

function delay(ms: number) { return new Promise(res => setTimeout(res, ms)); }
