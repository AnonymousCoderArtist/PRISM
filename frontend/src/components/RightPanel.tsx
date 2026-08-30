import { motion, AnimatePresence } from "framer-motion";
import { FileText, ShieldCheck, Database, Truck, X } from "lucide-react";
import { usePrism } from "../store/PrismContext";
import { RESOURCE_LABELS, STATUS_COLORS } from "../resources/resourceRegistry";

function ConfidenceBar({ value }: { value: number }) {
  const color = value > 80 ? "var(--green)" : value > 60 ? "var(--lime)" : value > 40 ? "var(--amber)" : "var(--red)";
  return (
    <div style={{ height: 4, background: "#0e191d", borderRadius: 999, overflow: "hidden", border: "1px solid var(--border)" }}>
      <motion.div initial={{ width: 0 }} animate={{ width: `${value}%` }} transition={{ duration: 0.7, ease: "easeOut" }} style={{ height: "100%", background: color }} />
    </div>
  );
}

export function RightPanel() {
  const { incidents, selectedIncidentId, selectIncident, selectedWardCode, reports, sources, planPhase, selectedResource, selectResource } = usePrism();
  const hasIncidents = incidents.length > 0;
  const selected = hasIncidents ? (incidents.find(i => i.id === selectedIncidentId) ?? incidents[0]) : null;
  const locIncident = hasIncidents ? (selectedWardCode ? incidents.find(i => i.wardCode === selectedWardCode) ?? selected! : selected!) : null;

  return (
    <aside className="panel prism-right" style={{ borderLeft: "1px solid var(--border)", borderRight: "1px solid var(--border)", display: "flex", flexDirection: "column", overflow: "hidden" }}>
      {/* Reports */}
      <div style={{ display: "flex", flexDirection: "column", height: "42%" , minHeight: 220, borderBottom: "1px solid var(--border)" }}>
        <div className="panel-header">
          <span className="panel-title"><FileText size={11} /> INCOMING REPORTS</span>
          <span className="mono" style={{ fontSize: 9, color: reports.length ? "var(--lime)" : "var(--text-faint)" }}>{reports.length ? `${reports.length} • ${planPhase.toUpperCase()}` : "0 • AWAITING SIM"}</span>
        </div>
        <div style={{ flex: 1, overflowY: "auto", overflowX: "hidden", background: "var(--bg-panel)" }}>
          {reports.length === 0 ? (
            <div style={{ padding: "18px 12px", textAlign: "center", borderBottom: "1px dashed var(--border)" }}>
              <div className="mono" style={{ fontSize: 10, color: "var(--text-muted)", letterSpacing: "0.08em" }}>NO REPORTS YET</div>
              <div className="mono" style={{ fontSize: 9, color: "var(--text-faint)", marginTop: 4, lineHeight: 1.4 }}>Click SIMULATE to connect to backend.</div>
            </div>
          ) : (
            <AnimatePresence initial={false}>
              {reports.slice(0, 10).map(r => (
                <motion.button
                  key={r.id}
                  layout
                  initial={{ opacity: 0, x: 14 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -8 }}
                  transition={{ duration: 0.35, ease: "easeOut" }}
                  onClick={() => selectIncident(r.incidentId)}
                  style={{
                    width: "100%", textAlign: "left", padding: "8px 10px", display: "flex", gap: 8,
                    background: selectedIncidentId === r.incidentId ? "rgba(204,255,0,0.08)" : "transparent",
                    border: "none", borderBottom: "1px solid var(--border)", cursor: "pointer",
                  }}
                >
                  <span style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                      <span className="mono" style={{ fontSize: 9, fontWeight: 800, color: "var(--text)" }}>{r.source.toUpperCase()}</span>
                      <span className="mono" style={{ fontSize: 9, color: "var(--text-muted)" }}>{r.time}</span>
                      <span className="mono" style={{ fontSize: 9, color: "var(--text-faint)" }}>WARD {r.wardCode}</span>
                    </div>
                    <div style={{ fontSize: 11, color: "var(--text-dim)", marginTop: 3, lineHeight: 1.35, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{r.text}</div>
                    <div className="mono" style={{ fontSize: 9, color: "var(--text-faint)", marginTop: 2 }}>→ {r.incidentId}</div>
                  </span>
                </motion.button>
              ))}
            </AnimatePresence>
          )}
        </div>
      </div>

      {/* Resource Intel */}
      {selectedResource && (
        <div style={{ background: "var(--bg-elevated)", borderBottom: "1px solid var(--border)", padding: 10 }}>
          <div className="mono" style={{ fontSize: 8, letterSpacing: "0.12em", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
            <Truck size={11} style={{ color: "var(--lime)" }} /> RESOURCE — {selectedResource.id}
            <button onClick={() => selectResource(null)} className="mono" style={{ marginLeft: "auto", background: "transparent", border: "1px solid var(--border)", color: "var(--text-muted)", cursor: "pointer", padding: "2px 6px", borderRadius: 3, display: "inline-flex", alignItems: "center", gap: 4, fontSize: 8 }}><X size={10} /> CLEAR</button>
          </div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 8 }}>
            <span style={{ fontSize: 18, fontWeight: 800, color: "var(--text)", letterSpacing: "0.04em" }}>{selectedResource.id}</span>
            <span className="mono" style={{ fontSize: 9, color: "var(--text-muted)", letterSpacing: "0.08em" }}>{(RESOURCE_LABELS[selectedResource.kind] ?? selectedResource.kind.toUpperCase())}</span>
            <span className="mono" style={{
              fontSize: 8, fontWeight: 800, letterSpacing: "0.10em",
              color: selectedResource.status === "en_route" ? "#050607" : "#E8ECEB",
              background: STATUS_COLORS[selectedResource.status] ?? "var(--border)",
              border: selectedResource.status === "en_route" ? "1px solid #CCFF00" : "1px solid var(--border)",
              padding: "3px 7px", borderRadius: 999, marginLeft: "auto",
            }}>{selectedResource.status.toUpperCase().replace("_", " ")}</span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
            <div>
              <div className="mono" style={{ fontSize: 7, letterSpacing: "0.08em", color: "var(--text-faint)" }}>TARGET</div>
              <div className="mono" style={{ fontSize: 11, fontWeight: 700, color: "var(--text)", marginTop: 2 }}>{selectedResource.destination ?? "— HOLD —"}</div>
            </div>
            <div>
              <div className="mono" style={{ fontSize: 7, letterSpacing: "0.08em", color: "var(--text-faint)" }}>ETA</div>
              <div className="mono" style={{ fontSize: 13, fontWeight: 800, color: selectedResource.status === "en_route" ? "var(--lime)" : "var(--text)", marginTop: 2 }}>{selectedResource.etaMin != null ? `${selectedResource.etaMin} min` : "—"}</div>
            </div>
            <div>
              <div className="mono" style={{ fontSize: 7, color: "var(--text-faint)", letterSpacing: "0.08em" }}>HEADING</div>
              <div className="mono" style={{ fontSize: 11, fontWeight: 700, color: "var(--text)" }}>{Math.round(selectedResource.heading)}°</div>
            </div>
            <div>
              <div className="mono" style={{ fontSize: 7, color: "var(--text-faint)", letterSpacing: "0.08em" }}>POSITION</div>
              <div className="mono" style={{ fontSize: 10, fontWeight: 700, color: "var(--text)" }}>{selectedResource.lat.toFixed(4)}°N {selectedResource.lng.toFixed(4)}°E</div>
            </div>
          </div>
          {selectedResource.mission && (
            <div style={{ marginTop: 7, background: "var(--bg-panel)", border: "1px solid var(--border)", borderRadius: 3, padding: "7px 8px" }}>
              <div className="mono" style={{ fontSize: 7, letterSpacing: "0.08em", color: "var(--text-faint)" }}>MISSION</div>
              <div className="mono" style={{ fontSize: 10, color: "var(--text-dim)", marginTop: 2, lineHeight: 1.35 }}>{selectedResource.mission}</div>
            </div>
          )}
        </div>
      )}

      {/* Confidence */}
      <div style={{ background: "var(--bg-elevated)", borderBottom: "1px solid var(--border)", padding: 10 }}>
        <div className="mono" style={{ fontSize: 8, letterSpacing: "0.12em", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: 6, marginBottom: 7 }}>
          <ShieldCheck size={11} /> CONFIDENCE
        </div>
        {locIncident ? (
          <>
            <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
              <span style={{ fontSize: 22, fontWeight: 800, color: locIncident.confidence > 70 ? "var(--green)" : locIncident.confidence > 50 ? "var(--lime)" : "var(--amber)", letterSpacing: "-0.02em" }}>{locIncident.confidence}%</span>
              <span className="mono" style={{ fontSize: 9, color: "var(--text-muted)", letterSpacing: "0.08em" }}>{locIncident.wardName.toUpperCase()}</span>
            </div>
            <div style={{ marginTop: 7 }}><ConfidenceBar value={locIncident.confidence} /></div>
          </>
        ) : (
          <div style={{ textAlign: "center", padding: "8px 4px" }}>
            <div className="mono" style={{ fontSize: 9, color: "var(--text-muted)" }}>NO VERIFIED INCIDENT</div>
          </div>
        )}
      </div>

      {/* Evidence Sources */}
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
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 6 }}
                transition={{ duration: 0.42 }}
                style={{
                  background: "var(--bg-elevated)", border: "1px solid var(--border)", borderLeft: `2px solid ${s.type === "satellite" ? "var(--cyan)" : s.type === "field" ? "var(--lime)" : s.type === "social" ? "var(--amber)" : "var(--purple)"}`,
                  borderRadius: 3, padding: "7px 8px", display: "flex", gap: 8, alignItems: "flex-start",
                }}
              >
                <span style={{ flex: 1, minWidth: 0 }}>
                  <div className="mono" style={{ fontSize: 9, fontWeight: 700, color: "var(--text)", display: "flex", alignItems: "center", gap: 6 }}>
                    {s.label.toUpperCase()}
                    <span style={{ fontWeight: 400, color: "var(--text-muted)", fontSize: 8 }}>{s.type}</span>
                    <span style={{ marginLeft: "auto", color: "var(--text-faint)", fontWeight: 400 }}>{s.time}</span>
                  </div>
                  <div className="mono" style={{ fontSize: 10, color: "var(--text-dim)", marginTop: 2, lineHeight: 1.35 }}>{s.detail}</div>
                  <div className="mono" style={{ fontSize: 8, color: "var(--text-faint)", marginTop: 3 }}>WARD {s.wardCode} • confidence {(s.confidence * 100).toFixed(0)}%</div>
                </span>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </aside>
  );
}
