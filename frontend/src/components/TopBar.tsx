import { Clock3, Radio, MapPinned, Play, Pause, RotateCcw } from "lucide-react";
import { useCurrentTime } from "../hooks/useCurrentTime";
import { usePrism } from "../store/PrismContext";
import { PrismLogo } from "./PrismLogo";

export function TopBar() {
  const now = useCurrentTime();
  const { simulationState, setSimulationState } = usePrism();

  return (
    <header className="prism-header" style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      background: "var(--bg-panel)",
      borderBottom: "1px solid var(--border)",
      padding: "0 10px 0 14px",
      zIndex: 20,
      position: "relative",
    }}>
      {/* Left: identity */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
        <div style={{ width: 32, height: 32, display: "grid", placeItems: "center", border: "1px solid var(--border)", borderRadius: 3 }}>
          <PrismLogo size={22} />
        </div>
        <div>
          <div style={{ fontFamily: "var(--font-mono)", fontWeight: 800, letterSpacing: "0.14em", fontSize: 14, color: "var(--text)" }}>PRISM</div>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: 9, letterSpacing: "0.12em", color: "var(--text-faint)", marginTop: 1, display: "flex", alignItems: "center", gap: 6 }}>
            <MapPinned size={10} /> GUWAHATI — ASSAM — INDIA
          </div>
        </div>
      </div>

      {/* Center: current view */}
      <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, letterSpacing: "0.1em", color: "var(--text-muted)" }}>
        <span style={{ color: "var(--text)" }}>GUWAHATI</span>
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
        </div>
      </div>
    </header>
  );
}
