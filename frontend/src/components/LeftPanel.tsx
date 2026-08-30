import { motion } from "framer-motion";
import { Layers, MapPinned, AlertTriangle, LocateFixed, EyeOff, Crosshair, Truck, Route, Play, Pause, Zap, ShieldCheck } from "lucide-react";
import { usePrism } from "../store/PrismContext";
import { mockStats } from "../data/mock";

export function LeftPanel() {
  const { selectedWardCode, selectWard, incidents, selectedIncidentId, selectIncident, mapMode, setMapMode, simulationState, setSimulationState, plan, planPhase } = usePrism();
  const selectedIncident = incidents.find(i => i.id === selectedIncidentId) ?? null;

  return (
    <aside className="panel prism-left" style={{ borderRight: "1px solid var(--border)", borderLeft: "1px solid var(--border)", display: "flex", flexDirection: "column" }}>
      {/* Compact sector strip */}
      <div className="panel-header">
        <span className="panel-title"><span className="panel-title-dot" /> SECTOR OVERVIEW</span>
        <span className="mono" style={{ fontSize: 9, color: "var(--text-faint)", letterSpacing: "0.08em" }}>{mockStats.totalWards} WARDS • {mockStats.activeIncidents} ACTIVE</span>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, padding: "8px 8px 0" }}>
        {[
          { label: "AVG CONF", value: `${mockStats.avgConfidence}%`, color: "var(--lime)" },
          { label: "PRIORITY", value: `${mockStats.activeIncidents}`, color: "var(--amber)" },
          { label: "VOIDS", value: `${mockStats.voidsDetected}`, color: "var(--purple)" },
          { label: "REPORTS/HR", value: `${mockStats.reportsLastHour}`, color: "var(--cyan)" },
        ].map(s => (
          <div key={s.label} style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: 3, padding: "7px 8px" }}>
            <div className="mono" style={{ fontSize: 8, letterSpacing: "0.1em", color: "var(--text-muted)" }}>{s.label}</div>
            <div style={{ fontSize: 14, fontWeight: 800, color: s.color, lineHeight: 1, marginTop: 2 }}>{s.value}</div>
          </div>
        ))}
      </div>

      <div style={{ padding: "8px 8px 0" }}>
        <div style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: 4, padding: 7 }}>
          <div className="mono" style={{ fontSize: 8, letterSpacing: "0.12em", color: "var(--text-muted)", marginBottom: 5, display: "flex", alignItems: "center", gap: 6 }}><Layers size={10} /> MAP MODE</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 5 }}>
            {[
              { id: "wards", label: "WARDS", icon: MapPinned },
              { id: "priority", label: "PRIORITY", icon: AlertTriangle },
              { id: "voids", label: "VOIDS", icon: EyeOff },
              { id: "resources", label: "RESOURCES", icon: LocateFixed },
            ].map(m => {
              const active = mapMode === m.id;
              return (
                <button key={m.id} onClick={() => setMapMode(m.id as never)} style={{
                  display: "flex", alignItems: "center", gap: 5, justifyContent: "center",
                  padding: "5px 4px", borderRadius: 3, cursor: "pointer",
                  fontFamily: "var(--font-mono)", fontSize: 9, letterSpacing: "0.06em", fontWeight: 700,
                  background: active ? "var(--lime-dim)" : "transparent", color: active ? "var(--lime)" : "var(--text-muted)",
                  border: active ? "1px solid var(--lime-border)" : "1px solid var(--border)",
                }}>
                  <m.icon size={10} /> {m.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* SELECTED context compact */}
      <div style={{ padding: "8px 8px 0" }}>
        <div style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: 4, padding: 8 }}>
          <div className="mono" style={{ fontSize: 8, letterSpacing: "0.12em", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}><Crosshair size={10} /> SELECTED</div>
          {selectedWardCode ? (
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text)" }}>Ward {selectedWardCode} — {selectedWardCode === 69077 ? "Bharalu" : selectedIncident?.wardName ?? ""}</div>
              <div className="mono" style={{ fontSize: 9, color: "var(--text-dim)", marginTop: 2 }}>Guwahati (M Corp.) • LGD:{selectedWardCode}</div>
              <button onClick={() => selectWard(null)} className="mono" style={{ marginTop: 6, fontSize: 9, background: "transparent", border: "1px solid var(--border)", color: "var(--text-muted)", padding: "3px 7px", borderRadius: 3, cursor: "pointer" }}>CLEAR</button>
            </div>
          ) : selectedIncident ? (
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text)", lineHeight: 1.3 }}>{selectedIncident.title}</div>
              <div className="mono" style={{ fontSize: 9, color: "var(--text-muted)", marginTop: 3 }}>{selectedIncident.id} • {selectedIncident.wardName}</div>
            </div>
          ) : (
            <div className="mono" style={{ fontSize: 10, color: "var(--text-faint)", lineHeight: 1.4 }}>Click a ward or incident. Details drive confidence & activity below.</div>
          )}
        </div>
      </div>

      {/* === BIGGEST: RESPONSE PLAN === */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", marginTop: 8, borderTop: "1px solid var(--border)", background: "linear-gradient(180deg, rgba(204,255,0,0.04), transparent 22%), var(--bg-panel)" }}>
        <div className="panel-header" style={{ background: "var(--bg-panel-2)" }}>
          <span className="panel-title" style={{ color: "var(--lime)" }}><Truck size={12} /> RESPONSE PLAN <span style={{ color: "var(--text-faint)", fontWeight: 400, letterSpacing: "0.06em", marginLeft: 6 }}>OR-TOOLS • SIM</span></span>
          <span className="mono" style={{ fontSize: 8, color: plan.length ? "var(--lime)" : "var(--text-faint)" }}>{plan.length ? `${plan.length} ASSIGNMENTS` : planPhase === "collecting" ? "AWAITING" : planPhase === "optimizing" ? "COMPUTING" : "IDLE"}</span>
        </div>

        <div style={{ padding: 8, display: "flex", flexDirection: "column", gap: 7, overflowY: "auto", flex: 1 }}>
          {/* Simulate control — must be prominent */}
          <div style={{ background: simulationState === "running" ? "rgba(204,255,0,0.12)" : "var(--bg-elevated)", border: simulationState === "running" ? "1px solid var(--lime-border)" : "1px solid var(--border)", borderRadius: 4, padding: 8, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <div className="mono" style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", color: simulationState === "running" ? "var(--lime)" : "var(--text)" }}>{simulationState === "running" ? "● SIMULATION LIVE" : "READY TO SIMULATE"}</div>
              <div className="mono" style={{ fontSize: 9, color: "var(--text-muted)", marginTop: 2 }}>Reports + Sources stream every ~2s • WS-ready</div>
            </div>
            <button onClick={() => setSimulationState(simulationState === "running" ? "paused" : "running")} className="mono" style={{
              display: "inline-flex", alignItems: "center", gap: 6, padding: "7px 12px", borderRadius: 4, cursor: "pointer",
              background: simulationState === "running" ? "#050607" : "var(--lime)", color: simulationState === "running" ? "var(--lime)" : "#050607",
              border: simulationState === "running" ? "1px solid var(--lime-border)" : "1px solid transparent", fontWeight: 800, fontSize: 10, letterSpacing: "0.12em",
            }}>
              {simulationState === "running" ? <Pause size={12} /> : <Play size={12} />} {simulationState === "running" ? "PAUSE" : "SIMULATE"}
            </button>
          </div>

          {/* Assignments — sequential: empty until planReady */}
          {plan.length === 0 ? (
            <div style={{ background: "var(--bg-elevated)", border: "1px dashed var(--border)", borderRadius: 3, padding: "12px 10px", textAlign: "center" }}>
              <div className="mono" style={{ fontSize: 9, letterSpacing: "0.1em", color: planPhase === "collecting" ? "var(--amber)" : planPhase === "optimizing" ? "var(--cyan)" : "var(--text-faint)" }}>
                {planPhase === "collecting" && "● COLLECTING REPORTS… (plan pending)"}
                {planPhase === "optimizing" && "◐ OPTIMIZING ROUTES — OR-TOOLS…"}
                {planPhase === "idle" && "○ IDLE — click SIMULATE to start sequence"}
                {planPhase === "ready" && "READY"}
              </div>
              <div className="mono" style={{ fontSize: 9, color: "var(--text-muted)", marginTop: 4, lineHeight: 1.4 }}>
                {planPhase === "collecting" && "Reports stream first. Plan generates LAST after ~7 reports."}
                {planPhase === "optimizing" && "Fusing confidence + priority → computing VRP…"}
                {planPhase === "idle" && "Sequence: Reports → Sources → Confidence → Plan (LAST)."}
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
            <span className="mono" style={{ fontSize: 9, color: "var(--text-dim)", lineHeight: 1.4 }}><span style={{ color: "var(--purple)", fontWeight: 700 }}>VOID</span> — Wards 33/41/57 silent 6h — recommend recon. Activates when graph flatlines.</span>
          </div>

          <div className="mono" style={{ fontSize: 8, color: "var(--text-faint)", textAlign: "center", marginTop: 2 }}>
            Flawless WS handoff: <span style={{ color: "var(--text-muted)" }}>REPORT_RECEIVED</span> → reports list • <span style={{ color: "var(--text-muted)" }}>PRIORITY_UPDATED</span> → map pulse
          </div>
        </div>
      </div>

      {/* Tiny recent sectors (collapsible) */}
      <div style={{ borderTop: "1px solid var(--border)", padding: 8, flexShrink: 0 }}>
        <div className="mono" style={{ fontSize: 8, letterSpacing: "0.1em", color: "var(--text-faint)", marginBottom: 5 }}>QUICK SELECT WARD</div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {incidents.slice(0, 4).map(i => (
            <button key={i.id} onClick={() => { selectWard(i.wardCode); selectIncident(i.id); }} className="mono" style={{
              fontSize: 9, padding: "4px 7px", borderRadius: 3, cursor: "pointer",
              background: selectedIncidentId === i.id ? "var(--lime-dim)" : "var(--bg-elevated)",
              border: selectedIncidentId === i.id ? "1px solid var(--lime-border)" : "1px solid var(--border)",
              color: selectedIncidentId === i.id ? "var(--lime)" : "var(--text-dim)",
            }}>{i.wardName} • {i.id}</button>
          ))}
        </div>
      </div>
    </aside>
  );
}
