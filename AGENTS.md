# PRISM — Agent Operating Rules

## Project

PRISM = Post-Disaster Reality Intelligence & Situation Mapping.

PRISM is a local-first disaster intelligence and situation-mapping MVP for the
Avinya 2026 final round.

The prototype focuses on Guwahati, Assam.

## Mission

Build a working end-to-end system within the hackathon time limit.

The system must demonstrate:

1. Multi-source disaster reports
2. AI report structuring
3. Evidence verification/fusion
4. Confidence scoring
5. Area priority scoring
6. Information-void detection
7. Resource allocation
8. Live operational dashboard
9. Simulated real-time disaster evolution

## HARD ARCHITECTURE RULES

Frontend:
- React
- TypeScript
- Vite
- MapLibre GL JS
- PMTiles
- GeoJSON
- Framer Motion
- Lucide
- ECharts where useful

Backend:
- Python
- uv
- FastAPI
- SQLite
- SQLAlchemy
- Pydantic
- Google GenAI SDK
- OR-Tools where useful
- WebSockets

## DATA RULES

The application is LOCAL-FIRST.

Do NOT introduce:
- Firebase
- Supabase
- MongoDB Atlas
- cloud databases
- hosted GIS databases
- Google Maps
- Mapbox dependency
- paid map APIs

Local Guwahati geographic data is already available.

Current geographic data:

data/guwahati/
├── wards_guwahati.pmtiles
├── geojson/
│   ├── wards_guwahati.geojson
│   ├── roads.geojson
│   ├── polygons.geojson
│   └── points.geojson
└── raw/
    └── north-eastern-zone-260829.osm.pbf

Do NOT modify or delete the raw PBF.

## IMPORTANT

Do not rebuild existing functionality.

Before implementing anything:
1. Inspect the repository.
2. Inspect existing code.
3. Understand the API contract.
4. Check whether another agent already owns the feature.
5. Implement the smallest working version.

## SIMULATION FIRST

Real external disaster feeds are NOT required for the MVP.

Use realistic simulated data.

The demo must be deterministic enough to reproduce.

## UI PRINCIPLES

PRISM should look like a serious emergency operations centre.

Avoid:
- generic cyberpunk
- excessive neon
- excessive gradients
- gaming UI
- giant glowing elements
- unnecessary animations

Use:
- dark command-centre aesthetic
- thin borders
- restrained lime/amber/red status colors
- dense information hierarchy
- professional typography
- subtle motion
- map-first composition

## MAP

MapLibre is the primary map engine.

The application must support:

GLOBAL → INDIA → ASSAM → GUWAHATI

The Guwahati operational view must use local geographic data.

OpenStreetMap attribution must remain visible where OSM-derived data is displayed.

## GIT RULES

Never work directly on main.

Create a dedicated branch/worktree.

Branch naming:

frontend/<feature>
backend/<feature>

Commit frequently.

Commit messages should describe the actual change.

Do not reset, delete, or overwrite another agent's work.

## PRIORITY

Working functionality > architectural perfection.

Demo reliability > unnecessary abstraction.

A small feature that works end-to-end is more valuable than a large unfinished feature.