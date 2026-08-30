import { motion } from "framer-motion";
import { Activity, Clock3, Radio, MapPinned, Play, Pause, RotateCcw, Truck, Home, Route } from "lucide-react";
import { useCurrentTime } from "../hooks/useCurrentTime";
import { usePrism } from "../store/PrismContext";
import { PrismLogo } from "./PrismLogo";

export function TopBar({ onOpenResources, view }: { onOpenResources?: () => void; view?: string }) {
  const now = useCurrentTime();
  const { simulationState, setSimulationState } = usePrism();

  return (
    <header className="prism-header font-manrope flex items-center justify-between px-5 md:px-[35px] h-[52px]" style={{
      background: "linear-gradient(90deg,#080A0B 0%, #0A0F0F 100%)",
      borderBottom: "1px solid rgba(255,255,255,0.04)",
      borderTop: "1px solid rgba(255,255,255,0.80)",
      zIndex: 20,
      position: "relative",
      overflow: "hidden",
    }}>
      {/* Swiss grid hairline accent — top lime + Swiss accent numbers */}
      <div style={{ position: "absolute", left: 0, right: 0, top: -1, height: 1, background: "linear-gradient(90deg, transparent, rgba(204,255,0,0.55), transparent)", opacity: 0.7, pointerEvents: "none" }} />
      <div className="absolute inset-0 pointer-events-none opacity-[0.02]" style={{ backgroundImage: "radial-gradient(rgba(255,255,255,0.9) 1px, transparent 1px)", backgroundSize: "18px 18px" }} />
      {/* Left: Identity + Resources */}
      <div className="flex items-center gap-3 min-w-0">
        <div className="flex items-center gap-2.5">
          <div className="shadow-[0_2px_10px_rgba(204,255,0,0.12),0_1px_2px_rgba(0,0,0,0.6)] w-9 h-9 grid place-items-center bg-[rgba(204,255,0,0.08)] border border-[rgba(204,255,0,0.2)] rounded-[4px]">
            <PrismLogo size={22} />
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <span className="font-graphik font-extrabold tracking-[0.14em] text-[15px] text-white">PRISM</span>
              <span className="hidden lg:inline font-manrope text-[9px] tracking-[0.16em] text-white/45 border-l border-white/10 pl-2">POST-DISASTER REALITY INTELLIGENCE</span>
              <span className="hidden xl:inline font-manrope text-[8px] tracking-[0.12em] text-[#AFDDFF]/80 ml-1">01</span>
            </div>
            <div className="font-manrope text-[9px] tracking-[0.12em] text-white/30 flex items-center gap-1.5 mt-0.5">
              <MapPinned size={10} className="text-white/25" /> GUWAHATI — ASSAM — INDIA <span className="opacity-20">•</span> SITUATION MAPPING
            </div>
          </div>
        </div>

        <button
          onClick={onOpenResources}
          className="mono inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-[4px] cursor-pointer text-[10px] font-extrabold tracking-[0.1em] border"
          style={{
            background: view === "resources" ? "var(--lime)" : "rgba(204,255,0,0.08)",
            color: view === "resources" ? "#050607" : "var(--lime)",
            borderColor: view === "resources" ? "var(--lime)" : "var(--lime-border)",
          }}
        >
          <Truck size={12} /> RESOURCES {view === "resources" ? "• OPEN" : ""}
        </button>

        <button onClick={() => window.scrollTo(0, 0)} title="Admin Home" className="mono grid place-items-center w-7 h-7 rounded-[4px] bg-white/[0.04] border border-white/10 text-[#CCFF00] cursor-pointer">
          <Home size={12} />
        </button>

        <div className="w-px h-7 bg-white/[0.06] ml-1 hidden sm:block" />

        <div className="hidden md:flex items-center gap-2">
          <span className="font-manrope text-[9px] tracking-[0.12em] text-[#CCFF00] bg-[rgba(204,255,0,0.08)] border border-[rgba(204,255,0,0.18)] px-1.5 py-1 rounded-[2px] inline-flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#CCFF00] shadow-[0_0_8px_rgba(204,255,0,0.7)] animate-pulse" />
            SIM
          </span>
          <span className="font-manrope text-[9px] tracking-[0.1em] text-white/40">WARDS: 60 • LOCAL-FIRST</span>
          <span className="font-manrope text-[8px] tracking-[0.12em] text-[#AFDDFF]/80 hidden xl:inline">02</span>
        </div>
      </div>

      {/* Center: breadcrumb — Swiss numbers in #AFDDFF 80% */}
      <div className="hidden lg:flex items-center gap-1.5 font-manrope text-[10px] tracking-[0.1em] text-white/40">
        <span className="text-white/60">GLOBAL</span>
        <span className="opacity-20">→</span>
        <span className="text-white/60">INDIA</span>
        <span className="opacity-20">→</span>
        <span className="text-white/60">ASSAM</span>
        <span className="opacity-20">→</span>
        <motion.span
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="text-[#CCFF00] font-bold bg-[rgba(204,255,0,0.08)] px-1.5 py-0.5 rounded-[2px] border border-[rgba(204,255,0,0.18)]"
        >
          GUWAHATI
        </motion.span>
        <span className="text-[#AFDDFF]/80 text-[9px] ml-1">03</span>
      </div>

      {/* Right */}
      <div className="flex items-center gap-2.5">
        <div className="flex items-center gap-1.5 bg-[#0A0D0F] border border-white/[0.06] rounded-[4px] p-0.5">
          <button
            onClick={() => setSimulationState(simulationState === "running" ? "paused" : "running")}
            title={simulationState === "running" ? "Pause simulation" : "Start simulation"}
            className="inline-flex items-center gap-1.5 rounded-[2px] px-2.5 py-1 font-manrope text-[10px] tracking-[0.12em] font-bold cursor-pointer border border-transparent"
            style={{
              background: simulationState === "running" ? "var(--lime)" : "transparent",
              color: simulationState === "running" ? "#050607" : "rgba(232,236,235,0.7)",
            }}
          >
            {simulationState === "running" ? <Pause size={12} /> : <Play size={12} />}
            {simulationState === "running" ? "PAUSE" : "SIMULATE"}
          </button>
          <button
            onClick={() => setSimulationState("idle")}
            title="Reset"
            className="grid place-items-center w-7 h-6 bg-transparent border border-white/10 rounded-[2px] text-white/40 cursor-pointer"
          >
            <RotateCcw size={12} />
          </button>
        </div>

        <div className="hidden md:flex items-center gap-2 font-manrope text-[11px] text-white/60 border-l border-white/[0.06] pl-2.5">
          <Clock3 size={14} className="opacity-60" />
          <span className="text-white tracking-[0.06em]">{now.toLocaleTimeString("en-IN", { hour12: false })} IST</span>
          <span className="text-white/25 hidden xl:inline">{now.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</span>
        </div>

        <div className="flex items-center gap-1.5 border-l border-white/[0.06] pl-2.5">
          <span className="hidden sm:inline-flex font-manrope text-[10px] tracking-[0.12em] text-[#46E09B] items-center gap-1">
            <Radio size={12} /> LIVE
          </span>
          <Activity size={14} className="text-[#46E09B] hidden xl:inline" />
          <img
            src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop&crop=face&auto=format"
            alt="Operator"
            className="h-7 w-7 rounded-full object-cover border border-[rgba(204,255,0,0.22)] shadow-[0_2px_8px_rgba(0,0,0,0.5),0_0_0_1px_rgba(204,255,0,0.15)]"
            style={{ objectFit: "cover", width: "28px", height: "28px" }}
          />
          <span className="hidden md:inline-flex items-center justify-center h-7 w-7 rounded-full bg-[rgba(204,255,0,0.08)] border border-[rgba(204,255,0,0.18)] shadow-[0_2px_8px_rgba(0,0,0,0.4)]" title="Path data">
            <Route size={12} className="text-[#CCFF00]" />
          </span>
        </div>
      </div>
    </header>
  );
}
