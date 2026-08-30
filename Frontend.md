# PRISM FRONTEND AGENT

## ROLE

You own the PRISM frontend.

You do NOT own backend logic.

Your job is to build the operational command-centre interface and integrate
with the backend API.

## STACK

React
TypeScript
Vite
MapLibre GL JS
PMTiles
GeoJSON
Framer Motion
Lucide React
ECharts

## CURRENT DATA

Local Guwahati data exists at:

../data/guwahati/

Files:

../data/guwahati/wards_guwahati.pmtiles
../data/guwahati/geojson/wards_guwahati.geojson
../data/guwahati/geojson/roads.geojson
../data/guwahati/geojson/polygons.geojson
../data/guwahati/geojson/points.geojson

Do NOT move or duplicate the large datasets unnecessarily.

## PRIMARY OBJECTIVE

Build:

PRISM
Post-Disaster Reality Intelligence & Situation Mapping

The primary screen is an emergency operations dashboard.

## REQUIRED UI

Top:
- PRISM identity
- system status
- current time
- simulation state

Center:
- large operational map

Right:
- incoming reports
- confidence
- priority
- evidence sources

Left/bottom:
- activity timeline
- response plan
- selected-area information

## MAP

Use MapLibre.

Start with:

GLOBAL
↓
INDIA
↓
ASSAM
↓
GUWAHATI

Implement a cinematic camera transition.

The final Guwahati map should display:

- ward boundaries
- roads
- water/physical geography where available
- PRISM incident overlays
- priority areas
- information voids
- resources
- response routes

## PRISM VISUAL LANGUAGE

Background:
near-black

Map:
dark, restrained

Primary accent:
lime

Warning:
amber

Critical:
red

Information:
cool neutral/blue-grey

Keep effects subtle.

## INTERACTION

Clicking an incident should update:

- incident details
- confidence
- evidence
- severity
- affected population
- priority
- activity timeline

Clicking a ward/area should update:

- area risk
- latest reports
- confidence
- information status
- resource allocation

## REAL-TIME

Prepare the frontend for:

GET /api/reports
GET /api/incidents
GET /api/resources
GET /api/areas

WebSocket:

/ws/live

Do NOT invent API contracts silently.

If an endpoint does not exist, document the required contract.

## DEMO REQUIREMENT

A judge should be able to understand PRISM without reading documentation.

The map must visibly change during the simulation.

Reports should appear.

Confidence should change.

Priorities should change.

Information voids should appear.

Resources should move/update.

## DO NOT

Do not introduce:
- Google Maps
- Mapbox
- Firebase
- Supabase
- Hightopo
- Cesium
- paid map APIs

Do not rebuild the backend.

Do not hardcode the entire dashboard into one giant component.

Use sensible components.

## WORKTREE

Create your own worktree/branch.

Do not work directly on main.

## DEFINITION OF DONE

1. Application starts with npm run dev.
2. PRISM dashboard renders.
3. MapLibre renders.
4. Guwahati geographic data renders.
5. Ward boundaries render.
6. Incident overlays render from local/API data.
7. Clicking an incident updates the side panel.
8. WebSocket integration is ready.
9. Responsive enough for the competition laptop display.
10. No console-breaking errors.