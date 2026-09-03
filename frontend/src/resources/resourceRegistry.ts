import type { ResourceKind } from "./resourceTypes";

export const RESOURCE_MODELS: Record<ResourceKind, string> = {
  ambulance: "/models/ambulance.glb",
  helicopter: "/models/helicopter.glb",
  boat: "/models/rescue_boat.glb",
  rescue_vehicle: "/models/rescue_vehicle.glb",
};

export const RESOURCE_ALIASES: Record<string, ResourceKind> = {
  rescue_boat: "boat",
  rescueBoat: "boat",
  firetruck: "rescue_vehicle",
  rescue_vehicle: "rescue_vehicle",
  rescueVehicle: "rescue_vehicle",
};

export const RESOURCE_LABELS: Record<ResourceKind, string> = {
  ambulance: "AMBULANCE",
  helicopter: "HELICOPTER",
  boat: "RESCUE BOAT",
  rescue_vehicle: "RESCUE VEHICLE",
};

export const STATUS_COLORS: Record<string, string> = {
  available: "#8A9698",
  en_route: "#CCFF00",
  active: "#F5B942",
  arrived: "#46E09B",
  critical: "#FF4D4D",
  offline: "#4A5254",
};

export function normalizeKind(k: string): ResourceKind {
  const lower = k.toLowerCase();
  if (lower in RESOURCE_ALIASES) return RESOURCE_ALIASES[lower];
  if ((["ambulance", "helicopter", "boat", "rescue_vehicle"] as string[]).includes(lower)) return lower as ResourceKind;
  return "ambulance";
}
