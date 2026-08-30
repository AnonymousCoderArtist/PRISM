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
  const [hoverWard, setHoverWard] = useState<string | null>(null);
  const { selectedWardCode, selectWard, selectIncident, incidents } = usePrism();

  // keep last selected for fly-to incident
  const incidentsRef = useRef(incidents);
  incidentsRef.current = incidents;

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
        // cinematic transition GLOBAL → INDIA → ASSAM → GUWAHATI (total ~4s)
        setPhase("global");
        map.flyTo({ ...GUWAHATI_CAMERA.india, duration: 900, essential: true });
        await delay(950);
        setPhase("india");
        map.flyTo({ ...GUWAHATI_CAMERA.assam, duration: 900, essential: true });
        await delay(950);
        setPhase("assam");
        map.flyTo({ ...GUWAHATI_CAMERA.guwahati, duration: 1300, essential: true });
        await delay(1350);
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

        // Add incident markers as GeoJSON source + circle layer
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
        };

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

        // Click handlers for wards
        map.on("mousemove", "wards-fill", (e: maplibregl.MapLayerMouseEvent) => {
          if (!e.features?.[0]) return;
          const props = e.features[0].properties as Record<string, unknown>;
          const code = String(props.ward_lgd_code);
          if (code !== hoverWard) {
            setHoverWard(code);
            map.setFilter("wards-fill-hover", ["==", ["get", "ward_lgd_code"], Number(code)]);
          }
          map.getCanvas().style.cursor = "pointer";
        });

        map.on("mouseleave", "wards-fill", () => {
          setHoverWard(null);
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

  // Replay flight
  const replay = () => {
    const map = mapRef.current;
    if (!map) return;
    setPhase("global");
    map.flyTo({ ...GUWAHATI_CAMERA.global, duration: 500, essential: true });
    setTimeout(() => { setPhase("india"); map.flyTo({ ...GUWAHATI_CAMERA.india, duration: 800, essential: true }); }, 600);
    setTimeout(() => { setPhase("assam"); map.flyTo({ ...GUWAHATI_CAMERA.assam, duration: 800, essential: true }); }, 1500);
    setTimeout(() => { setPhase("guwahati"); map.flyTo({ ...GUWAHATI_CAMERA.guwahati, duration: 1100, essential: true }); }, 2400);
  };

  return (
    <div className="map-container">
      <div ref={containerRef} style={{ width: "100%", height: "100%" }} />
      <div className="map-fade-edges" />
      {/* HUD decorations */}
      <div className="hud-grid" />
      <div className="hud-scanline" />
      <div className="hud-vignette" />
      <div className="hud-crosshair" />
      {/* outer frame corners */}
      <div style={{ position: "absolute", inset: 8, border: "1px solid rgba(204,255,0,0.08)", pointerEvents: "none", borderRadius: 2, zIndex: 2 }} />
      <div style={{ position: "absolute", top: 0, left: "50%", transform: "translateX(-50%)", width: 180, height: 2, background: "linear-gradient(90deg, transparent, rgba(204,255,0,0.55), transparent)", pointerEvents: "none", zIndex: 2 }} />

      {/* HUD Overlay */}
      <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
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

        {/* Right HUD — ward hover */}
        {hoverWard && (
          <div style={{
            position: "absolute", top: 10, right: 10,
            background: "rgba(5,6,7,0.92)", border: "1px solid var(--lime-border)", borderRadius: 4,
            padding: "7px 9px",
          }}>
            <span className="mono" style={{ fontSize: 10, fontWeight: 700, color: "var(--lime)" }}>WARD {hoverWard}</span>
            <span className="mono" style={{ fontSize: 9, color: "var(--text-muted)", marginLeft: 6 }}>click to inspect</span>
          </div>
        )}
      </div>

      {/* Attribution is handled by control, but ensure OSM credit remains visible via default control */}
    </div>
  );
}

function delay(ms: number) { return new Promise(res => setTimeout(res, ms)); }
