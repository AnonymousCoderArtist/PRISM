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
        background: "var(--red)",
        borderBottom: "2px solid var(--ink)",
        display: "flex", alignItems: "center", justifyContent: "center", gap: 14,
        padding: "6px 14px",
      }}
    >
      <motion.span animate={{ opacity: [1, 0.4, 1] }} transition={{ duration: 0.6, repeat: Infinity }} style={{ width: 8, height: 8, background: "#fff" }} />
      <Siren size={14} style={{ color: "#fff" }} />
      <span className="mono" style={{ fontSize: 11, letterSpacing: "0.20em", fontWeight: 700, color: "#fff" }}>
        EMERGENCY — DISASTER RESPONSE ACTIVE
      </span>
      <AlertTriangle size={14} style={{ color: "#fff" }} />
      <span className="mono" style={{ fontSize: 9, letterSpacing: "0.12em", color: "#fff", border: "1px solid #fff", padding: "2px 7px", display: "inline-flex", alignItems: "center", gap: 6 }}>
        <Radio size={10} /> WS /ws/live — BURST 0.75s
      </span>
      <span className="mono" style={{ fontSize: 9, background: "#fff", color: "var(--red)", padding: "2px 7px", fontWeight: 700 }}>
        LIVE
      </span>
    </motion.div>
  );
}
