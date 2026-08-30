import { motion } from "framer-motion";
import { Activity, Clock3, Radio, MapPinned, Play, Pause, RotateCcw, Truck, Home, Route } from "lucide-react";
import { useCurrentTime } from "../hooks/useCurrentTime";
import { usePrism } from "../store/PrismContext";
import { PrismLogo } from "./PrismLogo";

export function TopBar({ onOpenResources, view }: { onOpenResources?: () => void; view?: string }) {
  const now = useCurrentTime();
  const { simulationState, setSimulationState } = usePrism();

  return (
    <header className="prism-header" style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      background: "var(--bg)",
      borderBottom: "1.5px solid var(--ink)",
      borderTop: "1.5px solid var(--ink)",
      padding: "0 14px",
      zIndex: 20,
      position: "relative",
      overflow: "hidden",
    }}>
      {/* Left: Identity + Resources button on top of menu */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 36, height: 36, display: "grid", placeItems: "center", background: "var(--ink)", borderRadius: 0 }}>
            <PrismLogo size={26} />
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
              <span style={{ fontFamily: "var(--font-serif)", fontWeight: 900, letterSpacing: "0.02em", fontSize: 22, color: "var(--ink)" }}>PRISM</span>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: 9, letterSpacing: "0.16em", color: "var(--text-muted)", borderLeft: "1px solid var(--border)", paddingLeft: 8 }}>POST-DISASTER REALITY INTELLIGENCE</span>
            </div>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: 9, letterSpacing: "0.12em", color: "var(--text-muted)", marginTop: 1, display: "flex", alignItems: "center", gap: 6 }}>
              <MapPinned size={10} /> GUWAHATI — ASSAM — INDIA <span style={{ opacity: 0.4 }}>•</span> SITUATION MAPPING
            </div>
          </div>
        </div>

        <button
          onClick={onOpenResources}
          className="mono"
          style={{
            display: "inline-flex", alignItems: "center", gap: 6, padding: "6px 12px", cursor: "pointer",
            background: view === "resources" ? "var(--ink)" : "transparent",
            color: view === "resources" ? "var(--paper)" : "var(--ink)",
            border: "1px solid var(--ink)",
            fontSize: 10, fontWeight: 700, letterSpacing: "0.12em",
          }}
        >
          <Truck size={12} /> RESOURCES {view === "resources" ? "• OPEN" : ""}
        </button>

        <button onClick={() => window.scrollTo(0, 0)} title="Admin Home" className="mono" style={{ display: "grid", placeItems: "center", width: 32, height: 32, background: "transparent", border: "1px solid var(--ink)", color: "var(--ink)", cursor: "pointer" }}>
          <Home size={12} />
        </button>

        <div style={{ width: 1, height: 28, background: "var(--border)", marginLeft: 4 }} />

        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{
            fontFamily: "var(--font-mono)", fontSize: 9, letterSpacing: "0.12em",
            color: "var(--paper)", background: "var(--ink)", border: "1px solid var(--ink)",
            padding: "4px 8px", display: "inline-flex", alignItems: "center", gap: 6,
          }}>
            <span style={{ width: 6, height: 6, background: "var(--paper)" }} />
            SIM
          </span>
          {simulationState === "running" ? (
            <span title="Live AI inference consuming tokens" style={{
              fontFamily: "var(--font-mono)", fontSize: 9, letterSpacing: "0.12em",
              color: "var(--paper)", background: "var(--green)", border: "1px solid var(--green)",
              padding: "4px 8px", display: "inline-flex", alignItems: "center", gap: 6,
            }}>
              <span style={{ width: 6, height: 6, background: "var(--paper)" }} />
              AI LIVE
            </span>
          ) : (
            <span title="Precomputed AI results, zero tokens consumed" style={{
              fontFamily: "var(--font-mono)", fontSize: 9, letterSpacing: "0.12em",
              color: "var(--ink)", background: "var(--bg-elevated)", border: "1px solid var(--ink)",
              padding: "4px 8px", display: "inline-flex", alignItems: "center", gap: 6,
            }}>
              <span style={{ width: 6, height: 6, background: "var(--ink)" }} />
              AI PRECOMPUTED
            </span>
          )}
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
          <img
            src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop&crop=face&auto=format"
            alt="Operator"
            className="h-7 w-7 rounded-full object-cover border border-[rgba(204,255,0,0.22)] shadow-[0_2px_8px_rgba(0,0,0,0.5),0_0_0_1px_rgba(204,255,0,0.15)]"
            style={{ objectFit: "cover", width: "28px", height: "28px" }}
          />
          <span className="hidden md:inline-flex items-center justify-center h-7 w-7 rounded-full bg-[rgba(204,255,0,0.08)] border border-[rgba(204,255,0,0.18)] shadow-[0_2px_8px_rgba(0,0,0,0.4)]" title="Path data">
            <Route size={12} style={{ color: "var(--lime)" }} />
          </span>
        </div>
      </div>
    </header>
  );
}
