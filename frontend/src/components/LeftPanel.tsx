import { motion } from "framer-motion";
import { MapPinned, AlertTriangle, LocateFixed, EyeOff, Truck, Route, Play, Pause, Zap, ShieldCheck } from "lucide-react";
import { usePrism } from "../store/PrismContext";
import { mockStats } from "../data/mock";
import { Button } from "@/components/ui/neon-button";
import { DotPattern } from "@/components/ui/dot-pattern-1";

export function LeftPanel() {
  const { mapMode, setMapMode, simulationState, setSimulationState, plan, planPhase, incidents, selectWard, selectIncident, selectedIncidentId } = usePrism();

  return (
    <aside className="panel prism-left" style={{ borderRight: "1px solid var(--border)", borderLeft: "1px solid var(--border)", display: "flex", flexDirection: "column", overflow: "hidden" }}>
      {/* === PLAN ON TOP — BIGGEST === */}
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

          <div style={{ background: "rgba(168,139,255,0.08)", border: "1px solid rgba(168,139,255,0.22)", borderRadius: 3, padding: "7px 8px", display: "flex", gap: 6 }}>
            <AlertTriangle size={12} style={{ color: "var(--purple)", flexShrink: 0, marginTop: 1 }} />
            <span className="mono" style={{ fontSize: 9, color: "var(--text-dim)", lineHeight: 1.4 }}><span style={{ color: "var(--purple)", fontWeight: 700 }}>VOID</span> — Wards 33/41/57 silent — flatline detect.</span>
          </div>
        </div>
      </div>

      {/* === SECTOR OVERVIEW SHORT — BELOW PLAN === */}
      <div style={{ borderTop: "1px solid var(--border)", background: "var(--bg-panel-2)", display: "flex", flexDirection: "column", flexShrink: 0 }}>
        <div className="panel-header" style={{ height: 28, minHeight: 28 }}>
          <span className="panel-title" style={{ fontSize: 8.5 }}><span className="panel-title-dot" style={{ width: 5, height: 5 }} /> SECTOR OVERVIEW</span>
          <span className="mono" style={{ fontSize: 8, color: "var(--text-faint)" }}>{mockStats.totalWards} WARDS • {mockStats.activeIncidents} ACTIVE</span>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 5, padding: "6px 6px" }}>
          {[
            { label: "AVG CONF", value: `${mockStats.avgConfidence}%`, color: "var(--lime)" },
            { label: "PRIORITY", value: `${mockStats.activeIncidents}`, color: "var(--amber)" },
            { label: "VOIDS", value: `${mockStats.voidsDetected}`, color: "var(--purple)" },
            { label: "REP/HR", value: `${mockStats.reportsLastHour}`, color: "var(--cyan)" },
          ].map(s => (
            <div key={s.label} style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: 3, padding: "6px 4px", textAlign: "center" }}>
              <div className="mono" style={{ fontSize: 7, letterSpacing: "0.08em", color: "var(--text-muted)" }}>{s.label}</div>
              <div style={{ fontSize: 11, fontWeight: 800, color: s.color, lineHeight: 1, marginTop: 2 }}>{s.value}</div>
            </div>
          ))}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 4, padding: "0 6px 6px" }}>
          {[
            { id: "wards", label: "WARDS", icon: MapPinned },
            { id: "priority", label: "PRIO", icon: AlertTriangle },
            { id: "voids", label: "VOIDS", icon: EyeOff },
            { id: "res", label: "RES", icon: LocateFixed },
          ].map(m => {
            const active = mapMode === (m.id === "res" ? "resources" : m.id);
            return (
              <button key={m.id} onClick={() => setMapMode((m.id === "res" ? "resources" : m.id) as never)} style={{
                display: "flex", alignItems: "center", gap: 4, justifyContent: "center", padding: "4px 2px", borderRadius: 3, cursor: "pointer",
                fontFamily: "var(--font-mono)", fontSize: 8, fontWeight: 700, letterSpacing: "0.05em",
                background: active ? "var(--lime-dim)" : "transparent", color: active ? "var(--lime)" : "var(--text-muted)",
                border: active ? "1px solid var(--lime-border)" : "1px solid var(--border)",
              }}>
                <m.icon size={9} /> {m.label}
              </button>
            );
          })}
        </div>
        <div style={{ padding: "0 6px 6px", display: "flex", gap: 4, flexWrap: "wrap" }}>
          {incidents.slice(0, 3).map(i => (
            <button key={i.id} onClick={() => { selectWard(i.wardCode); selectIncident(i.id); }} className="mono" style={{ fontSize: 8, padding: "3px 6px", borderRadius: 3, cursor: "pointer", background: selectedIncidentId === i.id ? "var(--lime-dim)" : "var(--bg-elevated)", border: selectedIncidentId === i.id ? "1px solid var(--lime-border)" : "1px solid var(--border)", color: selectedIncidentId === i.id ? "var(--lime)" : "var(--text-dim)" }}>{i.wardName} • {i.id}</button>
          ))}
        </div>
      </div>
    </aside>
  );
}
