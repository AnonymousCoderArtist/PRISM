import { motion, AnimatePresence } from "framer-motion";
import { FileText, ShieldCheck, Database, Radio, Truck, Navigation, Clock3, MapPin, X } from "lucide-react";
import { usePrism } from "../store/PrismContext";
import { RESOURCE_LABELS, STATUS_COLORS } from "../resources/resourceRegistry";

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

function headingCardinal(deg: number): string {
  const dirs = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
  const i = Math.round(((deg % 360) / 45)) % 8;
  return dirs[(i + 8) % 8] + ` • ${deg.toFixed(0)}°`;
}

export function RightPanel() {
  const { incidents, selectedIncidentId, selectIncident, selectedWardCode, reports, sources, simulationState, planPhase, selectedResource, selectResource } = usePrism();
  const hasIncidents = incidents.length > 0;
  const selected = hasIncidents ? (incidents.find(i => i.id === selectedIncidentId) ?? incidents[0]) : null;
  const locIncident = hasIncidents ? (selectedWardCode ? incidents.find(i => i.wardCode === selectedWardCode) ?? selected! : selected!) : null;

  return (
    <aside className="panel prism-right" style={{ display: "flex", flexDirection: "column", overflow: "hidden" }}>
      {/* ===== TOP-RIGHT: REPORTS streaming ===== */}
      <div style={{ display: "flex", flexDirection: "column", height: "42%" , minHeight: 220, borderBottom: "1px solid var(--border)" }}>
        <div className="panel-header">
          <span className="panel-title"><FileText size={11} /> INCOMING REPORTS {simulationState === "idle" && <span style={{ color: "var(--text-faint)", fontWeight: 400 }}>• IDLE</span>}</span>
          <span className="mono" style={{ fontSize: 9, color: reports.length ? "var(--lime)" : "var(--text-faint)", display: "inline-flex", alignItems: "center", gap: 4 }}><span style={{ width: 6, height: 6, borderRadius: 999, background: reports.length ? "var(--lime)" : "var(--border-strong)", animation: reports.length ? "pulse 1.2s infinite" : undefined }} /> {reports.length ? `${reports.length} • ${planPhase.toUpperCase()}` : "0 • AWAITING SIM"}</span>
        </div>
        <div style={{ flex: 1, overflowY: "auto", overflowX: "hidden", background: "var(--bg-panel)" }}>
          {reports.length === 0 ? (
            <div style={{ padding: "18px 12px", textAlign: "center", borderBottom: "1px dashed var(--border)" }}>
              <div className="mono" style={{ fontSize: 10, color: "var(--text-muted)", letterSpacing: "0.08em" }}>NO REPORTS YET</div>
              <div className="mono" style={{ fontSize: 9, color: "var(--text-faint)", marginTop: 4, lineHeight: 1.4 }}>Backend not connected.<br />Click <span style={{ color: "var(--lime)" }}>SIMULATE</span> to connect to <span style={{ color: "var(--text-muted)" }}>GET /api/reports</span> • emergency burst 0.75s</div>
            </div>
          ) : (
            <AnimatePresence initial={false}>
              {reports.slice(0, 10).map(r => (
                <motion.button
                  key={r.id}
                  layout
                  initial={{ opacity: 0, x: 14, scale: 0.98 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  exit={{ opacity: 0, x: -8 }}
                  transition={{ duration: 0.35, ease: "easeOut" }}
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
          )}
          <div className="mono" style={{ fontSize: 8, color: "var(--text-faint)", textAlign: "center", padding: "6px 6px", borderTop: "1px dashed var(--border)" }}>
            Backend: <span style={{ color: "var(--text-muted)" }}>GET /api/reports</span> • WS <span style={{ color: "var(--lime)" }}>REPORT_RECEIVED</span> → {simulationState === "running" ? "burst 0.75s emergency" : "idle"} • Dots on map appear only after ✓ VERIFIED
          </div>
        </div>
      </div>

      {/* ===== RESOURCE INTELLIGENCE (selection-driven) ===== */}
      {selectedResource && (
        <div style={{ background: "linear-gradient(180deg, rgba(204,255,0,0.06), transparent 55%), var(--bg-elevated)", borderBottom: "1px solid var(--lime-border)", padding: 10 }}>
          <div className="mono" style={{ fontSize: 8, letterSpacing: "0.12em", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
            <Truck size={11} style={{ color: "var(--lime)" }} /> RESOURCE INTEL — SELECTED
            <button onClick={() => selectResource(null)} className="mono" style={{ marginLeft: "auto", background: "transparent", border: "1px solid var(--border)", color: "var(--text-muted)", cursor: "pointer", padding: "2px 6px", borderRadius: 3, display: "inline-flex", alignItems: "center", gap: 4, fontSize: 8 }}><X size={10} /> CLEAR</button>
          </div>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10 }}>
            <div>
              <div className="mono" style={{ fontSize: 14, fontWeight: 800, color: "var(--text)", letterSpacing: "0.04em" }}>{selectedResource.id}</div>
              <div className="mono" style={{ fontSize: 9, color: "var(--text-muted)", letterSpacing: "0.08em" }}>{(RESOURCE_LABELS[selectedResource.kind] ?? selectedResource.kind.toUpperCase())}</div>
            </div>
            <span className="mono" style={{
              fontSize: 8, fontWeight: 800, letterSpacing: "0.10em",
              color: selectedResource.status === "en_route" ? "#050607" : "#E8ECEB",
              background: STATUS_COLORS[selectedResource.status] ?? "var(--border)",
              border: selectedResource.status === "en_route" ? "1px solid #CCFF00" : "1px solid var(--border)",
              padding: "3px 7px", borderRadius: 999,
            }}>{selectedResource.status.toUpperCase().replace("_", " ")}</span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, marginTop: 9 }}>
            <div style={{ background: "var(--bg-panel)", border: "1px solid var(--border)", borderRadius: 3, padding: "6px 7px" }}>
              <div className="mono" style={{ fontSize: 7, letterSpacing: "0.08em", color: "var(--text-faint)" }}><MapPin size={10} /> TARGET</div>
              <div className="mono" style={{ fontSize: 11, fontWeight: 700, color: "var(--text)", marginTop: 2 }}>{selectedResource.destination ?? "— HOLD —"}</div>
              {selectedResource.destLat != null && <div className="mono" style={{ fontSize: 8, color: "var(--text-muted)" }}>{selectedResource.destLat.toFixed(4)}°N {selectedResource.destLon?.toFixed(4)}°E</div>}
            </div>
            <div style={{ background: "var(--bg-panel)", border: "1px solid var(--border)", borderRadius: 3, padding: "6px 7px" }}>
              <div className="mono" style={{ fontSize: 7, letterSpacing: "0.08em", color: "var(--text-faint)" }}><Clock3 size={10} /> ETA</div>
              <div className="mono" style={{ fontSize: 13, fontWeight: 800, color: selectedResource.status === "en_route" ? "var(--lime)" : "var(--text)", marginTop: 2 }}>{selectedResource.etaMin != null ? `${selectedResource.etaMin} min` : "—"}</div>
              <div className="mono" style={{ fontSize: 8, color: "var(--text-muted)" }}>{selectedResource.speed ? `${selectedResource.speed} km/h` : ""} {selectedResource.status === "en_route" ? "• en route" : ""}</div>
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, marginTop: 6 }}>
            <div style={{ background: "var(--bg-panel)", border: "1px solid var(--border)", borderRadius: 3, padding: "6px 7px" }}>
              <div className="mono" style={{ fontSize: 7, color: "var(--text-faint)", letterSpacing: "0.08em" }}><Navigation size={10} /> HEADING</div>
              <div className="mono" style={{ fontSize: 11, fontWeight: 700, color: "var(--text)" }}>{Math.round(selectedResource.heading)}°</div>
              <div className="mono" style={{ fontSize: 8, color: "var(--text-muted)" }}>{headingCardinal(selectedResource.heading)}</div>
            </div>
            <div style={{ background: "var(--bg-panel)", border: "1px solid var(--border)", borderRadius: 3, padding: "6px 7px" }}>
              <div className="mono" style={{ fontSize: 7, color: "var(--text-faint)", letterSpacing: "0.08em" }}>CURRENT POSITION</div>
              <div className="mono" style={{ fontSize: 10, fontWeight: 700, color: "var(--text)" }}>{selectedResource.lat.toFixed(4)}°N</div>
              <div className="mono" style={{ fontSize: 10, fontWeight: 700, color: "var(--text)" }}>{selectedResource.lng.toFixed(4)}°E</div>
            </div>
          </div>
          {selectedResource.mission && (
            <div style={{ marginTop: 7, background: "var(--bg-panel)", border: "1px solid var(--border)", borderRadius: 3, padding: "7px 8px" }}>
              <div className="mono" style={{ fontSize: 7, letterSpacing: "0.08em", color: "var(--text-faint)" }}>MISSION</div>
              <div className="mono" style={{ fontSize: 10, color: "var(--text-dim)", marginTop: 2, lineHeight: 1.35 }}>{selectedResource.mission}</div>
            </div>
          )}
          <div className="mono" style={{ fontSize: 7, color: "var(--text-faint)", marginTop: 6, display: "flex", justifyContent: "space-between" }}>
            <span>3D model — {selectedResource.kind}</span><span>click map to change • route shows at zoom ≥ 11.8</span>
          </div>
        </div>
      )}

      {/* ===== MIDDLE-RIGHT: CONFIDENCE by location ===== */}
      <div style={{ background: "var(--bg-elevated)", borderBottom: "1px solid var(--border)", padding: 10 }}>
        <div className="mono" style={{ fontSize: 8, letterSpacing: "0.12em", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: 6, marginBottom: 7 }}>
          <ShieldCheck size={11} /> CONFIDENCE — BY LOCATION {incidents.length === 0 && <span style={{ color: "var(--text-faint)", fontWeight: 400 }}>• AWAITING VERIFICATION</span>}
        </div>
        {locIncident ? (
          <>
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
          </>
        ) : (
          <div style={{ textAlign: "center", padding: "8px 4px", border: "1px dashed var(--border)", borderRadius: 3 }}>
            <div className="mono" style={{ fontSize: 9, color: "var(--text-muted)" }}>— NO VERIFIED INCIDENT —</div>
            <div className="mono" style={{ fontSize: 8, color: "var(--text-faint)", marginTop: 4 }}>Confidence appears after first verified report.<br />Red/green dots on map are verification-gated.</div>
          </div>
        )}
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
            <Radio size={10} /> sources cascade down as reports arrive
          </div>
        </div>
      </div>
    </aside>
  );
}
