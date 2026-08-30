import { motion } from "framer-motion";
import { Ambulance, Truck, Shield, Building2, Utensils, Fuel, Users, BedDouble, HeartPulse, X } from "lucide-react";

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

export function ResourcesPage({ onClose }: { onClose: () => void }) {
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }} transition={{ duration: 0.35 }} style={{ position: "absolute", inset: 0, zIndex: 30, background: "rgba(5,6,7,0.96)", backdropFilter: "blur(6px)", overflowY: "auto", padding: 16 }}>
      <div style={{ maxWidth: 1100, margin: "0 auto", display: "flex", flexDirection: "column", gap: 12 }}>
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

          <div style={{ background: "linear-gradient(180deg, rgba(204,255,0,0.06), transparent), var(--bg-elevated)", border: "1px solid var(--lime-border)", borderRadius: 4, padding: 10 }}>
            <div className="mono" style={{ fontSize: 9, letterSpacing: "0.1em", color: "var(--lime)", fontWeight: 700 }}>OR-TOOLS INTEGRATION READY</div>
            <div className="mono" style={{ fontSize: 9, color: "var(--text-dim)", marginTop: 6, lineHeight: 1.45 }}>
              This inventory feeds the Response Plan (Left panel). When reports stream at <span style={{ color: "var(--lime)" }}>0.9s</span> emergency rate, the solver recomputes assignments last.<br /><br />
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
    </motion.div>
  );
}
