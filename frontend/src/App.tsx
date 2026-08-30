import { useState } from "react";
import { TopBar } from "./components/TopBar";
import { LeftPanel } from "./components/LeftPanel";
import { RightPanel } from "./components/RightPanel";
import { BottomPanel } from "./components/BottomPanel";
import { MapView } from "./components/MapView";
import { ResourcesPage } from "./components/ResourcesPage";
import { PrismProvider } from "./store/PrismContext";

function DashboardShell({ onOpenResources, view }: { onOpenResources: () => void; view: string }) {
  return (
    <div className="prism-app" style={{ position: "relative" }}>
      <TopBar onOpenResources={onOpenResources} view={view} />
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
        <TopBar onOpenResources={() => setView("dashboard")} view={view} />
        <div style={{ flex: 1, overflowY: "auto", background: "var(--bg)" }}>
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
