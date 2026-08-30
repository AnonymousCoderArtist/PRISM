import { motion } from "framer-motion";
import { Ambulance, Truck, Shield, Building2, Utensils, Fuel, Users, BedDouble, HeartPulse, X, MapPinned, Radio, Home, Ship, Plane } from "lucide-react";
import { usePrism } from "../store/PrismContext";
import type { PrismResource } from "../resources/resourceTypes";

function kindIcon(kind: PrismResource["kind"]) {
  if (kind === "boat") return Ship;
  if (kind === "helicopter") return Plane;
  if (kind === "ambulance") return Ambulance;
  return Truck;
}

function statusColor(status: PrismResource["status"]): string {
  if (status === "en_route") return "var(--lime)";
  if (status === "active") return "var(--amber)";
  if (status === "arrived") return "var(--green)";
  if (status === "available") return "var(--cyan)";
  return "var(--text-faint)";
}

function statusLabel(status: PrismResource["status"]): string {
  return ({ en_route: "EN ROUTE", active: "ON SCENE", arrived: "ARRIVED", available: "STANDBY", offline: "OFFLINE" } as const)[status];
}

const inventory = [
  { icon: Ambulance, label: "AMBULANCES", count: "18", detail: "12 available • 4 deployed • 2 maintenance", color: "var(--red)", sub: "ALS 6 • BLS 12 • 102/108 integration" },
  { icon: HeartPulse, label: "MEDICAL TEAMS", count: "9", detail: "MMU 4 • PHC 3 • Mobile 2", color: "var(--green)", sub: "Doctors 24 • Nurses 46 • ASHA 62" },
  { icon: Shield, label: "RESCUE UNITS (NDRF/SDRF)", count: "6", detail: "Boats 14 • JCB 3 • Drone 2", color: "var(--amber)", sub: "Pandu 2 • Bharalu 1 • Fatasil 1 • Reserve 2" },
  { icon: Building2, label: "SHELTERS", count: "11", detail: "Capacity 1,840 • Occupied 62% • 701 free", color: "var(--cyan)", sub: "Schools 7 • Community halls 4" },
  { icon: Utensils, label: "FOOD / WATER", count: "4.2k", detail: "Meals/day • Water 8k L", color: "var(--lime)", sub: "AAMSU langars 3 • NGO kits 1.1k" },
  { icon: BedDouble, label: "BEDS", count: "236", detail: "GMCH 120 • MMCH 68 • PHC 48", color: "var(--purple)", sub: "ICU 18 • Oxygen 64" },
  { icon: Fuel, label: "TRANSPORT", count: "24", detail: "Buses 8 • Trucks 9 • Tempo 7", color: "var(--text-dim)", sub: "Fuel reserve 72h • Routes 3 active" },
  { icon: Users, label: "PERSONNEL", count: "312", detail: "Volunteers 142 • Police 68 • Officials 102", color: "var(--lime)", sub: "On-duty 214 • Standby 98" },
];

const helplines = [
  { name: "ASDMA Control", num: "1070 / 0361-2733052" },
  { name: "NDRF Helpline", num: "9711077372" },
  { name: "108 Ambulance", num: "108" },
  { name: "GMCH Emergency", num: "0361-2134316" },
  { name: "DDMA Guwahati", num: "0361-2733052" },
  { name: "APDCL Fault", num: "1912" },
];

function Inner({ onClose }: { onClose: () => void }) {
  const { prismResources } = usePrism();
  const enRoute = prismResources.filter(r => r.status === "en_route").length;
  const onScene = prismResources.filter(r => r.status === "arrived" || r.status === "active").length;
  const standby = prismResources.filter(r => r.status === "available").length;
  return (
    <div style={{ maxWidth: 1120, margin: "0 auto", display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid var(--border)", paddingBottom: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Truck size={16} style={{ color: "var(--lime)" }} />
          <span className="mono" style={{ fontSize: 12, letterSpacing: "0.14em", fontWeight: 800, color: "var(--text)" }}>RESOURCES — ADMINISTRATION INVENTORY</span>
          <span className="mono" style={{ fontSize: 9, color: "var(--lime)", background: "var(--lime-dim)", border: "1px solid var(--lime-border)", padding: "2px 6px", borderRadius: 2 }}>LIVE • LOCAL-FIRST</span>
        </div>
        <button onClick={onClose} className="mono" style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "var(--bg-elevated)", border: "1px solid var(--border)", color: "var(--text-muted)", padding: "6px 10px", borderRadius: 4, cursor: "pointer", fontSize: 10 }}>
          <X size={12} /> CLOSE
        </button>
      </div>

      {/* MAIN ADMINISTRATION BLOCK — centre */}
      <div style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: 4, padding: "14px 14px", display: "grid", gridTemplateColumns: "280px 1fr 260px", gap: 14, alignItems: "stretch" }}>
        <div style={{ background: "rgba(5,6,7,0.55)", border: "1px solid var(--border)", borderRadius: 4, padding: 12, display: "flex", flexDirection: "column", gap: 8 }}>
          <div className="mono" style={{ fontSize: 9, letterSpacing: "0.14em", color: "var(--lime)", display: "flex", alignItems: "center", gap: 6 }}><Home size={12} /> MAIN ADMINISTRATION BLOCK <Building2 size={10} style={{ opacity: 0.6 }} /></div>
          <div style={{ fontSize: 16, fontWeight: 800, color: "var(--text)", lineHeight: 1.2 }}>Dispur Secretariat<br />Annex — Guwahati</div>
          <div className="mono" style={{ fontSize: 9, color: "var(--text-muted)" }}>26.14°N 91.77°E • 24×7 EOC • ASDMA/DDMA joint</div>
          <div style={{ display: "flex", gap: 6, marginTop: 4 }}>
            <span className="mono" style={{ fontSize: 8, padding: "3px 6px", borderRadius: 2, background: "rgba(70,224,155,0.14)", border: "1px solid rgba(70,224,155,0.3)", color: "var(--green)" }}>● OPERATIONAL</span>
            <span className="mono" style={{ fontSize: 8, padding: "3px 6px", borderRadius: 2, background: "rgba(204,255,0,0.10)", border: "1px solid var(--lime-border)", color: "var(--lime)" }}>HQ • STAFF 42</span>
          </div>
          <div className="mono" style={{ fontSize: 9, color: "var(--text-dim)", marginTop: 6, lineHeight: 1.4 }}>
            On SIMULATE → after plan, ambulances & helicopters animate from HQ to assigned wards (see map). Routes are OR-Tools VRP outputs.
          </div>
        </div>

        <div style={{ background: "var(--bg-panel)", border: "1px solid var(--border)", borderRadius: 4, overflow: "hidden", position: "relative", minHeight: 160, display: "grid", placeItems: "center" }}>
          <div style={{ position: "absolute", inset: 8, border: "1px dashed rgba(204,255,0,0.18)", borderRadius: 4 }} />
          <div style={{ textAlign: "center" }}>
            <div style={{ width: 72, height: 72, margin: "0 auto", border: "1.5px solid var(--lime)", background: "rgba(204,255,0,0.10)", display: "grid", placeItems: "center", borderRadius: 4 }}>
              <Building2 size={28} style={{ color: "var(--lime)" }} />
            </div>
            <div className="mono" style={{ fontSize: 10, fontWeight: 800, color: "var(--text)", marginTop: 8, letterSpacing: "0.08em" }}>EOC — CENTRAL COMMAND</div>
            <div className="mono" style={{ fontSize: 8, color: "var(--text-muted)", marginTop: 3 }}>Dispur • coordination for 60 wards</div>
            <div className="mono" style={{ fontSize: 8, color: "var(--lime)", marginTop: 6, display: "inline-flex", alignItems: "center", gap: 4, border: "1px solid var(--lime-border)", padding: "2px 6px", borderRadius: 2 }}><Radio size={10} /> WS /ws/live • feeding live</div>
          </div>
          <div className="mono" style={{ position: "absolute", bottom: 6, left: 50, transform: "translateX(-50%)", fontSize: 8, color: "var(--text-faint)", display: "flex", alignItems: "center", gap: 6 }}><MapPinned size={10} /> 26.143°N 91.789°E • HQ marker on map</div>
        </div>

        <div style={{ background: "var(--bg-panel)", border: "1px solid var(--border)", borderRadius: 4, padding: 10, display: "flex", flexDirection: "column", gap: 8 }}>
          <div className="mono" style={{ fontSize: 8, letterSpacing: "0.12em", color: "var(--text-muted)" }}>SIMULATION FLOW</div>
          <div className="mono" style={{ fontSize: 9, color: "var(--text)", lineHeight: 1.6 }}>
            <span style={{ color: "var(--lime)" }}>1.</span> SIMULATE → backend 750ms burst<br />
            <span style={{ color: "var(--amber)" }}>2.</span> Verification → dots on map<br />
            <span style={{ color: "var(--cyan)" }}>3.</span> Confidence per ward → Sources<br />
            <span style={{ color: "var(--green)" }}>4.</span> Plan LAST (OR-Tools)<br />
            <span style={{ color: "var(--purple)" }}>5.</span> Ambulance/heli animate
          </div>
          <div style={{ height: 1, background: "var(--border)", margin: "2px 0" }} />
          <div className="mono" style={{ fontSize: 8, color: "var(--text-faint)", lineHeight: 1.4 }}>This page is a full new page, not a map overlay. Use top <span style={{ color: "var(--lime)" }}>RESOURCES</span> toggle to switch.</div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 10 }}>
        {inventory.map((it, idx) => (
          <motion.div key={it.label} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.04 }} style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)", borderLeft: `2.5px solid ${it.color}`, borderRadius: 4, padding: "10px 11px" }}>
            <div className="mono" style={{ fontSize: 9, letterSpacing: "0.1em", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: 6 }}><it.icon size={12} style={{ color: it.color }} /> {it.label}</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: it.color, marginTop: 4, lineHeight: 1 }}>{it.count}</div>
            <div className="mono" style={{ fontSize: 9, color: "var(--text-dim)", marginTop: 4, lineHeight: 1.35 }}>{it.detail}</div>
            <div className="mono" style={{ fontSize: 8, color: "var(--text-faint)", marginTop: 3 }}>{it.sub}</div>
          </motion.div>
        ))}
      </div>

      {/* LIVE DISPATCH — updates as each resource is dispatched (one by one after plan ready) */}
      <div style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: 4, padding: 10, display: "flex", flexDirection: "column", gap: 8 }}>
        <div className="mono" style={{ fontSize: 9, letterSpacing: "0.12em", color: "var(--text-muted)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
            <Radio size={11} style={{ color: "var(--lime)" }} /> LIVE DISPATCH — UPDATING AS RESOURCES MOVE
          </span>
          <span style={{ color: "var(--text-faint)" }}>{prismResources.length} TOTAL • {enRoute} EN ROUTE • {onScene} ON SCENE • {standby} STANDBY</span>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 7 }}>
          {prismResources.map(r => {
            const Icon = kindIcon(r.kind);
            const col = statusColor(r.status);
            return (
              <div key={r.id} style={{ background: "var(--bg-panel)", border: "1px solid var(--border)", borderLeft: `2px solid ${col}`, borderRadius: 3, padding: "7px 9px" }}>
                <div className="mono" style={{ fontSize: 9, color: "var(--text)", display: "flex", alignItems: "center", gap: 6, fontWeight: 700 }}>
                  <Icon size={12} style={{ color: col }} />
                  <span>{r.id}</span>
                  <span style={{ marginLeft: "auto", color: col, fontSize: 8, letterSpacing: "0.08em" }}>{statusLabel(r.status)}</span>
                </div>
                <div className="mono" style={{ fontSize: 9, color: "var(--text-dim)", marginTop: 2 }}>{r.mission ?? r.destination ?? "—"}</div>
                <div className="mono" style={{ fontSize: 8, color: "var(--text-faint)", marginTop: 2, display: "flex", justifyContent: "space-between" }}>
                  <span>→ {r.destination ?? "—"}</span>
                  <span>{r.speed ?? 0} km/h • ETA {r.etaMin ?? "—"} min</span>
                </div>
                <div style={{ height: 3, background: "var(--border)", borderRadius: 999, overflow: "hidden", marginTop: 4 }}>
                  <div style={{ width: `${Math.round(((r.progress ?? 0) * 100))}%`, height: "100%", background: col, transition: "width 0.3s linear" }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.4fr 0.9fr", gap: 10 }}>
        <div style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: 4, padding: 10 }}>
          <div className="mono" style={{ fontSize: 9, letterSpacing: "0.12em", color: "var(--text-muted)", marginBottom: 8 }}>EMERGENCY HELPLINES — GUWAHATI / ASSAM</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 7 }}>
            {helplines.map(h => (
              <div key={h.name} style={{ background: "var(--bg-panel)", border: "1px solid var(--border)", borderRadius: 3, padding: "7px 8px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span className="mono" style={{ fontSize: 9, color: "var(--text-muted)" }}>{h.name}</span>
                <span className="mono" style={{ fontSize: 11, fontWeight: 700, color: "var(--lime)" }}>{h.num}</span>
              </div>
            ))}
          </div>
          <div className="mono" style={{ fontSize: 8, color: "var(--text-faint)", marginTop: 8, textAlign: "center" }}>Source: DDMA / ASDMA public helplines • For display only in MVP • Backend: <span style={{ color: "var(--text-muted)" }}>GET /api/resources</span> will populate live.</div>
        </div>

        <div style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: 4, padding: 10 }}>
          <div className="mono" style={{ fontSize: 9, letterSpacing: "0.1em", color: "var(--lime)", fontWeight: 700 }}>OR-TOOLS INTEGRATION READY</div>
          <div className="mono" style={{ fontSize: 9, color: "var(--text-dim)", marginTop: 6, lineHeight: 1.45 }}>
            This inventory feeds the Response Plan (Left panel). When reports stream at <span style={{ color: "var(--lime)" }}>0.75s</span> emergency rate, the solver recomputes assignments last.<br /><br />
            <span style={{ color: "var(--text)" }}>API contracts:</span><br />
            <span style={{ color: "var(--cyan)" }}>GET /api/resources</span> → counts above<br />
            <span style={{ color: "var(--cyan)" }}>GET /api/incidents</span> → demand<br />
            <span style={{ color: "var(--cyan)" }}>WS /ws/live</span> → live deltas
          </div>
        </div>
      </div>

      <div className="mono" style={{ fontSize: 8, color: "var(--text-faint)", textAlign: "center", borderTop: "1px dashed var(--border)", paddingTop: 8 }}>
        Administration note: numbers are simulated for demo determinism. Replace with DDMA live feed at integration. All data local-first, no cloud dependency.
      </div>
    </div>
  );
}

export function ResourcesPage({ onClose, embedded = true }: { onClose: () => void; embedded?: boolean }) {
  if (!embedded) {
    return <div style={{ padding: 16, background: "transparent" }}><Inner onClose={onClose} /></div>;
  }
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }} transition={{ duration: 0.35 }} style={{ position: "absolute", inset: 0, zIndex: 30, background: "rgba(5,6,7,0.96)", backdropFilter: "blur(6px)", overflowY: "auto", padding: 16 }}>
      <Inner onClose={onClose} />
    </motion.div>
  );
}
