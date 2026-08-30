import { createContext, useContext, useState, useMemo, useEffect, useRef } from "react";
import type { ReactNode } from "react";
import type { AppViewState, Report, Source } from "../types/prism";
import { mockIncidents, mockResources, mockReports, mockSources, simReportPool, simSourcePool, wardActivity, globalActivity } from "../data/mock";

type PlanAssignment = {
  id: string;
  to: string;
  eta: string;
  status: string;
  color: string;
  resId: string;
};

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
  plan: PlanAssignment[];
  planReady: boolean;
  planPhase: "idle" | "collecting" | "optimizing" | "ready";
  api: {
    reportsEndpoint: "GET /api/reports";
    incidentsEndpoint: "GET /api/incidents";
    resourcesEndpoint: "GET /api/resources";
    wsEndpoint: "WS /ws/live";
  };
};

const PrismContext = createContext<PrismContextValue | null>(null);

const FULL_PLAN: PlanAssignment[] = [
  { id: "ROUTE-01", to: "MED → Ward 1 (Bharalu)", eta: "12 min • 3.4 km", status: "ASSIGNED", color: "var(--green)", resId: mockResources[0].id },
  { id: "ROUTE-02", to: "RESCUE → Ward 42 (Pandu)", eta: "18 min • 5.1 km", status: "EN ROUTE", color: "var(--amber)", resId: mockResources[2].id },
  { id: "ROUTE-03", to: "FOOD → Ward 26 (Fatasil)", eta: "09 min • 2.1 km", status: "STANDBY", color: "var(--text-muted)", resId: mockResources[1].id },
];

export function PrismProvider({ children }: { children: ReactNode }) {
  const [selectedWardCode, setSelectedWardCode] = useState<number | null>(null);
  const [selectedIncidentId, setSelectedIncidentId] = useState<string | null>(null);
  const [mapMode, setMapMode] = useState<AppViewState["mapMode"]>("wards");
  const [simulationState, setSimulationState] = useState<AppViewState["simulationState"]>("idle");

  // Sequential mode: start empty, reports stream first, plan generates last
  const [reports, setReports] = useState<Report[]>(mockReports.slice(0, 1)); // 1 seed report at idle
  const [sources, setSources] = useState<Source[]>(mockSources.slice(0, 1));
  const [activity, setActivity] = useState<number[]>(globalActivity);
  const [plan, setPlan] = useState<PlanAssignment[]>([]);
  const [planPhase, setPlanPhase] = useState<PrismContextValue["planPhase"]>("idle");

  const reportIdx = useRef(0);
  const sourceIdx = useRef(0);
  const simCounter = useRef(0);

  // ---- Activity always ongoing ----
  // Base activity driver ticks even when NOT simulating, with ward-aware behavior.
  // When simulating, reports/sources intervine and also nudge activity.
  useEffect(() => {
    // initialize activity for selected ward
    if (selectedWardCode && wardActivity[selectedWardCode]) {
      setActivity(wardActivity[selectedWardCode].slice());
    } else if (selectedWardCode) {
      const seed = selectedWardCode % 40;
      const base = 14 + seed % 10;
      setActivity(Array.from({ length: 30 }, (_, i) => Math.max(1, base + Math.sin(i / 3) * 3 + (Math.random() - 0.5) * 4)));
    } else {
      setActivity(globalActivity.slice());
    }
  }, [selectedWardCode]);

  // Always-on heartbeat: small drift every 2s even at idle, ward-specific.
  useEffect(() => {
    const id = setInterval(() => {
      setActivity(prev => {
        const next = prev.slice(1);
        const last = prev[prev.length - 1];
        if (selectedWardCode === 69102) {
          // void ward stays flat
          next.push(0.9 + Math.random() * 0.6);
        } else if (selectedWardCode) {
          const delta = (Math.random() - 0.5) * 2.2;
          next.push(Math.max(0.8, Math.round((last + delta) * 10) / 10));
        } else {
          const delta = (Math.random() - 0.48) * 2.6;
          next.push(Math.max(0.8, Math.round((last + delta) * 10) / 10));
        }
        return next;
      });
    }, 2100);
    return () => clearInterval(id);
  }, [selectedWardCode]);

  // Simulation loop: reports stream first, plan generated LAST (sequential)
  useEffect(() => {
    if (simulationState !== "running") {
      if (simulationState === "idle") {
        setPlanPhase("idle");
      } else if (simulationState === "paused") {
        // keep phase as is
      }
      return;
    }
    // on transition to running, ensure plan is reset to collecting
    setPlanPhase("collecting");
    const id = setInterval(() => {
      const now = new Date();
      const timeStr = now.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: false });

      // 1) always push report (primary stream)
      const rp = simReportPool[reportIdx.current % simReportPool.length];
      reportIdx.current += 1;
      simCounter.current += 1;
      const newReport: Report = {
        id: `RPT-SIM-${simCounter.current}`,
        ...rp,
        time: timeStr,
        verified: Math.random() > 0.45,
      };
      setReports(prev => [newReport, ...prev].slice(0, 24));

      // 2) sources trail reports (every 2 reports ~3.6s)
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

      // 3) extra activity nudge when simulating (faster drift)
      setActivity(prev => {
        const next = prev.slice(1);
        const last = prev[prev.length - 1];
        if (selectedWardCode === 69102) next.push(0.8 + Math.random() * 0.7);
        else {
          const delta = (Math.random() - 0.42) * 5;
          next.push(Math.max(0.5, Math.round((last + delta) * 10) / 10));
        }
        return next;
      });

      // 4) Plan sequencing: after ~5 reports, move to optimizing, after ~8 reports ready
      if (simCounter.current === 4) setPlanPhase("optimizing");
      if (simCounter.current === 7) {
        setPlan(FULL_PLAN);
        setPlanPhase("ready");
      }
    }, 1700);
    return () => clearInterval(id);
  }, [simulationState, selectedWardCode]);

  // reset when idle
  useEffect(() => {
    if (simulationState === "idle") {
      reportIdx.current = 0;
      sourceIdx.current = 0;
      simCounter.current = 0;
      setReports(mockReports.slice(0, 1));
      setSources(mockSources.slice(0, 1));
      setPlan([]);
      setPlanPhase("idle");
    }
  }, [simulationState]);

  const planReady = planPhase === "ready";

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
    plan,
    planReady,
    planPhase,
    api: {
      reportsEndpoint: "GET /api/reports",
      incidentsEndpoint: "GET /api/incidents",
      resourcesEndpoint: "GET /api/resources",
      wsEndpoint: "WS /ws/live",
    },
  }), [selectedWardCode, selectedIncidentId, mapMode, simulationState, reports, sources, activity, plan, planReady, planPhase]);

  return <PrismContext.Provider value={value}>{children}</PrismContext.Provider>;
}

export function usePrism() {
  const ctx = useContext(PrismContext);
  if (!ctx) throw new Error("usePrism must be inside PrismProvider");
  return ctx;
}
