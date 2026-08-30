import { useState } from "react";
import { AnimatePresence } from "framer-motion";
import { TopBar } from "./components/TopBar";
import { LeftPanel } from "./components/LeftPanel";
import { RightPanel } from "./components/RightPanel";
import { BottomPanel } from "./components/BottomPanel";
import { MapView } from "./components/MapView";
import { ResourcesPage } from "./components/ResourcesPage";
import { PrismProvider } from "./store/PrismContext";

function Shell() {
  const [view, setView] = useState<"dashboard" | "resources">("dashboard");

  return (
    <div className="prism-app" style={{ position: "relative" }}>
      <TopBar onOpenResources={() => setView(v => v === "resources" ? "dashboard" : "resources")} view={view} />
      <LeftPanel />
      <div className="prism-map panel" style={{ borderLeft: "1px solid var(--border)", borderRight: "1px solid var(--border)" }}>
        <MapView />
        <AnimatePresence>
          {view === "resources" && <ResourcesPage onClose={() => setView("dashboard")} />}
        </AnimatePresence>
      </div>
      <RightPanel />
      <BottomPanel />
    </div>
  );
}

export default function App() {
  return (
    <PrismProvider>
      <Shell />
    </PrismProvider>
  );
}
