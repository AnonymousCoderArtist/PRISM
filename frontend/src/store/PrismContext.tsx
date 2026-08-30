import { createContext, useContext, useState, useMemo, useEffect, useRef } from "react";
import type { ReactNode } from "react";
import type { AppViewState, Report, Source, Incident } from "../types/prism";
import { mockIncidents, mockResources, simReportPool, simSourcePool, wardActivity, globalActivity } from "../data/mock";

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
  incidents: Incident[]; // verification-gated: empty at idle, populates after SIMULATE
  resources: typeof mockResources;
  reports: Report[];
  sources: Source[];
  activity: number[];
  plan: PlanAssignment[];
  planReady: boolean;
  planPhase: "idle" | "connecting" | "collecting" | "verifying" | "optimizing" | "ready";
  movingAssets: { id: string; lon: number; lat: number; label: string; kind: "ambulance" | "helicopter"; progress: number; trail: [number, number][]; etaMin: number; totalMin: number }[];
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

  // IDLE = truly empty — backend not connected
  const [reports, setReports] = useState<Report[]>([]);
  const [sources, setSources] = useState<Source[]>([]);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [activity, setActivity] = useState<number[]>(globalActivity);
  const [plan, setPlan] = useState<PlanAssignment[]>([]);
  const [planPhase, setPlanPhase] = useState<PrismContextValue["planPhase"]>("idle");
  const [movingAssets, setMovingAssets] = useState<PrismContextValue["movingAssets"]>([]);

  const reportIdx = useRef(0);
  const sourceIdx = useRef(0);
  const simCounter = useRef(0);

  // ---- Activity always ongoing ----
  useEffect(() => {
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

  useEffect(() => {
    const id = setInterval(() => {
      setActivity(prev => {
        const next = prev.slice(1);
        const last = prev[prev.length - 1];
        if (selectedWardCode === 69102) next.push(0.9 + Math.random() * 0.6);
        else if (selectedWardCode) {
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

  // Simulation loop: backend connect -> reports bursty -> verification -> dots -> plan last -> assets move
  useEffect(() => {
    if (simulationState !== "running") {
      if (simulationState === "idle") setPlanPhase("idle");
      return;
    }
    setPlanPhase("connecting");
    // simulate backend handshake 0.6s then collecting
    const connectTimer = setTimeout(() => setPlanPhase("collecting"), 650);

    const id = setInterval(() => {
      const now = new Date();
      const timeStr = now.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: false });

      const rp = simReportPool[reportIdx.current % simReportPool.length];
      reportIdx.current += 1;
      simCounter.current += 1;
      const isVerified = Math.random() > 0.46;
      const newReport: Report = {
        id: `RPT-SIM-${simCounter.current}`,
        ...rp,
        time: timeStr,
        verified: isVerified,
      };
      setReports(prev => [newReport, ...prev].slice(0, 32));

      // sources every tick emergency
      {
        const sp = simSourcePool[sourceIdx.current % simSourcePool.length];
        sourceIdx.current += 1;
        const newSource: Source = {
          id: `SRC-SIM-${simCounter.current}`,
          ...sp,
          time: timeStr,
          confidence: 0.58 + Math.random() * 0.37,
        };
        setSources(prev => [newSource, ...prev].slice(0, 22));
      }

      // verification-gated incidents: only push incident dot when verified
      if (isVerified) {
        const template = mockIncidents.find(m => m.wardCode === rp.wardCode) ?? mockIncidents[simCounter.current % mockIncidents.length];
        const verifiedIncident: Incident = {
          ...template,
          id: `INC-SIM-${simCounter.current}`,
          wardCode: rp.wardCode,
          wardName: template.wardName,
          title: rp.text.slice(0, 36),
          time: timeStr + " IST",
          confidence: Math.round(62 + Math.random() * 33),
          priority: Math.round(58 + Math.random() * 38),
          status: "verified",
          reports: 1,
          severity: (["high", "critical", "moderate"] as const)[simCounter.current % 3],
        };
        setIncidents(prev => {
          // dedupe by wardCode - update if exists
          const exists = prev.find(p => p.wardCode === verifiedIncident.wardCode);
          if (exists) return prev.map(p => p.wardCode === verifiedIncident.wardCode ? verifiedIncident : p);
          return [...prev, verifiedIncident].slice(-12);
        });
        if (simCounter.current >= 3) setPlanPhase("verifying");
      }

      // activity surge
      setActivity(prev => {
        const next = prev.slice(1);
        const last = prev[prev.length - 1];
        if (selectedWardCode === 69102) next.push(0.8 + Math.random() * 0.7);
        else {
          const delta = (Math.random() - 0.42) * 6.5;
          next.push(Math.max(0.5, Math.round((last + delta) * 10) / 10));
        }
        return next;
      });

      if (simCounter.current === 6) setPlanPhase("optimizing");
      if (simCounter.current === 10) {
        setPlan(FULL_PLAN);
        setPlanPhase("ready");
        // staggered dispatch one-by-one (realistic), not instant burst
        setTimeout(() => {
          setMovingAssets([{ id: "AMB-01", lon: 91.71, lat: 26.135, label: "AMB 01 → Ward 1 (Bharalu)", kind: "ambulance", progress: 0, trail: [[91.71, 26.135]], etaMin: 12, totalMin: 12 }]);
        }, 420);
        setTimeout(() => {
          setMovingAssets(prev => [...prev, { id: "AMB-02", lon: 91.74, lat: 26.128, label: "AMB 02 → Ward 26 (Fatasil)", kind: "ambulance", progress: 0, trail: [[91.74, 26.128]], etaMin: 9, totalMin: 9 }]);
        }, 2100);
        setTimeout(() => {
          setMovingAssets(prev => [...prev, { id: "HELI-01", lon: 91.68, lat: 26.145, label: "HELI 01 → Ward 42 (Pandu)", kind: "helicopter", progress: 0, trail: [[91.68, 26.145]], etaMin: 7, totalMin: 7 }]);
        }, 3800);
      }
    }, 750); // very fast emergency rate

    return () => {
      clearTimeout(connectTimer);
      clearInterval(id);
    };
  }, [simulationState, selectedWardCode]);

  // moving assets - realistic slow (12 min compressed to ~38s, 7 min heli to ~28s), trail behind
  useEffect(() => {
    if (planPhase !== "ready" || movingAssets.length === 0) return;
    const id = setInterval(() => {
      setMovingAssets(prev => prev.map(a => {
        // realistic: ambulance slower than heli; 500km joke avoided — Guwahati wards 2-5km, heli quicker
        const speed = a.kind === "helicopter" ? 0.0085 : a.kind === "ambulance" && a.id === "AMB-02" ? 0.0062 : 0.0054;
        const npRaw = a.progress + speed;
        const np = npRaw > 1 ? 0 : npRaw; // loop after arrival (or hold near end)
        const looped = npRaw > 1;
        // per-asset route
        const route: Record<string, { s: [number, number]; e: [number, number] }> = {
          "AMB-01": { s: [91.71, 26.135], e: [91.6367, 26.1395] },
          "AMB-02": { s: [91.74, 26.128], e: [91.720, 26.108] },
          "HELI-01": { s: [91.68, 26.145], e: [91.685, 26.168] },
        };
        const r = route[a.id] ?? { s: [91.71, 26.135] as [number, number], e: [91.6367, 26.1395] as [number, number] };
        const lon = r.s[0] + (r.e[0] - r.s[0]) * np;
        const lat = r.s[1] + (r.e[1] - r.s[1]) * np + Math.sin(np * Math.PI) * 0.0055;
        const nextTrail = looped ? [[r.s[0], r.s[1]] as [number, number]] : [...a.trail, [lon, lat] as [number, number]].slice(-42);
        const eta = Math.max(1, Math.ceil((1 - np) * a.totalMin));
        return { ...a, lon, lat, progress: np, trail: nextTrail, etaMin: eta };
      }));
    }, 130);
    return () => clearInterval(id);
  }, [planPhase, movingAssets.length]);

  useEffect(() => {
    if (simulationState === "idle") {
      reportIdx.current = 0;
      sourceIdx.current = 0;
      simCounter.current = 0;
      setReports([]);
      setSources([]);
      setIncidents([]);
      setPlan([]);
      setPlanPhase("idle");
      setMovingAssets([]);
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
    selectedWardName: selectedWardCode ? incidents.find(i => i.wardCode === selectedWardCode)?.wardName ?? `Ward ${selectedWardCode}` : null,
    incidents,
    resources: mockResources,
    reports,
    sources,
    activity,
    plan,
    planReady,
    planPhase,
    movingAssets,
    api: {
      reportsEndpoint: "GET /api/reports",
      incidentsEndpoint: "GET /api/incidents",
      resourcesEndpoint: "GET /api/resources",
      wsEndpoint: "WS /ws/live",
    },
  }), [selectedWardCode, selectedIncidentId, mapMode, simulationState, reports, sources, activity, plan, planReady, planPhase, incidents, movingAssets]);

  return <PrismContext.Provider value={value}>{children}</PrismContext.Provider>;
}

export function usePrism() {
  const ctx = useContext(PrismContext);
  if (!ctx) throw new Error("usePrism must be inside PrismProvider");
  return ctx;
}
