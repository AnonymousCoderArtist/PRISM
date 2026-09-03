export type WardProperties = {
  objectid: number;
  ward_lgd_code: number;
  ward_lgd_name: string;
  sourcewardcode: string;
  townname: string;
  state: string;
};

export type WardFeature = {
  type: "Feature";
  geometry: { type: "MultiPolygon"; coordinates: number[][][][] };
  properties: WardProperties;
};

export type IncidentSeverity = "low" | "moderate" | "high" | "critical";
export type IncidentStatus = "reported" | "verified" | "dispatched" | "resolved";

export type Incident = {
  id: string;
  wardCode: number;
  wardName: string;
  title: string;
  severity: IncidentSeverity;
  status: IncidentStatus;
  confidence: number;
  priority: number;
  lat: number;
  lon: number;
  time: string;
  reports: number;
  summary: string;
};

export type Resource = {
  id: string;
  type: "medical" | "rescue" | "shelter" | "food" | "transport";
  status: "available" | "deployed" | "standby";
  wardCode: number;
  lat: number;
  lon: number;
  capacity: number;
};

export type SourceType = "field" | "social" | "satellite" | "osm" | "official";

export type Source = {
  id: string;
  type: SourceType;
  label: string;
  detail: string;
  time: string;
  wardCode: number;
  confidence: number;
};

export type Report = {
  id: string;
  incidentId: string;
  wardCode: number;
  text: string;
  time: string;
  source: SourceType;
  verified: boolean;
};

export type ConfidenceLevel = "low" | "medium" | "high" | "verified";
export type PriorityLevel = "low" | "medium" | "high" | "critical";

export type AppViewState = {
  selectedWardCode: number | null;
  selectedIncidentId: string | null;
  mapMode: "wards" | "priority" | "voids" | "resources";
  simulationState: "idle" | "running" | "paused";
};

export const GUWAHATI_CENTER: [number, number] = [91.7362, 26.1445];
export const GUWAHATI_BOUNDS: [[number, number], [number, number]] = [
  [91.6347, 26.0842],
  [91.8521, 26.2093],
];

export type ApiContracts = {
  "GET /api/reports": Report[];
  "GET /api/incidents": Incident[];
  "GET /api/resources": Resource[];
  "GET /api/areas": WardProperties[];
  "WS /ws/live": { event: "REPORT_RECEIVED" | "PRIORITY_UPDATED" | "INFORMATION_VOID_DETECTED"; payload: unknown };
};
