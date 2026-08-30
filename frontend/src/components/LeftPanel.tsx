import { motion } from "framer-motion";
import { EyeOff, Truck, Route, Play, Pause, Zap, ShieldCheck } from "lucide-react";
import { useState, useEffect } from "react";
import { usePrism } from "../store/PrismContext";
import { fetchWeather } from "../services/api";
import { Button } from "@/components/ui/neon-button";

export function LeftPanel() {
  const { simulationState, setSimulationState, plan, planPhase } = usePrism();
  const [weather, setWeather] = useState<{ condition: string; rainfall: number; probability: number; risk: number; disasters: string[] } | null>(null);
  const [weatherLoading, setWeatherLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setWeatherLoading(true);
      try {
        const data = await fetchWeather(26.1445, 91.7362);
        if (!cancelled) {
          setWeather({
            condition: data.weather_condition,
            rainfall: data.rainfall_next_6h_mm,
            probability: data.rain_probability,
            risk: data.forecast_risk,
            disasters: data.suspected_disasters,
          });
        }
      } catch {
        if (!cancelled) setWeather(null);
      } finally {
        if (!cancelled) setWeatherLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, []);

  return (
    <aside className="panel prism-left" style={{ borderRight: "1px solid var(--border)", borderLeft: "1px solid var(--border)", display: "flex", flexDirection: "column", overflow: "hidden" }}>
      {/* Response Plan */}
      <div style={{ flex: "1 1 0", minHeight: 0, display: "flex", flexDirection: "column", overflow: "hidden", background: "var(--bg-panel)" }}>
        <div className="panel-header" style={{ background: "var(--bg-panel-2)" }}>
          <span className="panel-title" style={{ color: "var(--lime)" }}><Truck size={12} /> RESPONSE PLAN</span>
          <span className="mono" style={{ fontSize: 8, color: plan.length ? "var(--lime)" : "var(--text-faint)" }}>{plan.length ? `${plan.length} ASSIGNMENTS` : planPhase === "collecting" ? "AWAITING" : planPhase === "optimizing" ? "COMPUTING" : "IDLE"}</span>
        </div>

        <div style={{ padding: 8, display: "flex", flexDirection: "column", gap: 7, overflowY: "auto", flex: 1 }}>
          <div style={{ background: simulationState === "running" ? "rgba(204,255,0,0.12)" : "var(--bg-elevated)", border: simulationState === "running" ? "1px solid var(--lime-border)" : "1px solid var(--border)", borderRadius: 4, padding: 8, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <div className="mono" style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", color: simulationState === "running" ? "var(--lime)" : "var(--text)" }}>{simulationState === "running" ? "SIMULATION LIVE" : "READY TO SIMULATE"}</div>
              <div className="mono" style={{ fontSize: 9, color: "var(--text-muted)", marginTop: 2 }}>Reports stream 0.9s • Plan LAST</div>
            </div>
            <Button
              onClick={() => setSimulationState(simulationState === "running" ? "paused" : "running")}
              neon={simulationState !== "running"}
              variant={simulationState === "running" ? "ghost" : "solid"}
              size="sm"
              className={
                simulationState === "running"
                  ? "!border-[var(--lime-border)] !bg-transparent !text-[var(--lime)] !px-5 !py-2 font-mono text-[10px] tracking-[0.12em] font-extrabold"
                  : "!bg-[var(--lime)] !text-black !border-transparent hover:!bg-[#b8e600] !px-5 !py-2 font-mono text-[10px] tracking-[0.12em] font-extrabold shadow-[0_0_12px_rgba(204,255,0,0.35)]"
              }
            >
              <span className="inline-flex items-center gap-1.5">
                {simulationState === "running" ? <Pause size={12} /> : <Play size={12} />} {simulationState === "running" ? "PAUSE" : "SIMULATE"}
              </span>
            </Button>
          </div>

          {plan.length === 0 ? (
            <div style={{ background: "var(--bg-elevated)", border: "1px dashed var(--border)", borderRadius: 3, padding: "12px 10px", textAlign: "center" }}>
              <div className="mono" style={{ fontSize: 9, letterSpacing: "0.1em", color: planPhase === "collecting" ? "var(--amber)" : planPhase === "optimizing" ? "var(--cyan)" : "var(--text-faint)" }}>
                {planPhase === "collecting" && "COLLECTING REPORTS…"}
                {planPhase === "optimizing" && "OPTIMIZING ROUTES — OR-TOOLS…"}
                {planPhase === "idle" && "IDLE — click SIMULATE"}
              </div>
              <div className="mono" style={{ fontSize: 9, color: "var(--text-muted)", marginTop: 4, lineHeight: 1.4 }}>
                {planPhase === "collecting" && "Emergency burst 0.9s. Plan generates LAST after ~10 reports."}
                {planPhase === "optimizing" && "Fusing confidence + priority → computing VRP…"}
                {planPhase === "idle" && "Sequence: Reports → Sources → Plan (LAST)."}
              </div>
              <div style={{ height: 4, background: "var(--border)", borderRadius: 999, overflow: "hidden", marginTop: 8 }}>
                <motion.div style={{ height: "100%", background: planPhase === "optimizing" ? "var(--cyan)" : "var(--amber)" }} initial={{ width: "12%" }} animate={{ width: planPhase === "optimizing" ? "72%" : planPhase === "collecting" ? "42%" : "12%" }} transition={{ duration: 0.8 }} />
              </div>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
              {plan.map(r => (
                <motion.div key={r.id} layout initial={{ opacity: 0, y: 8, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: 0.45 }} style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)", borderLeft: `2.5px solid ${r.color}`, borderRadius: 3, padding: "7px 8px" }}>
                  <div className="mono" style={{ fontSize: 8, letterSpacing: "0.1em", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: 5 }}><Route size={10} /> {r.id} — {r.status}</div>
                  <div style={{ fontSize: 11, color: "var(--text)", fontWeight: 650, marginTop: 3 }}>{r.to}</div>
                  <div className="mono" style={{ fontSize: 9, color: "var(--text-muted)", marginTop: 1 }}>{r.eta} • {r.resId}</div>
                </motion.div>
              ))}
            </div>
          )}

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
            <div style={{ background: "rgba(204,255,0,0.06)", border: "1px solid var(--lime-border)", borderRadius: 3, padding: "7px 8px" }}>
              <div className="mono" style={{ fontSize: 8, color: "var(--lime)" }}><Zap size={10} /> OPTIMIZED</div>
              <div className="mono" style={{ fontSize: 9, color: "var(--text-dim)", marginTop: 2, lineHeight: 1.35 }}>OR-Tools VRP<br />ETA ↓ 22% • 3 routes</div>
            </div>
            <div style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: 3, padding: "7px 8px" }}>
              <div className="mono" style={{ fontSize: 8, color: "var(--text-muted)" }}><ShieldCheck size={10} /> NEXT</div>
              <div className="mono" style={{ fontSize: 9, color: "var(--text-dim)", marginTop: 2, lineHeight: 1.35 }}>Connect to:<br />/api/resources<br />/ws/live</div>
            </div>
          </div>
        </div>
      </div>

      {/* Information Void */}
      <div style={{ flex: "1 1 0", minHeight: 0, display: "flex", flexDirection: "column", borderTop: "1px solid var(--border)", background: "var(--bg-panel-2)", overflow: "hidden" }}>
        <div className="panel-header" style={{ height: 28, minHeight: 28 }}>
          <span className="panel-title" style={{ fontSize: 8.5 }}><span className="panel-title-dot" style={{ width: 5, height: 5 }} /> INFORMATION VOID</span>
          <span className="mono" style={{ fontSize: 8, color: "var(--text-faint)" }}>SILENT ZONES • LIVE</span>
        </div>
        <div style={{ padding: 6, display: "flex", flexDirection: "column", gap: 5, overflowY: "auto", flex: 1 }}>
          <div style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: 3, padding: "7px 8px", display: "flex", gap: 6 }}>
            <EyeOff size={12} style={{ color: "var(--purple)", flexShrink: 0, marginTop: 1 }} />
            <span className="mono" style={{ fontSize: 9, color: "var(--text-dim)", lineHeight: 1.4 }}><span style={{ color: "var(--purple)", fontWeight: 700 }}>VOID</span> — Wards 33/41/57 silent — flatline detect.</span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 5 }}>
            <div style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: 3, padding: "6px 4px", textAlign: "center" }}>
              <div className="mono" style={{ fontSize: 7, letterSpacing: "0.08em", color: "var(--text-muted)" }}>VOID SCORE</div>
              <div style={{ fontSize: 11, fontWeight: 800, color: "var(--purple)", lineHeight: 1, marginTop: 2 }}>89<span style={{ fontSize: 8, fontWeight: 400 }}> / 100</span></div>
            </div>
            <div style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: 3, padding: "6px 4px", textAlign: "center" }}>
              <div className="mono" style={{ fontSize: 7, letterSpacing: "0.08em", color: "var(--text-muted)" }}>SILENT WARDS</div>
              <div style={{ fontSize: 11, fontWeight: 800, color: "var(--amber)", lineHeight: 1, marginTop: 2 }}>3</div>
            </div>
          </div>
          <div style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: 3, padding: "6px 8px" }}>
            <div className="mono" style={{ fontSize: 8, color: "var(--text-muted)", marginBottom: 3 }}>PRIORITY ACTIONS</div>
            <div style={{ fontSize: 9, color: "var(--text-dim)", lineHeight: 1.5 }}>Deploy field officer to Ward 33 for visual confirmation. Request drone surveillance for Ward 57. Reallocate comms relay to Six Mile corridor.</div>
          </div>
        </div>
      </div>

      {/* Weather Forecast */}
      <div style={{ borderTop: "1px solid var(--border)", background: "var(--bg-panel-2)", display: "flex", flexDirection: "column", flexShrink: 0 }}>
        <div className="panel-header" style={{ height: 28, minHeight: 28 }}>
          <span className="panel-title" style={{ fontSize: 8.5 }}><span className="panel-title-dot" style={{ width: 5, height: 5 }} /> WEATHER FORECAST</span>
          <span className="mono" style={{ fontSize: 8, color: "var(--text-faint)" }}>GUWAHATI • 6H OUTLOOK</span>
        </div>
        <div style={{ padding: 6, display: "flex", flexDirection: "column", gap: 5 }}>
          {weatherLoading && !weather ? (
            <div className="mono" style={{ fontSize: 9, color: "var(--text-muted)", textAlign: "center", padding: 8 }}>Loading forecast...</div>
          ) : weather ? (
            <>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 5 }}>
                <div style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: 3, padding: "6px 4px", textAlign: "center" }}>
                  <div className="mono" style={{ fontSize: 7, letterSpacing: "0.08em", color: "var(--text-muted)" }}>CONDITION</div>
                  <div style={{ fontSize: 10, fontWeight: 800, color: "var(--lime)", lineHeight: 1.2, marginTop: 2, textTransform: "capitalize" }}>{weather.condition}</div>
                </div>
                <div style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: 3, padding: "6px 4px", textAlign: "center" }}>
                  <div className="mono" style={{ fontSize: 7, letterSpacing: "0.08em", color: "var(--text-muted)" }}>RAINFALL 6H</div>
                  <div style={{ fontSize: 11, fontWeight: 800, color: "var(--cyan)", lineHeight: 1, marginTop: 2 }}>{weather.rainfall.toFixed(1)}<span style={{ fontSize: 8, fontWeight: 400 }}> mm</span></div>
                </div>
                <div style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: 3, padding: "6px 4px", textAlign: "center" }}>
                  <div className="mono" style={{ fontSize: 7, letterSpacing: "0.08em", color: "var(--text-muted)" }}>PROBABILITY</div>
                  <div style={{ fontSize: 11, fontWeight: 800, color: weather.probability > 60 ? "var(--amber)" : "var(--lime)", lineHeight: 1, marginTop: 2 }}>{weather.probability}<span style={{ fontSize: 8, fontWeight: 400 }}> %</span></div>
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 5 }}>
                <div style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: 3, padding: "6px 4px", textAlign: "center" }}>
                  <div className="mono" style={{ fontSize: 7, letterSpacing: "0.08em", color: "var(--text-muted)" }}>FORECAST RISK</div>
                  <div style={{ fontSize: 11, fontWeight: 800, color: weather.risk > 50 ? "var(--amber)" : "var(--lime)", lineHeight: 1, marginTop: 2 }}>{weather.risk}<span style={{ fontSize: 8, fontWeight: 400 }}> / 100</span></div>
                </div>
                <div style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: 3, padding: "6px 4px", textAlign: "center" }}>
                  <div className="mono" style={{ fontSize: 7, letterSpacing: "0.08em", color: "var(--text-muted)" }}>SUSPECTED</div>
                  <div style={{ fontSize: 10, fontWeight: 800, color: "var(--amber)", lineHeight: 1.2, marginTop: 2, textTransform: "uppercase" }}>{weather.disasters.length ? weather.disasters.join(", ") : "NONE"}</div>
                </div>
              </div>
            </>
          ) : (
            <div className="mono" style={{ fontSize: 9, color: "var(--text-muted)", textAlign: "center", padding: 8 }}>Forecast unavailable</div>
          )}
        </div>
      </div>
    </aside>
  );
}
