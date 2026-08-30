import type { Incident, Report, Resource, WardProperties } from "../types/prism";
import type { PrismResource } from "../resources/resourceTypes";
import { toPrismResource } from "../resources/resourceTypes";

// Backend raw shapes (FastAPI Pydantic schemas)
export type BackendIncident = {
  id: string;
  title: string;
  event_type: string;
  latitude: number;
  longitude: number;
  area_id: string | null;
  severity: string;
  people_affected: number;
  people_trapped: number;
  vulnerable_population: number;
  confidence: number;
  priority: number;
  status: string;
  created_at: string;
  updated_at: string;
};

export type BackendReport = {
  id: string;
  timestamp: string;
  source_type: string;
  source_name: string;
  latitude: number;
  longitude: number;
  location_name: string;
  raw_text: string;
  media_type: string;
  claimed_severity: number;
  people_affected: number;
  people_trapped: number;
  vulnerable_population: number;
  event_type: string;
  evidence_type: string;
  confidence: number;
  status: string;
  incident_id: string | null;
  created_at: string;
};

export type BackendResource = {
  id: string;
  type: string;
  status: string;
  latitude: number;
  longitude: number;
  capacity: number;
  availability: number;
  created_at: string;
  updated_at: string;
};

export type BackendArea = {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  population: number;
  vulnerable_population: number;
  status: string;
  risk_score: number;
  priority: number;
  confidence: number;
  information_void_score: number;
  last_verified: string | null;
  report_count: number;
  created_at: string;
  updated_at: string;
};

function apiBase(): string {
  return import.meta.env.VITE_API_URL ?? "";
}

export function wsUrl(): string {
  const base = apiBase();
  if (base) {
    return base.replace(/^http/, "ws") + "/api/simulation/ws/live";
  }
  return `${window.location.protocol === "https:" ? "wss:" : "ws:"}//${window.location.host}/api/simulation/ws/live`;
}

function timeStr(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function mapIncidentStatus(status: string): Incident["status"] {
  switch (status) {
    case "active":
      return "reported";
    case "monitoring":
      return "verified";
    case "contained":
      return "dispatched";
    case "resolved":
      return "resolved";
    default:
      return "reported";
  }
}

function mapResourceType(type: string): Resource["type"] {
  const t = type.toLowerCase();
  if (["medical", "rescue", "shelter", "food", "transport"].includes(t)) {
    return t as Resource["type"];
  }
  return "medical";
}

function mapResourceStatus(status: string): Resource["status"] {
  const s = status.toLowerCase();
  if (["available", "deployed", "standby"].includes(s)) {
    return s as Resource["status"];
  }
  return "available";
}

export function toIncident(r: BackendIncident): Incident {
  const raw = r.area_id ? parseInt(r.area_id, 10) : 0;
  const wardCode = isNaN(raw) ? 0 : raw;
  return {
    id: r.id,
    wardCode,
    wardName: r.area_id ? `Area ${r.area_id}` : "Unknown",
    title: r.title,
    severity: r.severity as Incident["severity"],
    status: mapIncidentStatus(r.status),
    confidence: r.confidence,
    priority: r.priority,
    lat: r.latitude,
    lon: r.longitude,
    time: `${timeStr(r.created_at)} IST`,
    reports: 0,
    summary: r.event_type,
  };
}

export function toReport(r: BackendReport): Report {
  return {
    id: r.id,
    incidentId: r.incident_id ?? "UNKNOWN",
    wardCode: 0,
    text: r.raw_text,
    time: timeStr(r.timestamp),
    source: r.source_type as Report["source"],
    verified: r.status === "verified",
  };
}

export function toResource(r: BackendResource): Resource {
  return {
    id: r.id,
    type: mapResourceType(r.type),
    status: mapResourceStatus(r.status),
    wardCode: 0,
    lat: r.latitude,
    lon: r.longitude,
    capacity: r.capacity,
  };
}

export function toWard(r: BackendArea): WardProperties {
  const raw = parseInt(r.id, 10);
  const objectid = isNaN(raw) ? 0 : raw;
  return {
    objectid,
    ward_lgd_code: objectid,
    ward_lgd_name: r.name,
    sourcewardcode: r.id,
    townname: "Guwahati",
    state: "Assam",
  };
}

export async function fetchIncidents(signal?: AbortSignal): Promise<Incident[]> {
  const base = apiBase();
  const url = base ? `${base}/api/incidents` : "/api/incidents";
  const res = await fetch(url, { signal });
  if (!res.ok) throw new Error(`Incidents fetch failed: ${res.status}`);
  const data = (await res.json()) as BackendIncident[];
  return data.map(toIncident);
}

export async function fetchReports(signal?: AbortSignal): Promise<Report[]> {
  const base = apiBase();
  const url = base ? `${base}/api/reports` : "/api/reports";
  const res = await fetch(url, { signal });
  if (!res.ok) throw new Error(`Reports fetch failed: ${res.status}`);
  const data = (await res.json()) as BackendReport[];
  return data.map(toReport);
}

export async function fetchResources(signal?: AbortSignal): Promise<Resource[]> {
  const base = apiBase();
  const url = base ? `${base}/api/resources` : "/api/resources";
  const res = await fetch(url, { signal });
  if (!res.ok) throw new Error(`Resources fetch failed: ${res.status}`);
  const data = (await res.json()) as BackendResource[];
  return data.map(toResource);
}

export async function fetchPrismResources(signal?: AbortSignal): Promise<PrismResource[]> {
  const base = apiBase();
  const url = base ? `${base}/api/resources` : "/api/resources";
  const res = await fetch(url, { signal });
  if (!res.ok) throw new Error(`Resources fetch failed: ${res.status}`);
  const data = (await res.json()) as BackendResource[];
  return data.map(r => toPrismResource(r)).filter((r): r is PrismResource => r !== null);
}

export async function fetchAreas(signal?: AbortSignal): Promise<WardProperties[]> {
  const base = apiBase();
  const url = base ? `${base}/api/areas` : "/api/areas";
  const res = await fetch(url, { signal });
  if (!res.ok) throw new Error(`Areas fetch failed: ${res.status}`);
  const data = (await res.json()) as BackendArea[];
  return data.map(toWard);
}
