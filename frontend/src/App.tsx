import { TopBar } from "./components/TopBar";
import { LeftPanel } from "./components/LeftPanel";
import { RightPanel } from "./components/RightPanel";
import { BottomPanel } from "./components/BottomPanel";
import { MapView } from "./components/MapView";
import { PrismProvider } from "./store/PrismContext";

function Shell() {
  return (
    <div className="prism-app">
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

export default function App() {
  return (
    <PrismProvider>
      <Shell />
    </PrismProvider>
  );
}
