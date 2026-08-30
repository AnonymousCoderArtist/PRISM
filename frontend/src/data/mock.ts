import type { Incident, Resource, Report, Source } from "../types/prism";

// Deterministic mock data for Guwahati — used until backend is ready
export const mockIncidents: Incident[] = [
  {
    id: "INC-001",
    wardCode: 69077,
    wardName: "Ward No.1",
    title: "Waterlogging — Bharalu Channel Overflow",
    severity: "high",
    status: "verified",
    confidence: 87,
    priority: 82,
    lat: 26.1395,
    lon: 91.6367,
    time: "09:42 IST",
    reports: 14,
    summary: "Multiple reports of waist-deep water near RG Baruah Rd. 3 sources corroborate.",
  },
  {
    id: "INC-002",
    wardCode: 69092,
    wardName: "Ward No.16",
    title: "Road Block — GS Road (Peltin)",
    severity: "moderate",
    status: "dispatched",
    confidence: 73,
    priority: 64,
    lat: 26.158,
    lon: 91.772,
    time: "09:38 IST",
    reports: 8,
    summary: "Debris blocking service lane. Traffic diverted. NDRF team en route.",
  },
  {
    id: "INC-003",
    wardCode: 69102,
    wardName: "Ward No.26",
    title: "Power Outage — Fatasil Ambari",
    severity: "moderate",
    status: "reported",
    confidence: 41,
    priority: 38,
    lat: 26.108,
    lon: 91.72,
    time: "09:31 IST",
    reports: 3,
    summary: "Single-source report, awaiting corroboration. APDCL notified.",
  },
  {
    id: "INC-004",
    wardCode: 69118,
    wardName: "Ward No.42",
    title: "Shelter Request — Pandu Port Area",
    severity: "critical",
    status: "verified",
    confidence: 91,
    priority: 94,
    lat: 26.168,
    lon: 91.685,
    time: "09:18 IST",
    reports: 21,
    summary: "Riverbank erosion, 120+ displaced. Immediate shelter & medical needed.",
  },
];

export const mockResources: Resource[] = [
  { id: "RES-MED-01", type: "medical", status: "deployed", wardCode: 69077, lat: 26.142, lon: 91.64, capacity: 12 },
  { id: "RES-RSC-02", type: "rescue", status: "available", wardCode: 69092, lat: 26.155, lon: 91.768, capacity: 8 },
  { id: "RES-SHL-03", type: "shelter", status: "standby", wardCode: 69118, lat: 26.17, lon: 91.69, capacity: 150 },
];

export const mockReports: Report[] = [
  { id: "RPT-101", incidentId: "INC-001", wardCode: 69077, text: "Waist-deep water at RG Baruah Rd, bike submerged near Commerce College", time: "09:41", source: "field", verified: true },
  { id: "RPT-102", incidentId: "INC-001", wardCode: 69077, text: "Bharalu outflow visible on Sentinel-1 (SAR) 10:00 UTC", time: "09:40", source: "satellite", verified: true },
  { id: "RPT-103", incidentId: "INC-004", wardCode: 69118, text: "Pandu families displaced, taking shelter under bridge", time: "09:17", source: "social", verified: true },
  { id: "RPT-104", incidentId: "INC-002", wardCode: 69092, text: "Debris on GS Road service lane, traffic police diverting", time: "09:36", source: "field", verified: false },
  { id: "RPT-105", incidentId: "INC-003", wardCode: 69102, text: "No electricity since 08:20, transformer spark reported", time: "09:30", source: "social", verified: false },
  { id: "RPT-106", incidentId: "INC-001", wardCode: 69077, text: "ASDMA control room confirms 14 calls from Ward 1", time: "09:42", source: "official", verified: true },
];

export const mockSources: Source[] = [
  { id: "SRC-01", type: "satellite", label: "Sentinel-2", detail: "Water extent 12m res — Bharalu +1.2km²", time: "09:40", wardCode: 69077, confidence: 0.82 },
  { id: "SRC-02", type: "field", label: "ASDMA Volunteer", detail: "Ground truth — RG Baruah Rd waist-deep", time: "09:41", wardCode: 69077, confidence: 0.91 },
  { id: "SRC-03", type: "social", label: "@GhyIncidentWatch", detail: "4 posts corroborate, 2 images geotagged", time: "09:42", wardCode: 69077, confidence: 0.62 },
  { id: "SRC-04", type: "osm", label: "OSM Roads", detail: "Accessibility: GS Road partial block (12m)", time: "09:36", wardCode: 69092, confidence: 0.74 },
  { id: "SRC-05", type: "official", label: "APDCL", detail: "Feeder F-22 trip, crew dispatched", time: "09:33", wardCode: 69102, confidence: 0.58 },
  { id: "SRC-06", type: "field", label: "NDRF Team 4", detail: "En route to Pandu — ETA 18 min", time: "09:39", wardCode: 69118, confidence: 0.95 },
];

// Deterministic activity time series per ward (last 30 ticks)
// Base pattern + flatline for void wards
export function makeActivitySeries(seed: number, flat = false): number[] {
  const arr: number[] = [];
  let v = 18 + (seed % 12);
  for (let i = 0; i < 30; i++) {
    if (flat && i > 12) v = 1 + Math.random() * 0.6; // silence
    else v = Math.max(1, v + (Math.random() - 0.48) * 6 + Math.sin(i / 3) * 2);
    arr.push(Math.round(v * 10) / 10);
  }
  return arr;
}
export const wardActivity: Record<number, number[]> = {
  69077: makeActivitySeries(77, false),
  69092: makeActivitySeries(92, false),
  69102: makeActivitySeries(102, true), // this one will be flat -> void detection
  69118: makeActivitySeries(118, false),
};
export const globalActivity = makeActivitySeries(0, false);

export const mockStats = {
  totalWards: 60,
  activeIncidents: 4,
  avgConfidence: 73,
  voidsDetected: 7,
  resourcesDeployed: 2,
  reportsLastHour: 46,
};

// Pools for simulation streaming
export const simReportPool: Omit<Report, "id" | "time">[] = [
  { incidentId: "INC-001", wardCode: 69077, text: "New inflow at Bakery Chowk, water rising 8cm/hr", source: "field", verified: false },
  { incidentId: "INC-002", wardCode: 69092, text: "JCB deployed to GS Road, clearance 30% done", source: "field", verified: true },
  { incidentId: "INC-004", wardCode: 69118, text: "Shelter capacity 62% — need additional 80 beds", source: "official", verified: true },
  { incidentId: "INC-003", wardCode: 69102, text: "DG set requested for Fatasil PHC", source: "social", verified: false },
  { incidentId: "INC-001", wardCode: 69077, text: "Drone footage confirms 3 lanes submerged", source: "satellite", verified: true },
  { incidentId: "INC-004", wardCode: 69118, text: "Boats deployed at Pandu ghat, 34 persons ferried", source: "field", verified: true },
];
export const simSourcePool: Omit<Source, "id" | "time" | "confidence">[] = [
  { type: "social", label: "X / Local", detail: "Video: water at Commerce College", wardCode: 69077 },
  { type: "field", label: "Ward Officer-1", detail: "Pump station 2/3 online", wardCode: 69077 },
  { type: "satellite", label: "SAR Anomaly Map", detail: "Δ extent +0.4km² last 15 min", wardCode: 69077 },
  { type: "official", label: "DDMA", detail: "Section 144 in low-lying wards", wardCode: 69118 },
  { type: "field", label: "ASHA-26", detail: "PHC power still out, vaccine cold-chain at risk", wardCode: 69102 },
];
