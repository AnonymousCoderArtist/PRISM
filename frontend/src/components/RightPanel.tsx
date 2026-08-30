import { motion, AnimatePresence } from "framer-motion";
import { FileText, ShieldCheck, Database, Radio } from "lucide-react";
import { usePrism } from "../store/PrismContext";

function ConfidenceBar({ value }: { value: number }) {
  const color = value > 80 ? "var(--green)" : value > 60 ? "var(--lime)" : value > 40 ? "var(--amber)" : "var(--red)";
  return (
    <div style={{ height: 6, background: "#0e191d", borderRadius: 999, overflow: "hidden", border: "1px solid var(--border)" }}>
      <motion.div initial={{ width: 0 }} animate={{ width: `${value}%` }} transition={{ duration: 0.7, ease: "easeOut" }} style={{ height: "100%", background: color }} />
    </div>
  );
}

function SourceDot({ type }: { type: string }) {
  const col = type === "satellite" ? "var(--cyan)" : type === "field" ? "var(--lime)" : type === "social" ? "var(--amber)" : type === "official" ? "var(--green)" : "var(--text-muted)";
  return <span style={{ width: 7, height: 7, borderRadius: 999, background: col, boxShadow: `0 0 8px ${col}`, display: "inline-block", flexShrink: 0 }} />;
}

export function RightPanel() {
  const { incidents, selectedIncidentId, selectIncident, selectedWardCode, reports, sources } = usePrism();
  const selected = incidents.find(i => i.id === selectedIncidentId) ?? incidents[0];
  // confidence derived from location (ward) — if user selected a ward, show that ward's incident confidence
  const locIncident = selectedWardCode ? incidents.find(i => i.wardCode === selectedWardCode) ?? selected : selected;

  return (
    <aside className="panel prism-right" style={{ borderLeft: "1px solid var(--border)", borderRight: "1px solid var(--border)", display: "flex", flexDirection: "column", overflow: "hidden" }}>
      {/* ===== TOP-RIGHT: REPORTS streaming ===== */}
      <div style={{ display: "flex", flexDirection: "column", height: "42%" , minHeight: 220, borderBottom: "1px solid var(--border)" }}>
        <div className="panel-header">
          <span className="panel-title"><FileText size={11} /> INCOMING REPORTS</span>
          <span className="mono" style={{ fontSize: 9, color: "var(--lime)", display: "inline-flex", alignItems: "center", gap: 4 }}><span style={{ width: 6, height: 6, borderRadius: 999, background: "var(--lime)", animation: "pulse 1.2s infinite" }} /> {reports.length} • SIM</span>
        </div>
        <div style={{ flex: 1, overflowY: "auto", overflowX: "hidden", background: "var(--bg-panel)" }}>
          <AnimatePresence initial={false}>
            {reports.slice(0, 10).map(r => (
              <motion.button
                key={r.id}
                layout
                initial={{ opacity: 0, x: 14, scale: 0.98 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: -8 }}
                transition={{ duration: 0.45, ease: "easeOut" }}
                onClick={() => selectIncident(r.incidentId)}
                style={{
                  width: "100%", textAlign: "left", padding: "8px 10px", display: "flex", gap: 8,
                  background: selectedIncidentId === r.incidentId ? "rgba(204,255,0,0.08)" : "transparent",
                  border: "none", borderBottom: "1px solid var(--border)", cursor: "pointer",
                }}
              >
                <span style={{ marginTop: 5 }}><SourceDot type={r.source} /></span>
                <span style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                    <span className="mono" style={{ fontSize: 9, fontWeight: 800, color: r.verified ? "var(--green)" : "var(--text)", border: r.verified ? "1px solid rgba(70,224,155,0.3)" : "1px solid var(--border)", padding: "1px 4px", borderRadius: 2, background: r.verified ? "rgba(70,224,155,0.1)" : "var(--bg-elevated)" }}>{r.source.toUpperCase()}</span>
                    <span className="mono" style={{ fontSize: 9, color: "var(--text-muted)" }}>{r.time}</span>
                    <span className="mono" style={{ fontSize: 9, color: "var(--text-faint)" }}>WARD {r.wardCode}</span>
                    {r.verified && <span className="mono" style={{ fontSize: 8, color: "var(--green)" }}>✓ VERIFIED</span>}
                  </div>
                  <div style={{ fontSize: 11, color: "var(--text-dim)", marginTop: 3, lineHeight: 1.35, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{r.text}</div>
                  <div className="mono" style={{ fontSize: 9, color: "var(--text-faint)", marginTop: 2 }}>→ {r.incidentId} • {r.verified ? "2+ corroborations" : "awaiting corroboration"}</div>
                </span>
              </motion.button>
            ))}
          </AnimatePresence>
          <div className="mono" style={{ fontSize: 8, color: "var(--text-faint)", textAlign: "center", padding: "6px 6px", borderTop: "1px dashed var(--border)" }}>
            Backend: <span style={{ color: "var(--text-muted)" }}>GET /api/reports</span> • WS <span style={{ color: "var(--lime)" }}>REPORT_RECEIVED</span> → animates one-by-one (1.8s) • Simulated when SIM active
          </div>
        </div>
      </div>

      {/* ===== MIDDLE-RIGHT: CONFIDENCE by location ===== */}
      <div style={{ background: "var(--bg-elevated)", borderBottom: "1px solid var(--border)", padding: 10 }}>
        <div className="mono" style={{ fontSize: 8, letterSpacing: "0.12em", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: 6, marginBottom: 7 }}>
          <ShieldCheck size={11} /> CONFIDENCE — BY LOCATION
        </div>
        <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
          <span style={{ fontSize: 22, fontWeight: 800, color: locIncident.confidence > 70 ? "var(--green)" : locIncident.confidence > 50 ? "var(--lime)" : "var(--amber)", letterSpacing: "-0.02em" }}>{locIncident.confidence}%</span>
          <span className="mono" style={{ fontSize: 9, color: "var(--text-muted)", letterSpacing: "0.08em" }}>{locIncident.wardName.toUpperCase()} • {locIncident.confidence > 80 ? "VERIFIED" : locIncident.confidence > 50 ? "CORROBORATED" : "LOW"}</span>
          {selectedWardCode && <span className="mono" style={{ fontSize: 8, color: "var(--lime)", border: "1px solid var(--lime-border)", padding: "2px 5px", borderRadius: 2, marginLeft: "auto" }}>SELECTED</span>}
        </div>
        <div style={{ marginTop: 7 }}><ConfidenceBar value={locIncident.confidence} /></div>
        <div style={{ display: "flex", gap: 5, marginTop: 7, flexWrap: "wrap" }}>
          {[
            { k: "Satellite", v: locIncident.confidence > 80 ? 82 : 64 },
            { k: "Ground", v: locIncident.confidence > 60 ? 91 : 48 },
            { k: "Social", v: Math.max(28, locIncident.confidence - 22) },
          ].map(s => (
            <span key={s.k} className="mono" style={{ fontSize: 8, color: "var(--text-muted)", background: "var(--bg-panel)", border: "1px solid var(--border)", padding: "3px 6px", borderRadius: 2 }}>
              {s.k} {s.v}%
            </span>
          ))}
          <span className="mono" style={{ fontSize: 8, color: "var(--text-faint)", marginLeft: "auto" }}>{locIncident.reports} reports fused</span>
        </div>
        <div className="mono" style={{ fontSize: 8, color: "var(--text-faint)", marginTop: 6, lineHeight: 1.4 }}>
          Click any ward → confidence recalculates per location. Future: <span style={{ color: "var(--text-muted)" }}>GET /api/incidents/:ward/confidence</span>.
        </div>
      </div>

      {/* ===== BOTTOM-RIGHT: SOURCES streaming down ===== */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", minHeight: 160 }}>
        <div className="panel-header" style={{ background: "var(--bg-panel-2)", flexShrink: 0 }}>
          <span className="panel-title"><Database size={11} /> EVIDENCE SOURCES</span>
          <span className="mono" style={{ fontSize: 9, color: "var(--text-faint)" }}>{sources.length} • FLOWING</span>
        </div>
        <div style={{ flex: 1, overflowY: "auto", background: "var(--bg-panel)", padding: 6, display: "flex", flexDirection: "column", gap: 5 }}>
          <AnimatePresence initial={false}>
            {sources.slice(0, 8).map(s => (
              <motion.div
                key={s.id}
                layout
                initial={{ opacity: 0, y: -10, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 6 }}
                transition={{ duration: 0.42 }}
                style={{
                  background: "var(--bg-elevated)", border: "1px solid var(--border)", borderLeft: `2px solid ${s.type === "satellite" ? "var(--cyan)" : s.type === "field" ? "var(--lime)" : s.type === "social" ? "var(--amber)" : "var(--purple)"}`,
                  borderRadius: 3, padding: "7px 8px", display: "flex", gap: 8, alignItems: "flex-start",
                }}
              >
                <SourceDot type={s.type} />
                <span style={{ flex: 1, minWidth: 0 }}>
                  <div className="mono" style={{ fontSize: 9, fontWeight: 700, color: "var(--text)", display: "flex", alignItems: "center", gap: 6 }}>
                    {s.label.toUpperCase()} <span style={{ fontWeight: 400, color: "var(--text-muted)", fontSize: 8, border: "1px solid var(--border)", padding: "1px 4px", borderRadius: 2 }}>{s.type}</span>
                    <span style={{ marginLeft: "auto", color: "var(--text-faint)", fontWeight: 400 }}>{s.time}</span>
                  </div>
                  <div className="mono" style={{ fontSize: 10, color: "var(--text-dim)", marginTop: 2, lineHeight: 1.35 }}>{s.detail}</div>
                  <div className="mono" style={{ fontSize: 8, color: "var(--text-faint)", marginTop: 3 }}>WARD {s.wardCode} • confidence {(s.confidence * 100).toFixed(0)}% • {s.confidence > 0.8 ? "high" : s.confidence > 0.6 ? "medium" : "low"}</div>
                </span>
              </motion.div>
            ))}
          </AnimatePresence>
          <div className="mono" style={{ fontSize: 8, color: "var(--text-faint)", textAlign: "center", padding: "6px 2px", display: "flex", alignItems: "center", gap: 6, justifyContent: "center", border: "1px dashed var(--border)", borderRadius: 3 }}>
            <Radio size={10} /> WS <span style={{ color: "var(--lime)" }}>/ws/live</span> • sources cascade down — SIM drives flow flawlessly
          </div>
        </div>
      </div>
    </aside>
  );
}
