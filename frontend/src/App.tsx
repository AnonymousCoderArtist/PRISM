import { useState, useEffect } from "react";
import gsap from "gsap";
import { TopBar } from "./components/TopBar";
import { LeftPanel } from "./components/LeftPanel";
import { RightPanel } from "./components/RightPanel";
import { BottomPanel } from "./components/BottomPanel";
import { MapView } from "./components/MapView";
import { ResourcesPage } from "./components/ResourcesPage";
import { PrismProvider } from "./store/PrismContext";

import { usePrism } from "./store/PrismContext";
import { DotPattern } from "@/components/ui/dot-pattern-1";
import { GridLines } from "./components/GridLines";

function DashboardShell({ onOpenResources, view }: { onOpenResources: () => void; view: string }) {
  const { simulationState, planPhase } = usePrism();
  const isEmergency = simulationState === "running" && (planPhase === "connecting" || planPhase === "collecting" || planPhase === "verifying" || planPhase === "optimizing");
  const isReady = planPhase === "ready";

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from(".prism-header", { y: -18, opacity: 0, duration: 0.55, ease: "power3.out" });
      gsap.from(".hero-heading", { y: 18, opacity: 0, duration: 0.7, ease: "power3.out", delay: 0.1 });
      gsap.from(".prism-left", { x: -22, opacity: 0, duration: 0.6, ease: "power3.out", delay: 0.16 });
      gsap.from(".prism-right", { x: 22, opacity: 0, duration: 0.6, ease: "power3.out", delay: 0.20 });
      gsap.from(".prism-map", { scale: 0.985, opacity: 0, duration: 0.7, ease: "power3.out", delay: 0.24 });
      gsap.from(".prism-bottom", { y: 18, opacity: 0, duration: 0.55, ease: "power3.out", delay: 0.28 });
    });
    return () => ctx.revert();
  }, []);

  return (
    <section className={`relative w-full h-screen overflow-hidden bg-black ${isEmergency ? "emergency-active" : ""} ${isReady ? "dispatch-ready" : ""}`}>
      {/* Swiss editorial backdrop */}
      <GridLines />
      <DotPattern width={18} height={18} cr={0.9} className="fill-[rgba(255,255,255,0.04)] opacity-40" />

      {/* Top nav — Swiss spacing px-5 md:px-[35px] */}
      <div className="relative z-10">
        <TopBar onOpenResources={onOpenResources} view={view} />
      </div>

      {/* Editorial heading — LŪMEN hero: Graphik for H1, Manrope for UI */}
      <div className="hero-heading relative z-10 px-5 md:px-[35px] py-3 md:py-4 border-b border-white/[0.04] flex items-end justify-between gap-6">
        <div className="min-w-0">
          <div className="font-graphik font-bold tracking-[0.08em] text-white text-[11px] md:text-[12px] leading-none flex items-center gap-3">
            <span className="inline-block h-px w-6 bg-[#CCFF00]/60" />
            LŪMEN // ÍNDEX
            <span className="font-manrope font-normal tracking-[0.14em] text-white/50 text-[9px]">PRISM — SITUATION MAPPING</span>
          </div>
          <h1 className="font-graphik font-[700] tracking-[-0.03em] leading-[0.9] text-white text-[28px] md:text-[42px] mt-2">
            GUWAHATI <span className="font-light tracking-[-0.02em] text-white/80">OPERATIONS</span>
            <span className="align-super font-manrope font-bold text-[10px] tracking-[0.16em] text-[#AFDDFF]/80 ml-2">26.14°N 91.73°E</span>
          </h1>
          <p className="font-manrope text-[10px] tracking-[0.10em] text-white/45 mt-1.5">LOCAL-FIRST • 60 WARDS • POST-DISASTER REALITY INTELLIGENCE • PMTILES + GEOJSON LIVE</p>
        </div>
        <div className="hidden md:flex items-stretch gap-2 font-manrope">
          <div className="px-3 py-2 border border-white/10 bg-white/[0.02] backdrop-blur">
            <div className="text-[8px] tracking-[0.14em] text-white/40">PHASE</div>
            <div className="text-[11px] font-bold tracking-[0.10em] text-[#CCFF00]">{planPhase.toUpperCase()}</div>
          </div>
          <div className="px-3 py-2 border border-white/10 bg-white/[0.02] backdrop-blur">
            <div className="text-[8px] tracking-[0.14em] text-white/40">SIM</div>
            <div className="text-[11px] font-bold tracking-[0.10em] text-white">{simulationState.toUpperCase()}</div>
          </div>
          <div className="px-3 py-2 border border-white/80 bg-black/40 backdrop-blur">
            <div className="text-[8px] tracking-[0.14em] text-white/50">GRID</div>
            <div className="text-[11px] font-bold tracking-[0.10em] text-[#AFDDFF]/80">12-COL • 20/35</div>
          </div>
        </div>
      </div>

      {/* Main dashboard grid — inset with Swiss outer */}
      <div className="prism-app">
        <LeftPanel />
        <div className="prism-map panel" style={{ borderLeft: "1px solid rgba(255,255,255,0.08)", borderRight: "1px solid rgba(255,255,255,0.08)" }}>
          <MapView />
        </div>
        <RightPanel />
        <BottomPanel />
      </div>

      {/* Bottom row editorial — Swiss spacing */}
      <div className="hidden md:flex relative z-10 px-5 md:px-[35px] h-6 items-center justify-between border-t border-white/[0.04] bg-black/70 backdrop-blur font-manrope text-[8px] tracking-[0.12em] text-white/30">
        <span>OPENSTREETMAP © OSM CONTRIBUTORS • LOCAL PMTILES • NO CLOUD MAP DEPENDENCY</span>
        <span className="text-[#AFDDFF]/70">ED. 26.08 // GUWAHATI — ASSAM — INDIA → SCALE 1:18 000</span>
      </div>
    </section>
  );
}

function Shell() {
  const [view, setView] = useState<"dashboard" | "resources">("dashboard");

  if (view === "resources") {
    return (
      <div style={{ height: "100vh", display: "flex", flexDirection: "column", background: "#000" }}>
        <GridLines />
        <TopBar onOpenResources={() => setView("dashboard")} view={view} />
        <div style={{ flex: 1, overflowY: "auto", background: "#000", position: "relative", zIndex: 1 }}>
          <ResourcesPage onClose={() => setView("dashboard")} embedded={false} />
        </div>
      </div>
    );
  }

  return <DashboardShell onOpenResources={() => setView("resources")} view={view} />;
}

export default function App() {
  return (
    <PrismProvider>
      <Shell />
    </PrismProvider>
  );
}
