import { motion } from "framer-motion";
import { Siren, Radio, AlertTriangle } from "lucide-react";
import { usePrism } from "../store/PrismContext";

export function EmergencyBanner() {
  const { simulationState, planPhase } = usePrism();
  const active = simulationState === "running" && (planPhase === "collecting" || planPhase === "verifying" || planPhase === "optimizing" || planPhase === "connecting");
  if (!active) return null;
  return (
    <motion.div
      initial={{ y: -22, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: -22, opacity: 0 }}
      transition={{ duration: 0.45, ease: "easeOut" }}
      style={{
        position: "absolute", top: 0, left: 0, right: 0, zIndex: 8, pointerEvents: "none",
        background: "linear-gradient(90deg, rgba(255,77,77,0.96), rgba(185,0,0,0.96))",
        borderBottom: "1.5px solid #ff6b6b",
        display: "flex", alignItems: "center", justifyContent: "center", gap: 14,
        padding: "5px 10px",
        boxShadow: "0 6px 24px rgba(255,77,77,0.45)",
      }}
    >
      <motion.span animate={{ opacity: [1, 0.35, 1] }} transition={{ duration: 0.6, repeat: Infinity }} style={{ width: 8, height: 8, borderRadius: 999, background: "#fff", boxShadow: "0 0 10px #fff" }} />
      <Siren size={14} style={{ color: "#fff" }} />
      <span className="mono" style={{ fontSize: 11, letterSpacing: "0.18em", fontWeight: 800, color: "#fff" }}>
        EMERGENCY — EMERGENCY — GUWAHATI DISASTER RESPONSE ACTIVE
      </span>
      <AlertTriangle size={14} style={{ color: "#fff" }} />
      <span className="mono" style={{ fontSize: 9, letterSpacing: "0.12em", color: "rgba(255,255,255,0.92)", background: "rgba(0,0,0,0.22)", padding: "2px 7px", borderRadius: 2, display: "inline-flex", alignItems: "center", gap: 6 }}>
        <Radio size={10} /> WS /ws/live — BURST 0.75s
      </span>
      <motion.span animate={{ scale: [1, 1.08, 1] }} transition={{ duration: 0.55, repeat: Infinity }} className="mono" style={{ fontSize: 9, background: "#fff", color: "#b80000", padding: "2px 7px", borderRadius: 2, fontWeight: 800 }}>
        LIVE
      </motion.span>
    </motion.div>
  );
}
