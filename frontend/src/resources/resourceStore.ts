// Thin re-export — primary store is PrismContext (local-first, single source of truth)
// This file exists to satisfy the suggested architecture & keep resource data/state
// separated for future backend wiring (GET /api/resources → prismResources).
export type { PrismResource, ResourceKind, ResourceStatus } from "./resourceTypes";
export { SIMULATED_RESOURCES } from "./simulatedResources";
