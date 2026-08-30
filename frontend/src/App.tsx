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

function DashboardShell() {
  const { simulationState, planPhase } = usePrism();
  const isEmergency = simulationState === "running" && (planPhase === "connecting" || planPhase === "collecting" || planPhase === "verifying" || planPhase === "optimizing");
  const isReady = planPhase === "ready";

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from(".prism-header", { y: -18, opacity: 0, duration: 0.55, ease: "power3.out" });
      gsap.from(".prism-left", { x: -22, opacity: 0, duration: 0.6, ease: "power3.out", delay: 0.08 });
      gsap.from(".prism-right", { x: 22, opacity: 0, duration: 0.6, ease: "power3.out", delay: 0.12 });
      gsap.from(".prism-map", { scale: 0.98, opacity: 0, duration: 0.7, ease: "power3.out", delay: 0.16 });
      gsap.from(".prism-bottom", { y: 18, opacity: 0, duration: 0.55, ease: "power3.out", delay: 0.2 });
    });
    return () => ctx.revert();
  }, []);

  return (
    <div className={`prism-app ${isEmergency ? "emergency-active" : ""} ${isReady ? "dispatch-ready" : ""}`} style={{ position: "relative" }}>
      <DotPattern width={18} height={18} cr={0.9} className="fill-[rgba(204,255,0,0.08)] opacity-40" />
      <TopBar />
      <LeftPanel />
      <div className="prism-map panel" style={{ borderLeft: "1px solid var(--border)", borderRight: "1px solid var(--border)" }}>
        <MapView />
      </div>
      <RightPanel />
      <BottomPanel />
    </div>
  );
}

function Shell() {
  const [view, setView] = useState<"dashboard" | "resources">("dashboard");

  if (view === "resources") {
    return (
      <div style={{ height: "100vh", display: "flex", flexDirection: "column", background: "var(--bg)" }}>
        <TopBar />
        <div style={{ flex: 1, overflowY: "auto", background: "var(--bg)" }}>
          <ResourcesPage onClose={() => setView("dashboard")} embedded={false} />
        </div>
      </div>
    );
  }

  return <DashboardShell />;
}

export default function App() {
  return (
    <PrismProvider>
      <Shell />
    </PrismProvider>
  );
}
