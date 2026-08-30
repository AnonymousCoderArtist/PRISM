import { motion } from "framer-motion";
import { Activity, Clock3, Radio, MapPinned, Play, Pause, RotateCcw, Truck, Palette, Home } from "lucide-react";
import { useCurrentTime } from "../hooks/useCurrentTime";
import { usePrism } from "../store/PrismContext";
import { PrismLogo } from "./PrismLogo";

export function TopBar({ onOpenResources, view }: { onOpenResources?: () => void; view?: string }) {
  const { theme, toggleTheme } = usePrism();
  const now = useCurrentTime();
  const { simulationState, setSimulationState } = usePrism();

  return (
    <header className="prism-header" style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      background: "linear-gradient(90deg,#080A0B 0%, #0A0F0F 100%)",
      borderBottom: "1px solid var(--border)",
      borderTop: "1.5px solid rgba(204,255,0,0.35)",
      padding: "0 10px 0 14px",
      zIndex: 20,
      position: "relative",
    }}>
      <div style={{ position: "absolute", left: 0, right: 0, top: -1, height: 1, background: "linear-gradient(90deg, transparent, rgba(204,255,0,0.55), transparent)", opacity: 0.7, pointerEvents: "none" }} />
      {/* Left: Identity + Resources button on top of menu */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 36, height: 36, display: "grid", placeItems: "center", background: "rgba(204,255,0,0.08)", border: "1px solid rgba(204,255,0,0.2)", borderRadius: 4 }}>
            <PrismLogo size={26} />
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
              <span style={{ fontFamily: "var(--font-mono)", fontWeight: 800, letterSpacing: "0.14em", fontSize: 16, color: "var(--text)" }}>PRISM</span>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: 9, letterSpacing: "0.16em", color: "var(--text-muted)", borderLeft: "1px solid var(--border-strong)", paddingLeft: 8 }}>POST-DISASTER REALITY INTELLIGENCE</span>
            </div>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: 9, letterSpacing: "0.12em", color: "var(--text-faint)", marginTop: 1, display: "flex", alignItems: "center", gap: 6 }}>
              <MapPinned size={10} /> GUWAHATI — ASSAM — INDIA <span style={{ opacity: 0.4 }}>•</span> SITUATION MAPPING
            </div>
          </div>
        </div>

        <button
          onClick={onOpenResources}
          className="mono"
          style={{
            display: "inline-flex", alignItems: "center", gap: 6, padding: "6px 10px", borderRadius: 4, cursor: "pointer",
            background: view === "resources" ? "var(--lime)" : "rgba(204,255,0,0.08)",
            color: view === "resources" ? "#050607" : "var(--lime)",
            border: view === "resources" ? "1px solid var(--lime)" : "1px solid var(--lime-border)",
            fontSize: 10, fontWeight: 800, letterSpacing: "0.1em",
          }}
        >
          <Truck size={12} /> RESOURCES {view === "resources" ? "• OPEN" : ""}
        </button>

        <button onClick={toggleTheme} title="Toggle blue futuristic theme" className="mono" style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "6px 8px", borderRadius: 4, cursor: "pointer", background: theme === "blue" ? "rgba(56,189,248,0.14)" : "transparent", color: theme === "blue" ? "#38bdf8" : "var(--text-muted)", border: theme === "blue" ? "1px solid rgba(56,189,248,0.32)" : "1px solid var(--border)", fontSize: 9, fontWeight: 700 }}>
          <Palette size={11} /> {theme === "blue" ? "BLUE" : "LIME"}
        </button>

        <button onClick={() => window.scrollTo(0, 0)} title="Admin Home" className="mono" style={{ display: "grid", placeItems: "center", width: 28, height: 28, borderRadius: 4, background: "rgba(204,255,0,0.06)", border: "1px solid var(--border)", color: "var(--lime)", cursor: "pointer" }}>
          <Home size={12} />
        </button>

        <div style={{ width: 1, height: 28, background: "var(--border)", marginLeft: 4 }} />

        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{
            fontFamily: "var(--font-mono)", fontSize: 9, letterSpacing: "0.12em",
            color: "var(--lime)", background: "var(--lime-dim)", border: "1px solid var(--lime-border)",
            padding: "3px 7px", borderRadius: 2, display: "inline-flex", alignItems: "center", gap: 6,
          }}>
            <span style={{ width: 6, height: 6, borderRadius: 999, background: "var(--lime)", boxShadow: "0 0 8px rgba(204,255,0,0.7)", animation: "pulse 1.6s infinite" }} />
            SIM
          </span>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: 9, letterSpacing: "0.1em", color: "var(--text-muted)" }}>WARDS: 60 • LOCAL-FIRST</span>
        </div>
      </div>

      {/* Center: Camera breadcrumb */}
      <div style={{ display: "flex", alignItems: "center", gap: 6, fontFamily: "var(--font-mono)", fontSize: 10, letterSpacing: "0.1em", color: "var(--text-muted)" }}>
        <span style={{ color: "var(--text-dim)" }}>GLOBAL</span>
        <span style={{ opacity: 0.3 }}>→</span>
        <span style={{ color: "var(--text-dim)" }}>INDIA</span>
        <span style={{ opacity: 0.3 }}>→</span>
        <span style={{ color: "var(--text-dim)" }}>ASSAM</span>
        <span style={{ opacity: 0.3 }}>→</span>
        <motion.span
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          style={{ color: "var(--lime)", fontWeight: 700, background: "var(--lime-dim)", padding: "2px 6px", borderRadius: 2, border: "1px solid var(--lime-border)" }}
        >
          GUWAHATI
        </motion.span>
      </div>

      {/* Right: Sim controls + time + status */}
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, background: "var(--bg-panel)", border: "1px solid var(--border)", borderRadius: 4, padding: 3 }}>
          <button
            onClick={() => setSimulationState(simulationState === "running" ? "paused" : "running")}
            title={simulationState === "running" ? "Pause simulation" : "Start simulation"}
            style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              background: simulationState === "running" ? "var(--lime)" : "transparent",
              color: simulationState === "running" ? "#050607" : "var(--text-dim)",
              border: "1px solid transparent", borderRadius: 2,
              padding: "4px 10px", fontFamily: "var(--font-mono)", fontSize: 10, letterSpacing: "0.12em", fontWeight: 700,
              cursor: "pointer",
            }}
          >
            {simulationState === "running" ? <Pause size={12} /> : <Play size={12} />}
            {simulationState === "running" ? "PAUSE" : "SIMULATE"}
          </button>
          <button
            onClick={() => setSimulationState("idle")}
            title="Reset"
            style={{
              display: "grid", placeItems: "center", width: 28, height: 24,
              background: "transparent", border: "1px solid var(--border)", borderRadius: 2,
              color: "var(--text-muted)", cursor: "pointer",
            }}
          >
            <RotateCcw size={12} />
          </button>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8, fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--text-dim)", borderLeft: "1px solid var(--border)", paddingLeft: 10 }}>
          <Clock3 size={14} style={{ opacity: 0.7 }} />
          <span style={{ color: "var(--text)", letterSpacing: "0.06em" }}>{now.toLocaleTimeString("en-IN", { hour12: false })} IST</span>
          <span style={{ color: "var(--text-faint)" }}>{now.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 6, borderLeft: "1px solid var(--border)", paddingLeft: 10 }}>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, letterSpacing: "0.12em", color: "var(--green)", display: "inline-flex", alignItems: "center", gap: 6 }}>
            <Radio size={12} /> LIVE
          </span>
          <Activity size={14} style={{ color: "var(--green)" }} />
        </div>
      </div>
    </header>
  );
}
