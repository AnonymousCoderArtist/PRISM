import { createContext, useContext, useState, useMemo, useEffect, useRef } from "react";
import type { ReactNode } from "react";
import type { AppViewState, Report, Source, Incident } from "../types/prism";
import { mockIncidents, mockResources, simReportPool, simSourcePool, wardActivity, globalActivity } from "../data/mock";
import type { PrismResource } from "../resources/resourceTypes";
import { toPrismResource } from "../resources/resourceTypes";
import { SIMULATED_RESOURCES, stepSimulatedResources } from "../resources/simulatedResources";
import { wsUrl } from "../services/api";

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
  prismResources: PrismResource[];
  selectedResourceId: string | null;
  selectResource: (id: string | null) => void;
  resourceTrails: Map<string, [number, number][]>;
  selectedResource: PrismResource | null;
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
  // Start hidden — only appear after SIMULATE → plan ready (user request)
  const [prismResources, setPrismResources] = useState<PrismResource[]>(() => []);
  const [selectedResourceId, setSelectedResourceId] = useState<string | null>(null);
  const [resourceTrails, setResourceTrails] = useState<Map<string, [number, number][]>>(() => new Map());

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

  // ---- 3D resource simulation — backend-ready fallback ----
  // Fleet stays hidden until plan ready — then dispatched like Google Maps navigation
  useEffect(() => {
    if (planPhase !== "ready") return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/resources", { signal: AbortSignal.timeout(1400) });
        if (!res.ok) throw new Error("no api");
        const data = await res.json();
        if (Array.isArray(data) && data.length && !cancelled) {
          const adapted = (data as unknown[]).map(u => toPrismResource(u)).filter(Boolean) as PrismResource[];
          if (adapted.length) {
            setPrismResources(adapted);
            const m = new Map<string, [number, number][]>();
            for (const r of adapted) m.set(r.id, [[r.lng, r.lat]]);
            setResourceTrails(m);
            return;
          }
        }
      } catch { /* keep simulated */ }
      if (cancelled) return;
      // No backend — dispatch simulated fleet now (first appearance)
      setPrismResources(prev => prev.length ? prev : SIMULATED_RESOURCES.slice());
      setResourceTrails(prev => {
        if (prev.size) return prev;
        const m = new Map<string, [number, number][]>();
        for (const r of SIMULATED_RESOURCES) m.set(r.id, [[r.lng, r.lat]]);
        return m;
      });
    })();
    return () => { cancelled = true; };
  }, [planPhase]);

  // Google Maps style dispatch — resources stay at base until SIMULATE → plan ready
  useEffect(() => {
    // When plan not ready, keep resources idle at base; do not step
    if (planPhase !== "ready") return;
    let tick = 0;
    const id = setInterval(() => {
      tick += 1;
      const secondsElapsed = tick * 0.12; // each tick is 120ms
      setPrismResources(prev => stepSimulatedResources(prev, secondsElapsed));
    }, 120);
    return () => clearInterval(id);
  }, [planPhase]);

  // Update resource trails whenever positions change
  useEffect(() => {
    setResourceTrails(prev => {
      const nm = new Map(prev);
      for (const r of prismResources) {
        const cur = nm.get(r.id) ?? [];
        const last = cur[cur.length - 1];
        if (!last || last[0] !== r.lng || last[1] !== r.lat) {
          nm.set(r.id, [...cur, [r.lng, r.lat] as [number, number]].slice(-42));
        }
      }
      return nm;
    });
  }, [prismResources]);

  // ---- Backend WebSocket live feed (minimal integration) ----
  useEffect(() => {
    if (simulationState !== "running") return;
    const url = wsUrl();
    const ws = new WebSocket(url);
    ws.onopen = () => { /* live feed active */ };
    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        const eventType = msg.event;
        const payload = msg.payload;
        if (eventType === "REPORT_RECEIVED") {
          setReports(prev => {
            const report: Report = {
              id: `RPT-WS-${Date.now()}`,
              incidentId: "",
              wardCode: 0,
              text: `${payload.source ?? "unknown"} @ ${payload.location ?? "unknown"}`,
              time: new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: false }),
              source: "field",
              verified: false,
            };
            return [report, ...prev].slice(0, 32);
          });
        } else if (eventType === "INCIDENT_UPDATED") {
          setIncidents(prev =>
            prev.map(inc =>
              inc.id === payload.incident_id
                ? { ...inc, status: payload.status === "active" ? "reported" : payload.status === "monitoring" ? "verified" : payload.status === "contained" ? "dispatched" : payload.status === "resolved" ? "resolved" : inc.status }
                : inc
            )
          );
        } else if (eventType === "RESOURCE_ASSIGNED") {
          setMovingAssets(prev => [
            ...prev,
            {
              id: `MOV-WS-${payload.resource_id}`,
              lon: 91.73,
              lat: 26.14,
              label: `${payload.resource_id} → ${payload.incident_id}`,
              kind: "ambulance",
              progress: 0,
              trail: [[91.73, 26.14]],
              etaMin: payload.eta_minutes ?? 10,
              totalMin: payload.eta_minutes ?? 10,
            },
          ]);
        }
      } catch { /* ignore malformed WS messages */ }
    };
    ws.onclose = () => { /* live feed closed */ };
    ws.onerror = () => { ws.close(); };
    return () => { ws.close(); };
  }, [simulationState]);

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
      // hide fleet until next dispatch — user request: no boats visible before plan
      setPrismResources([]);
      setResourceTrails(new Map());
      setSelectedResourceId(null);
      setSelectedWardCode(null);
      setSelectedIncidentId(null);
    }
  }, [simulationState]);

  const planReady = planPhase === "ready";
  const selectedResource = selectedResourceId ? prismResources.find(r => r.id === selectedResourceId) ?? null : null;

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
    prismResources,
    selectedResourceId,
    selectResource: setSelectedResourceId,
    resourceTrails,
    selectedResource,
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
  }), [selectedWardCode, selectedIncidentId, mapMode, simulationState, reports, sources, activity, plan, planReady, planPhase, incidents, movingAssets, prismResources, selectedResourceId, resourceTrails, selectedResource]);

  return <PrismContext.Provider value={value}>{children}</PrismContext.Provider>;
}

export function usePrism() {
  const ctx = useContext(PrismContext);
  if (!ctx) throw new Error("usePrism must be inside PrismProvider");
  return ctx;
}
