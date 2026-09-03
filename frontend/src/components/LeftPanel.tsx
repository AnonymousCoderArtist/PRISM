import { motion } from "framer-motion";
import { AlertTriangle, Truck, Route, Play, Pause } from "lucide-react";
import { useState, useEffect } from "react";
import { usePrism } from "../store/PrismContext";
import { fetchWeather } from "../services/api";
import { Button } from "@/components/ui/neon-button";
import { DotPattern } from "@/components/ui/dot-pattern-1";

export function LeftPanel() {
  const { simulationState, setSimulationState, plan, planPhase } = usePrism();
  const [weather, setWeather] = useState<{ condition: string; rainfall: number; probability: number; risk: number; disasters: string[] } | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
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
      } catch {  }
    })();
    return () => { cancelled = true; };
  }, []);

  return (
    <aside className="panel prism-left" style={{ display: "flex", flexDirection: "column", overflow: "hidden" }}>
      {}
      <div className="relative" style={{ flex: 1.6, display: "flex", flexDirection: "column", overflow: "hidden", background: "linear-gradient(180deg, rgba(204,255,0,0.04), transparent 22%), var(--bg-panel)" }}>
        <DotPattern width={14} height={14} cr={0.7} className="fill-[rgba(204,255,0,0.07)] opacity-30" />
        <div className="panel-header" style={{ background: "var(--bg-panel-2)" }}>
          <span className="panel-title" style={{ color: "var(--lime)" }}><Truck size={12} /> RESPONSE PLAN <span style={{ color: "var(--text-faint)", fontWeight: 400, letterSpacing: "0.06em", marginLeft: 6 }}>OR-TOOLS • SIM</span></span>
          <span className="mono" style={{ fontSize: 8, color: plan.length ? "var(--lime)" : "var(--text-faint)" }}>{plan.length ? `${plan.length} ASSIGNMENTS` : planPhase === "collecting" ? "AWAITING" : planPhase === "optimizing" ? "COMPUTING" : "IDLE"}</span>
        </div>

        <div style={{ padding: 8, display: "flex", flexDirection: "column", gap: 7, overflowY: "auto", flex: 1 }}>
          <div style={{ background: simulationState === "running" ? "rgba(204,255,0,0.12)" : "var(--bg-elevated)", border: simulationState === "running" ? "1px solid var(--lime-border)" : "1px solid var(--border)", borderRadius: 4, padding: 8, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <div className="mono" style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", color: simulationState === "running" ? "var(--lime)" : "var(--text)" }}>{simulationState === "running" ? "● SIMULATION LIVE" : "READY TO SIMULATE"}</div>
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
                {planPhase === "collecting" && "● COLLECTING REPORTS… (plan pending)"}
                {planPhase === "optimizing" && "◐ OPTIMIZING ROUTES — OR-TOOLS…"}
                {planPhase === "idle" && "○ IDLE — click SIMULATE"}
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
                <motion.div key={r.id} layout initial={{ opacity: 0, y: 8, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: 0.45 }} style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: 3, padding: "7px 8px" }}>
                  <div className="mono" style={{ fontSize: 8, letterSpacing: "0.1em", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: 5 }}><Route size={10} /> {r.id} — {r.status}</div>
                  <div style={{ fontSize: 11, color: "var(--text)", fontWeight: 650, marginTop: 3 }}>{r.to}</div>
                  <div className="mono" style={{ fontSize: 9, color: "var(--text-muted)", marginTop: 1 }}>{r.eta} • {r.resId}</div>
                </motion.div>
              ))}
            </div>
          )}

          {}

          {}
          {weather && (
            <div style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: 3, padding: "7px 8px", display: "flex", flexDirection: "column", gap: 5 }}>
              <div className="mono" style={{ fontSize: 8, letterSpacing: "0.1em", color: "var(--cyan)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span>UPCOMING WEATHER • 6H</span>
                <span style={{ color: "var(--text-faint)" }}>Guwahati</span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 5 }}>
                <div style={{ textAlign: "center" }}>
                  <div className="mono" style={{ fontSize: 7, color: "var(--text-muted)" }}>RAIN</div>
                  <div className="mono" style={{ fontSize: 11, fontWeight: 800, color: "var(--cyan)", lineHeight: 1.1, marginTop: 2 }}>{weather.rainfall.toFixed(1)}<span style={{ fontSize: 8, fontWeight: 400 }}> mm</span></div>
                </div>
                <div style={{ textAlign: "center" }}>
                  <div className="mono" style={{ fontSize: 7, color: "var(--text-muted)" }}>PROB</div>
                  <div className="mono" style={{ fontSize: 11, fontWeight: 800, color: weather.probability > 60 ? "var(--amber)" : "var(--lime)", lineHeight: 1.1, marginTop: 2 }}>{weather.probability}<span style={{ fontSize: 8, fontWeight: 400 }}> %</span></div>
                </div>
                <div style={{ textAlign: "center" }}>
                  <div className="mono" style={{ fontSize: 7, color: "var(--text-muted)" }}>RISK</div>
                  <div className="mono" style={{ fontSize: 11, fontWeight: 800, color: weather.risk > 50 ? "var(--amber)" : "var(--lime)", lineHeight: 1.1, marginTop: 2 }}>{weather.risk}</div>
                </div>
              </div>
              <div className="mono" style={{ fontSize: 8, color: "var(--text-dim)", textTransform: "capitalize", marginTop: 2 }}>{weather.condition} • suspect: <span style={{ color: "var(--amber)" }}>{weather.disasters.join(", ") || "—"}</span></div>
            </div>
          )}

          <div style={{ background: "rgba(168,139,255,0.10)", border: "1px solid rgba(168,139,255,0.32)", borderRadius: 4, padding: "10px 11px", display: "flex", flexDirection: "column", gap: 8 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <AlertTriangle size={14} style={{ color: "var(--purple)", flexShrink: 0 }} />
              <div>
                <div className="mono" style={{ fontSize: 10, fontWeight: 800, color: "var(--purple)", letterSpacing: "0.1em" }}>INFORMATION VOID</div>
                <div className="mono" style={{ fontSize: 9, color: "var(--text-dim)", marginTop: 2, lineHeight: 1.45 }}>Wards 1 / 16 silent — flatline detected</div>
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 5 }}>
              <div style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: 3, padding: "6px 4px", textAlign: "center" }}>
                <div className="mono" style={{ fontSize: 7, letterSpacing: "0.08em", color: "var(--text-muted)" }}>VOID</div>
                <div style={{ fontSize: 13, fontWeight: 800, color: "var(--purple)", lineHeight: 1, marginTop: 2 }}>89</div>
              </div>
              <div style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: 3, padding: "6px 4px", textAlign: "center" }}>
                <div className="mono" style={{ fontSize: 7, letterSpacing: "0.08em", color: "var(--text-muted)" }}>SILENT</div>
                <div style={{ fontSize: 13, fontWeight: 800, color: "var(--amber)", lineHeight: 1, marginTop: 2 }}>2</div>
              </div>
              <div style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: 3, padding: "6px 4px", textAlign: "center" }}>
                <div className="mono" style={{ fontSize: 7, letterSpacing: "0.08em", color: "var(--text-muted)" }}>STATUS</div>
                <div style={{ fontSize: 11, fontWeight: 800, color: "var(--purple)", lineHeight: 1, marginTop: 2 }}>FLAT</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
