import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CloudRain, Wind, Thermometer, AlertTriangle, MapPin, Loader2 } from "lucide-react";
import { usePrism } from "../store/PrismContext";
import { fetchPrediction, type WeatherPrediction } from "../services/api";

const GUWAHATI_CENTER = { lat: 26.1445, lon: 91.7362 };

const DISASTER_LABELS: Record<string, string> = {
  flood: "Flood",
  cyclone: "Cyclone",
  heatwave: "Heatwave",
  cold_wave: "Cold Wave",
  fire: "Fire",
  landslide: "Landslide",
  earthquake: "Earthquake",
  storm: "Storm",
  none: "No Threat",
};

const SEVERITY_COLORS: Record<string, string> = {
  low: "var(--green)",
  moderate: "var(--amber)",
  high: "var(--red)",
  critical: "#ff3838",
};

function severityColor(s: string): string {
  return SEVERITY_COLORS[s] ?? "var(--text-muted)";
}

export function WeatherPanel() {
  const { selectedWardCode, incidents } = usePrism();
  const [prediction, setPrediction] = useState<WeatherPrediction | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const incidentForWard = selectedWardCode
    ? incidents.find(i => i.wardCode === selectedWardCode)
    : null;
  const lat = incidentForWard?.lat ?? GUWAHATI_CENTER.lat;
  const lon = incidentForWard?.lon ?? GUWAHATI_CENTER.lon;
  const locationName = incidentForWard
    ? `${incidentForWard.wardName} (Ward ${selectedWardCode})`
    : "Guwahati, Assam";

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetchPrediction(lat, lon)
      .then(data => {
        if (!cancelled) {
          setPrediction(data);
          setLoading(false);
        }
      })
      .catch(err => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Forecast unavailable");
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [lat, lon]);

  const primary = prediction?.prediction;
  const weather = prediction?.weather;

  return (
    <div style={{ padding: 10, background: "var(--bg-panel)", borderTop: "1px solid var(--border)" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
        <span className="panel-title" style={{ fontSize: 10, color: "var(--cyan)" }}>
          <CloudRain size={11} /> FORECAST RISK
        </span>
        <span className="mono" style={{ fontSize: 8, color: "var(--text-faint)" }}>
          <MapPin size={9} style={{ verticalAlign: "middle" }} /> {locationName}
        </span>
      </div>

      <AnimatePresence mode="wait">
        {loading ? (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 0" }}
          >
            <Loader2 size={11} className="animate-spin" style={{ color: "var(--text-muted)" }} />
            <span className="mono" style={{ fontSize: 9, color: "var(--text-muted)" }}>
              Querying wttr.in + AI analysis...
            </span>
          </motion.div>
        ) : error ? (
          <motion.div
            key="error"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="mono"
            style={{ fontSize: 9, color: "var(--text-muted)", padding: "6px 0" }}
          >
            {error}. Using fallback heuristics.
          </motion.div>
        ) : primary && weather ? (
          <motion.div
            key="data"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35 }}
            style={{ display: "flex", flexDirection: "column", gap: 6 }}
          >
            <div
              style={{
                background: primary.disaster_type === "none" ? "rgba(70,224,155,0.08)" : "rgba(255,77,77,0.08)",
                border: `1px solid ${primary.disaster_type === "none" ? "rgba(70,224,155,0.3)" : "rgba(255,77,77,0.3)"}`,
                borderRadius: 3,
                padding: 8,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                {primary.disaster_type !== "none" && (
                  <AlertTriangle size={12} style={{ color: severityColor(primary.severity) }} />
                )}
                <span
                  className="mono"
                  style={{
                    fontSize: 11,
                    fontWeight: 800,
                    letterSpacing: "0.08em",
                    color: severityColor(primary.severity),
                  }}
                >
                  {DISASTER_LABELS[primary.disaster_type] ?? primary.disaster_type.toUpperCase()} SUSPECTED
                </span>
                <span
                  className="mono"
                  style={{
                    fontSize: 8,
                    marginLeft: "auto",
                    padding: "1px 5px",
                    borderRadius: 2,
                    background: severityColor(primary.severity),
                    color: "#000",
                    fontWeight: 700,
                  }}
                >
                  {primary.severity.toUpperCase()}
                </span>
              </div>
              <div style={{ fontSize: 10, color: "var(--text-dim)", lineHeight: 1.4, marginBottom: 4 }}>
                {primary.reason}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span className="mono" style={{ fontSize: 8, color: "var(--text-faint)" }}>AI CONFIDENCE</span>
                <div style={{ flex: 1, height: 4, background: "#0e191d", borderRadius: 999, overflow: "hidden", border: "1px solid var(--border)" }}>
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${primary.confidence}%` }}
                    transition={{ duration: 0.7, ease: "easeOut" }}
                    style={{ height: "100%", background: severityColor(primary.severity) }}
                  />
                </div>
                <span className="mono" style={{ fontSize: 9, fontWeight: 700, color: severityColor(primary.severity) }}>
                  {primary.confidence}%
                </span>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 4 }}>
              <div className="mono" style={{ fontSize: 9, color: "var(--text-muted)", display: "flex", alignItems: "center", gap: 3 }}>
                <CloudRain size={9} style={{ color: "var(--cyan)" }} />
                <span>{weather.rainfall_next_6h_mm}mm / 6h</span>
              </div>
              <div className="mono" style={{ fontSize: 9, color: "var(--text-muted)", display: "flex", alignItems: "center", gap: 3 }}>
                <Thermometer size={9} style={{ color: "var(--amber)" }} />
                <span>{weather.rain_probability}% rain</span>
              </div>
              <div className="mono" style={{ fontSize: 9, color: "var(--text-muted)", display: "flex", alignItems: "center", gap: 3 }}>
                <Wind size={9} style={{ color: "var(--green)" }} />
                <span>Risk {weather.forecast_risk}</span>
              </div>
            </div>

            {weather.suspected_disasters.length > 1 && (
              <div className="mono" style={{ fontSize: 8, color: "var(--text-faint)", lineHeight: 1.4 }}>
                Also flagged: {weather.suspected_disasters.slice(1).map(d => DISASTER_LABELS[d] ?? d).join(", ")}
              </div>
            )}
          </motion.div>
        ) : null}
      </AnimatePresence>

      <div className="mono" style={{ fontSize: 8, color: "var(--text-faint)", textAlign: "center", marginTop: 6 }}>
        Source: <span style={{ color: "var(--text-muted)" }}>wttr.in</span> + AI • Generic disaster model (flood / cyclone / heatwave / cold / fire / landslide / quake)
      </div>
    </div>
  );
}
