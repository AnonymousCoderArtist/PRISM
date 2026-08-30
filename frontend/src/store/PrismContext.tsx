import { createContext, useContext, useState, useMemo, useEffect, useRef } from "react";
import type { ReactNode } from "react";
import type { AppViewState, Report, Source } from "../types/prism";
import { mockIncidents, mockResources, mockReports, mockSources, simReportPool, simSourcePool, wardActivity, globalActivity } from "../data/mock";

type PrismContextValue = AppViewState & {
  selectWard: (code: number | null) => void;
  selectIncident: (id: string | null) => void;
  setMapMode: (m: AppViewState["mapMode"]) => void;
  setSimulationState: (s: AppViewState["simulationState"]) => void;
  selectedWardName: string | null;
  incidents: typeof mockIncidents;
  resources: typeof mockResources;
  reports: Report[];
  sources: Source[];
  activity: number[];
  // backend-ready API contract docs
  api: {
    reportsEndpoint: "GET /api/reports";
    incidentsEndpoint: "GET /api/incidents";
    resourcesEndpoint: "GET /api/resources";
    wsEndpoint: "WS /ws/live";
  };
};

const PrismContext = createContext<PrismContextValue | null>(null);

export function PrismProvider({ children }: { children: ReactNode }) {
  const [selectedWardCode, setSelectedWardCode] = useState<number | null>(null);
  const [selectedIncidentId, setSelectedIncidentId] = useState<string | null>(null);
  const [mapMode, setMapMode] = useState<AppViewState["mapMode"]>("wards");
  const [simulationState, setSimulationState] = useState<AppViewState["simulationState"]>("idle");

  const [reports, setReports] = useState<Report[]>(mockReports);
  const [sources, setSources] = useState<Source[]>(mockSources);
  const [activity, setActivity] = useState<number[]>(globalActivity);

  // tick counters for simulation pools
  const reportIdx = useRef(0);
  const sourceIdx = useRef(0);
  const simCounter = useRef(0);

  // update activity series when ward selected or ticking
  useEffect(() => {
    if (selectedWardCode && wardActivity[selectedWardCode]) {
      setActivity(wardActivity[selectedWardCode]);
    } else if (selectedWardCode) {
      // deterministic fallback per ward
      const seed = selectedWardCode % 40;
      const base = 14 + seed % 10;
      setActivity(Array.from({ length: 30 }, (_, i) => Math.max(1, base + Math.sin(i / 3) * 3 + (Math.random() - 0.5) * 4)));
    } else {
      setActivity(globalActivity);
    }
  }, [selectedWardCode]);

  // simulation loop: when running, push report+source every ~1.8s and wiggle activity
  useEffect(() => {
    if (simulationState !== "running") return;
    const id = setInterval(() => {
      const now = new Date();
      const timeStr = now.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: false });

      // push next report
      const rp = simReportPool[reportIdx.current % simReportPool.length];
      reportIdx.current += 1;
      const newReport: Report = {
        id: `RPT-SIM-${++simCounter.current}`,
        ...rp,
        time: timeStr,
        verified: Math.random() > 0.45,
      };
      setReports(prev => [newReport, ...prev].slice(0, 24));

      // push next source every ~2 ticks (~3.6s effective)
      if (simCounter.current % 2 === 0) {
        const sp = simSourcePool[sourceIdx.current % simSourcePool.length];
        sourceIdx.current += 1;
        const newSource: Source = {
          id: `SRC-SIM-${simCounter.current}`,
          ...sp,
          time: timeStr,
          confidence: 0.55 + Math.random() * 0.4,
        };
        setSources(prev => [newSource, ...prev].slice(0, 18));
      }

      // animate activity as live feed (shift and add jitter)
      setActivity(prev => {
        const next = prev.slice(1);
        const last = prev[prev.length - 1];
        // if ward is selected and is a void ward (69102), keep flatline
        if (selectedWardCode === 69102) {
          next.push(0.8 + Math.random() * 0.7);
        } else {
          const delta = (Math.random() - 0.42) * 5;
          next.push(Math.max(0.5, Math.round((last + delta) * 10) / 10));
        }
        return next;
      });
    }, 1800);
    return () => clearInterval(id);
  }, [simulationState, selectedWardCode]);

  // reset when idle
  useEffect(() => {
    if (simulationState === "idle") {
      reportIdx.current = 0;
      sourceIdx.current = 0;
      simCounter.current = 0;
      setReports(mockReports);
      setSources(mockSources);
    }
  }, [simulationState]);

  const value = useMemo<PrismContextValue>(() => ({
    selectedWardCode,
    selectedIncidentId,
    mapMode,
    simulationState,
    selectWard: setSelectedWardCode,
    selectIncident: setSelectedIncidentId,
    setMapMode,
    setSimulationState,
    selectedWardName: selectedWardCode ? mockIncidents.find(i => i.wardCode === selectedWardCode)?.wardName ?? `Ward ${selectedWardCode}` : null,
    incidents: mockIncidents,
    resources: mockResources,
    reports,
    sources,
    activity,
    api: {
      reportsEndpoint: "GET /api/reports",
      incidentsEndpoint: "GET /api/incidents",
      resourcesEndpoint: "GET /api/resources",
      wsEndpoint: "WS /ws/live",
    },
  }), [selectedWardCode, selectedIncidentId, mapMode, simulationState, reports, sources, activity]);

  return <PrismContext.Provider value={value}>{children}</PrismContext.Provider>;
}

export function usePrism() {
  const ctx = useContext(PrismContext);
  if (!ctx) throw new Error("usePrism must be inside PrismProvider");
  return ctx;
}
