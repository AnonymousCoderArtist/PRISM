# PRISM --- Post-Disaster Reality Intelligence & Situation Mapping

## Avinya 2026 --- Problem Statement 5 MVP

> **PRISM turns fragmented disaster signals into a continuously verified
> operational picture, calculates area priority, detects information
> voids, and produces an explainable resource deployment plan.**

### Build constraint

-   **Time remaining:** \~12--13 focused hours after sleep
-   **Team:** 2 laptops
-   **Frontend laptop:** current laptop
-   **Backend laptop:** Anna's laptop
-   **Data:** local-first and simulated for the MVP
-   **Target geography:** Guwahati, Assam
-   **Map:** CesiumJS, built from scratch
-   **Database:** local SQLite
-   **Runtime:** local network / localhost
-   **Goal:** one polished, reliable vertical slice rather than a huge
    incomplete platform

------------------------------------------------------------------------

# 1. Product concept

PRISM is not a generic disaster dashboard.

Its core loop is:

``` text
MASS REPORTS
    ↓
INGEST + NORMALIZE
    ↓
AI EXTRACTION
    ↓
SOURCE FUSION
    ↓
CONTRADICTION CHECK
    ↓
CONFIDENCE SCORE
    ↓
WEATHER-ADJUSTED RISK
    ↓
AREA PRIORITY
    ↓
RESOURCE OPTIMIZATION
    ↓
RESPONSE PLAN
    ↓
LIVE MAP + ACTIVITY TIMELINE
    ↓
CONTINUOUS REASSESSMENT
```

A parallel engine watches for **information voids**:

``` text
EXPECTED SIGNAL
      vs
OBSERVED SIGNAL
      ↓
SILENCE / ANOMALY
      ↓
INFORMATION VOID
      ↓
VERIFY / INVESTIGATE
```

The important distinction is:

> **Silence is not treated as proof of safety. It is treated as
> uncertainty that may require verification.**

------------------------------------------------------------------------

# 2. What the judges should see

The final interface should feel like a disaster operations command
center, not a CRUD dashboard.

## Main screen

``` text
┌──────────────────────────────────────────────────────────────┐
│ PRISM                              ● LIVE / SIMULATION        │
├──────────────┬─────────────────────────────────┬─────────────┤
│ REPORTS      │                                 │ CONFIDENCE  │
│              │                                 │             │
│ R-1742       │          CESIUM GLOBE          │ 91%         │
│ R-1743       │                                 │             │
│ R-1744       │       GUWAHATI OPERATIONAL      │ PRIORITY    │
│ R-1745       │             MAP                 │ P1 🔴       │
│              │                                 │ P2 🟠       │
│              │                                 │ P3 🟡       │
├──────────────┴─────────────────────────────────┴─────────────┤
│ ACTIVITY TIMELINE                     │ SOURCES               │
│ 21:41 citizen report                  │ FIELD     SATELLITE   │
│ 21:43 field confirmation              │ DRONE     CITIZEN     │
│ 21:45 satellite evidence              │ WEATHER   OFFICIAL    │
├───────────────────────────────────────┴───────────────────────┤
│ RESPONSE PLAN                                                 │
│ 🚤 B-174 → VILLAGE A → ETA 18 MIN                             │
│ 🚁 H-02  → SECTOR C  → ETA 11 MIN                             │
└──────────────────────────────────────────────────────────────┘
```

When a village/sector is selected, every side panel becomes contextual
to that entity.

------------------------------------------------------------------------

# 3. MVP features --- LOCKED SCOPE

## S0 --- absolutely required

1.  **Cesium global-to-Guwahati transition**
2.  **Local Guwahati geographic data**
3.  **Simulated incoming report stream**
4.  **Report ingestion**
5.  **AI structured extraction**
6.  **Report confidence**
7.  **Area/sector confidence**
8.  **Contradiction/corroboration**
9.  **Weather-adjusted risk**
10. **Priority score**
11. **Live priority map**
12. **Local resource inventory**
13. **Resource allocation**
14. **Response plan with ETA**
15. **Activity timeline**
16. **Information-void / silence detection**
17. **Source/evidence inspector**
18. **Demo mode that works without internet**

## S1 --- only after S0 works

-   voice commands
-   animated response routes
-   counterfactual "what if" simulation
-   evidence graph
-   richer charts
-   real weather API

## Explicitly out of scope

-   real WhatsApp scraping
-   real Instagram scraping
-   real X/Twitter scraping
-   custom satellite ML
-   training ML models
-   real autonomous drone control
-   full hydrological flood simulation
-   mobile app
-   authentication
-   cloud database
-   Kubernetes
-   microservice architecture
-   full-state mapping
-   full Palantir clone

------------------------------------------------------------------------

# 4. Technology decision

## Frontend

-   React
-   TypeScript
-   Vite
-   CesiumJS
-   Tailwind CSS
-   Framer Motion
-   Lucide React
-   Apache ECharts only where a chart is actually useful
-   Turf.js for lightweight geospatial calculations

## Backend

-   Python
-   FastAPI
-   Pydantic
-   SQLite
-   SQLAlchemy
-   WebSocket
-   OR-Tools
-   httpx
-   Python geospatial utilities as needed

## AI

Primary runtime model:

-   Gemini Flash family behind a single internal AI adapter

The model is never called directly from React.

``` text
React
  ↓
FastAPI
  ↓
AIAdapter
  ↓
Gemini
```

If Gemini availability/quota changes, only `AIAdapter` changes.

## Weather

-   Open-Meteo for optional live weather
-   simulated forecast is the guaranteed demo fallback

## Map data

-   OpenStreetMap-derived local data
-   Guwahati GMC ward boundaries
-   local GeoJSON
-   optional local DEM / terrain assets

## Database

**SQLite only for MVP.**

No Supabase.

No Firebase.

No cloud DB.

The backend owns the database.

------------------------------------------------------------------------

# 5. Why Cesium

CesiumJS is Apache-2.0 and is explicitly designed for 3D globes, maps,
dynamic data visualization and local/static content. It also has an
official offline guide.

The application should not depend on Cesium ion for the core demo.

Use:

-   Cesium globe
-   local GeoJSON
-   local static assets
-   local 3D tiles only if already prepared
-   Natural Earth fallback imagery for the global view
-   custom PRISM overlays

The globe starts globally, then transitions to Guwahati:

``` text
EARTH
  ↓
INDIA
  ↓
ASSAM
  ↓
GUWAHATI
  ↓
OPERATIONAL VIEW
```

The camera animation is part of the demo.

------------------------------------------------------------------------

# 6. Why NOT Hightopo

Hightopo / HT for Web is genuinely powerful. It provides HTML5 UI
components, 2D topology, 3D rendering, dashboards and monitoring
visualization, and its documentation shows support for custom components
and 2D/3D scene work.

However, it is a proprietary SDK rather than an obvious open-source
GitHub dependency. It is therefore **not the right dependency for a
12-hour build** unless the team already has working access and
experience with it.

Decision:

> **Use custom React + CSS/SVG for PRISM HUD.**

Borrow the *visual language* we like from Hightopo, not the dependency.

The dashboard shell will use:

-   CSS clip-path corners
-   SVG borders
-   SVG gauges
-   CSS grid
-   backdrop blur
-   scanline overlay
-   subtle glow
-   animated data pulses
-   custom typography
-   ECharts for selected data visualizations

This is faster to own and easier to integrate with Cesium.

------------------------------------------------------------------------

# 7. Useful open-source UI references

These are references, not mandatory dependencies.

### SCIFICN/UI

Retro sci-fi React component library with HUD panels, terminal styling
and data-grid components.

https://github.com/baxy5/scificn-ui

### cyberpunk-ui

CSS HUD primitives including corner brackets, scanlines, panels and neon
frame variants.

https://github.com/rintran720/cyberpunk-ui

### Cyberwave Dashboard

React + TypeScript + Vite + Tailwind cyberpunk dashboard reference.

https://github.com/marvinisawall/cyberpunk-dashboard

### Matrix

React/Tailwind sci-fi dashboard component collection.

https://github.com/nocoo/matrix

### Apache ECharts

Apache-licensed interactive charting library.

https://github.com/apache/echarts

**Rule:** do not import a giant template and spend the night deleting
it. Copy only tiny visual ideas/components when useful.

------------------------------------------------------------------------

# 8. Local Guwahati data strategy

The product should be geographically focused.

Reference centre:

**26.1445° N, 91.7362° E**

Recommended MVP operational bounding box:

``` text
WEST   91.634
EAST   91.861
SOUTH  26.064
NORTH  26.228
```

This approximately matches the available Guwahati ward/census spatial
extent and keeps the demo manageable.

### Data to prepare

``` text
data/
├── guwahati/
│   ├── wards.geojson
│   ├── roads.geojson
│   ├── buildings.geojson
│   ├── water.geojson
│   ├── bridges.geojson
│   ├── hospitals.geojson
│   ├── schools.geojson
│   ├── shelters.geojson
│   ├── major_places.geojson
│   ├── terrain/
│   └── metadata.json
```

Do not load the whole India OSM dataset into the browser.

Download an appropriate OSM regional extract and clip it locally to
Guwahati.

Geofabrik provides a North-Eastern India OSM extract of roughly 103 MB,
then use Osmium to clip the extract to the Guwahati bbox.

Sources:

-   https://download.geofabrik.de/asia/india/north-eastern-zone.html
-   https://www.openstreetmap.org/export/

Guwahati GMC ward boundaries are also available as downloadable
GeoJSON/KML/Shapefile through BharatAtlas/OpenCity-derived data.

Source:

-   https://bharatlas.com/view/wards_guwahati

------------------------------------------------------------------------

# 9. Terrain strategy

Terrain is optional for S0.

If time permits:

-   download Copernicus DEM GLO-30 for the Guwahati tiles
-   preprocess locally
-   use it as a terrain/risk visualization layer

Copernicus DEM GLO-30 provides global 30 m DSM coverage and is available
under a free license for the general public.

Source:

https://dataspace.copernicus.eu/explore-data/data-collections/copernicus-contributing-missions/collections-description/COP-DEM

If preprocessing becomes a blocker:

> DROP TERRAIN.

Keep the Cesium ellipsoid + local vector geometry + extruded buildings.

A working command center is more valuable than unfinished terrain.

------------------------------------------------------------------------

# 10. Simulated disaster dataset

The MVP will use a deterministic Guwahati scenario.

Create:

### Reports

100--150 reports.

``` text
40 citizen
20 social
15 field officer
10 official
10 satellite
5 drone
5 weather/sensor
```

### Incidents

20--30.

Examples:

-   urban flooding
-   road blockage
-   bridge damage
-   waterlogging
-   people trapped
-   shelter overload
-   hospital access issue
-   landslide
-   power outage
-   communication outage

### Resources

15--20.

``` text
6 rescue boats
3 ambulances
2 helicopters
2 medical teams
2 excavators
2 water tankers
2 supply vehicles
```

### Information voids

At least 3.

One should intentionally occur during the live demo.

------------------------------------------------------------------------

# 11. Report lifecycle

``` text
RAW REPORT
    ↓
NORMALIZE
    ↓
GEOCODE
    ↓
CLASSIFY
    ↓
EXTRACT
    ↓
CORROBORATE
    ↓
CONTRADICTION CHECK
    ↓
REPORT CONFIDENCE
    ↓
MERGE INTO INCIDENT
    ↓
SECTOR CONFIDENCE
    ↓
PRIORITY
```

Every report must have:

``` text
id
source
timestamp
location
content
event_type
severity
people_affected
evidence_type
confidence
status
incident_id
```

------------------------------------------------------------------------

# 12. Confidence model

Confidence is calculated by code.

Gemini explains it but does not own the score.

Example weights:

``` text
FIELD OFFICER       +25
SATELLITE           +25
DRONE               +20
VERIFIED CITIZEN    +10
SENSOR              +10
SOCIAL              +5
UNVERIFIED SOCIAL   +2
```

Additional modifiers:

``` text
freshness
corroboration
evidence quality
location agreement
contradiction penalty
```

Output:

``` text
REPORT CONFIDENCE: 88%

SECTOR CONFIDENCE: 91%

WHY:
+ field confirmation
+ satellite agreement
+ 3 independent reports
- one stale report
```

------------------------------------------------------------------------

# 13. Priority engine

Deterministic scoring:

``` text
priority =
  25% severity
+ 20% population at risk
+ 15% vulnerable population
+ 15% urgency
+ 10% isolation
+ 10% forecast-adjusted risk
+  5% confidence
```

Normalize to 0--100.

``` text
90–100  P1 CRITICAL
75–89   P2 HIGH
50–74   P3 ELEVATED
0–49    MONITOR
```

The AI can explain the score.

The backend calculates it.

------------------------------------------------------------------------

# 14. Weather-adjusted risk

Base:

``` text
current incident risk
```

Then:

``` text
+ rainfall forecast
+ rainfall probability
+ current weather
+ simulated river/flood trend
```

Produces:

``` text
FORECAST-ADJUSTED RISK
```

Example:

``` text
Current severity:       71
6h rainfall risk:       HIGH
water trend:            RISING

Forecast-adjusted risk: 91
```

This is an MVP risk heuristic, not a hydrological prediction.

------------------------------------------------------------------------

# 15. Information Void Engine

Every sector has:

``` text
expected reports
observed reports
expected activity
observed activity
connectivity
last verified timestamp
weather risk
population
```

Example:

``` text
SECTOR 17

Expected reports:      18
Observed reports:       0
Connectivity:         OFFLINE
Last verification:    11h
Population:          3,820
Weather risk:         HIGH

INFORMATION VOID: 96%
```

Output:

> **VERIFY --- INFORMATION VOID**

This does NOT mean the area is confirmed destroyed.

It means the system has insufficient trustworthy information.

------------------------------------------------------------------------

# 16. Resource optimization

Backend receives:

``` text
priority incidents
resource inventory
resource locations
resource capacity
resource availability
road/access constraints
```

The optimizer generates assignments.

Example:

``` text
B-174 → Village A
capacity: 100
people trapped: 84
ETA: 18 min
```

Use OR-Tools if it helps.

If OR-Tools becomes a blocker, use a deterministic greedy optimizer for
the MVP.

Reliability \> mathematical sophistication.

------------------------------------------------------------------------

# 17. Response plan

Output:

``` text
RESPONSE PLAN #014

01
🚤 B-174
→ VILLAGE A
→ 84 trapped
→ ETA 18 min

02
🚁 H-02
→ SECTOR C
→ medical evacuation
→ ETA 11 min

03
🚑 M-07
→ SHELTER 12
→ 31 critical
→ ETA 14 min
```

Human approval:

``` text
[ APPROVE PLAN ]
[ RE-CALCULATE ]
```

No autonomous execution.

------------------------------------------------------------------------

# 18. API contract

## Reports

``` http
POST /api/reports
GET  /api/reports
GET  /api/reports/{id}
POST /api/reports/{id}/verify
```

## Incidents

``` http
GET /api/incidents
GET /api/incidents/{id}
POST /api/incidents/recalculate
```

## Intelligence

``` http
POST /api/intelligence/analyze
POST /api/intelligence/verify
POST /api/intelligence/priority
POST /api/intelligence/situation
POST /api/intelligence/silence
GET  /api/intelligence/confidence
GET  /api/intelligence/weather/{lat}/{lon}
POST /api/intelligence/resources/plan
POST /api/intelligence/query
```

## Voice Assistant

``` http
POST /api/intelligence/query
```

Request body:
``` json
{
  "query": "What is the status of Bhangagarh?",
  "conversation_id": "optional"
}
```

Response body:
``` json
{
  "query": "What is the status of Bhangagarh?",
  "response": {
    "answer": "Bhangagarh has critical flooding...",
    "focus_lat": 26.1495,
    "focus_lng": 91.7655,
    "area_id": "S03"
  }
}
```

## Resources

``` http
GET  /api/resources
```

## Simulation

``` http
POST /api/simulation/start
POST /api/simulation/pause
POST /api/simulation/reset
GET  /api/simulation/status
```

## WebSocket

``` text
/api/simulation/ws/live
```

Events:

``` text
REPORT_RECEIVED
REPORT_UPDATED
INCIDENT_UPDATED
CONFIDENCE_UPDATED
PRIORITY_UPDATED
RESOURCE_ASSIGNED
PLAN_GENERATED
INFORMATION_VOID_DETECTED
SIMULATION_TICK
```

------------------------------------------------------------------------

# 19. Local architecture

``` text
                 FRONTEND LAPTOP
                 ┌───────────────┐
                 │ React + Vite  │
                 │ Cesium        │
                 │ HUD           │
                 └───────┬───────┘
                         │
                  LAN / localhost
                         │
                 ┌───────▼───────┐
                 │ FastAPI       │
                 │ Backend       │
                 └───────┬───────┘
                         │
       ┌─────────────────┼─────────────────┐
       │                 │                 │
       ▼                 ▼                 ▼
   SQLite DB          AI Adapter       Intelligence
                         │                 │
                         ▼                 ├─ confidence
                       Gemini             ├─ priority
                                           ├─ weather risk
                                           ├─ silence
                                           └─ optimizer
```

During development both machines can use Git.

For the final demo, preferably run the backend on Anna's laptop and
expose it on the local Wi-Fi/LAN.

If LAN setup becomes unreliable:

> Run the backend locally on the frontend laptop for the final
> presentation.

The architecture remains identical.

------------------------------------------------------------------------

# 20. Git strategy

Repository:

``` text
prism/
```

Branches:

``` text
main

frontend
backend
```

Each developer has their own worktree:

``` text
../prism-frontend
../prism-backend
```

Do not edit the same files.

Shared contracts live in:

``` text
contracts/
```

The frontend must build against mock JSON first.

The backend must expose the documented API.

Integration happens only after both sides independently work.

------------------------------------------------------------------------

# 21. 12--13 hour execution schedule

## BEFORE SLEEP --- 20 minutes

Do only this:

1.  create Git repository
2.  create `README.md`
3.  create `AGENTS_FRONTEND.md`
4.  create `AGENTS_BACKEND.md`
5.  commit
6.  push
7.  sleep

Do NOT code tonight.

------------------------------------------------------------------------

# AFTER SLEEP --- HOUR 0--1

### Both

-   pull repository
-   create worktrees
-   read agent instructions
-   agree API contract
-   create `.env.example`
-   create `contracts/`

### Frontend

-   React/Vite
-   Cesium
-   basic global globe

### Backend

-   FastAPI
-   SQLite
-   health endpoint
-   models
-   seed script

------------------------------------------------------------------------

# HOUR 1--3

### Frontend

Build:

-   full-screen HUD
-   Cesium globe
-   global → Guwahati camera transition
-   panel shell
-   report list
-   status bar

### Backend

Build:

-   database
-   report model
-   incident model
-   resources
-   activity log
-   seed data

------------------------------------------------------------------------

# HOUR 3--5

### Frontend

-   local Guwahati GeoJSON
-   incident markers
-   priority visualization
-   selection state
-   right-side confidence panel

### Backend

-   report ingestion
-   incident grouping
-   deterministic confidence
-   deterministic priority

------------------------------------------------------------------------

# HOUR 5--7

### Frontend

-   activity timeline
-   source panel
-   confidence evidence
-   resource layer

### Backend

-   Gemini adapter
-   structured report extraction
-   contradiction explanation
-   situation summary

------------------------------------------------------------------------

# HOUR 7--9

### Frontend

-   response plan panel
-   animated routes
-   resource markers
-   information-void layer

### Backend

-   resource optimizer
-   ETA calculation
-   weather risk
-   information void engine

------------------------------------------------------------------------

# HOUR 9--10

### Both

Integrate WebSocket.

Test:

``` text
new report
→ backend
→ database
→ WebSocket
→ frontend
→ map marker
→ confidence
→ priority
```

This is the most important integration test.

------------------------------------------------------------------------

# HOUR 10--11

## DEMO MODE

Implement:

``` text
START DISASTER
```

Timeline:

``` text
T+00 NORMAL
T+05 reports arrive
T+10 incidents merge
T+15 contradictions
T+20 confidence changes
T+25 priorities change
T+30 resources allocated
T+35 Sector C goes silent
T+40 information void
T+45 verification recommendation
```

------------------------------------------------------------------------

# HOUR 11--12

## Visual polish

Only now:

-   typography
-   borders
-   glow
-   scanlines
-   animation
-   map styling
-   transitions
-   micro-interactions
-   sound only if extremely easy

------------------------------------------------------------------------

# HOUR 12--13

## Freeze

No new features.

Test:

``` text
npm run build
backend starts
database seeds
Cesium loads
Guwahati loads
simulation runs
WebSocket works
AI fallback works
response plan works
```

Then rehearse the 5-minute demo.

------------------------------------------------------------------------

# 22. AI fallback is mandatory

Never allow Gemini failure to kill the demo.

Architecture:

``` text
AI REQUEST
    ↓
Gemini
    ↓
SUCCESS → response
    │
    └── FAILURE
           ↓
       deterministic
       demo extractor
```

In DEMO MODE, structured reports can be precomputed.

The UI must still show:

``` text
AI ANALYSIS
SIMULATED / VERIFIED DATA
```

Do not pretend simulated data is live.

------------------------------------------------------------------------

# 23. Frontend component architecture

``` text
src/
├── app/
│   ├── App.tsx
│   └── routes.ts
│
├── components/
│   ├── hud/
│   ├── panels/
│   ├── reports/
│   ├── confidence/
│   ├── priority/
│   ├── resources/
│   ├── timeline/
│   └── common/
│
├── cesium/
│   ├── Globe.tsx
│   ├── CameraController.ts
│   ├── IncidentLayer.ts
│   ├── ResourceLayer.ts
│   ├── SectorLayer.ts
│   └── VoidLayer.ts
│
├── data/
│   └── demo/
│
├── hooks/
│   ├── useLiveEvents.ts
│   ├── useIncidents.ts
│   └── useSelection.ts
│
├── lib/
│   ├── api.ts
│   └── format.ts
│
├── styles/
│   └── prism.css
│
└── types/
    └── prism.ts
```

------------------------------------------------------------------------

# 24. Backend architecture

``` text
backend/
├── app/
│   ├── main.py
│   ├── api/
│   │   ├── reports.py
│   │   ├── incidents.py
│   │   ├── resources.py
│   │   ├── intelligence.py
│   │   └── simulation.py
│   │
│   ├── ai/
│   │   ├── adapter.py
│   │   ├── prompts.py
│   │   └── schemas.py
│   │
│   ├── intelligence/
│   │   ├── confidence.py
│   │   ├── priority.py
│   │   ├── weather_risk.py
│   │   ├── information_void.py
│   │   └── optimizer.py
│   │
│   ├── db/
│   │   ├── database.py
│   │   ├── models.py
│   │   └── seed.py
│   │
│   └── services/
│       ├── reports.py
│       ├── incidents.py
│       └── websocket.py
│
└── tests/
```

------------------------------------------------------------------------

# 25. Definition of DONE

PRISM MVP is DONE when this works:

``` text
PRESS START DISASTER
        ↓
REPORTS START ARRIVING
        ↓
MAP UPDATES
        ↓
AI EXTRACTS INCIDENTS
        ↓
REPORTS CORROBORATE
        ↓
CONFIDENCE CHANGES
        ↓
PRIORITIES CHANGE
        ↓
WEATHER INCREASES FUTURE RISK
        ↓
RESOURCE PLAN GENERATED
        ↓
ROUTES APPEAR
        ↓
ONE SECTOR GOES SILENT
        ↓
INFORMATION VOID APPEARS
        ↓
PRISM RECOMMENDS VERIFICATION
```

If this works flawlessly, **stop building**.

------------------------------------------------------------------------

# 26. Final judge demo

### Opening

Start with Earth.

Say:

> "A disaster doesn't arrive as a clean dataset. It arrives as thousands
> of fragmented signals."

Camera flies:

``` text
EARTH → INDIA → ASSAM → GUWAHATI
```

Then reports begin arriving.

> "PRISM turns those fragments into a common operational picture."

Click Village A.

Show:

``` text
91% confidence
P1 critical
84 trapped
```

Open evidence.

Show why the system believes it.

Then:

> "But PRISM doesn't stop at what is reported."

Sector C goes silent.

Purple information void appears.

> **"This is not a safe zone. This is an unknown zone."**

Then:

``` text
VERIFY
```

PRISM recommends drone/field verification.

Finally:

> "The system doesn't simply tell the administration where the disaster
> is. It tells them what they know, what they don't know, what is likely
> to worsen, and what action should happen next."

------------------------------------------------------------------------

# 27. Success metric for this hackathon

Do NOT claim:

> "PRISM saves X lives."

You have no field validation.

Instead measure prototype performance:

``` text
REPORT FUSION
150 reports → 27 incidents

DUPLICATE REDUCTION
150 → 83 unique evidence events

CONTRADICTION DETECTION
X conflicting reports identified

CONFIDENCE
per report + per sector

PRIORITIZATION
27 incidents → ranked response queue

RESOURCE ALLOCATION
15 resources → optimized assignments

INFORMATION VOID
3 anomalous sectors detected
```

These are defensible MVP metrics.

------------------------------------------------------------------------

# 28. Research/reference sources

-   CesiumJS: https://github.com/CesiumGS/cesium
-   Cesium offline guide:
    https://github.com/CesiumGS/cesium/blob/main/Documentation/OfflineGuide/README.md
-   Cesium 3D Tiles:
    https://cesium.com/learn/cesiumjs/ref-doc/Cesium3DTileset.html
-   Hightopo: https://hightopo.com/en-index.html
-   Hightopo beginners manual:
    https://hightopo.com/guide/guide-en/core/beginners/ht-beginners-guide.html
-   Geofabrik North-Eastern India OSM extract:
    https://download.geofabrik.de/asia/india/north-eastern-zone.html
-   OSM export: https://www.openstreetmap.org/export/
-   Guwahati ward data: https://bharatlas.com/view/wards_guwahati
-   Copernicus Sentinel-2:
    https://dataspace.copernicus.eu/data-collections/copernicus-sentinel-missions/sentinel-2
-   Copernicus DEM:
    https://dataspace.copernicus.eu/explore-data/data-collections/copernicus-contributing-missions/collections-description/COP-DEM
-   Apache ECharts: https://github.com/apache/echarts
-   SCIFICN/UI: https://github.com/baxy5/scificn-ui
-   cyberpunk-ui: https://github.com/rintran720/cyberpunk-ui
-   Cyberwave Dashboard:
    https://github.com/marvinisawall/cyberpunk-dashboard
-   Matrix UI: https://github.com/nocoo/matrix

------------------------------------------------------------------------

# FINAL ARCHITECTURAL DECISION

**Build PRISM from scratch.**

Do not fork God's Eye View.

Do not use Hightopo as a core dependency.

Use **CesiumJS as the spatial engine** and own the entire PRISM HUD/UI.

Use **local SQLite**.

Use **local Guwahati data**.

Use **simulated disaster events**.

Use Gemini behind a replaceable adapter.

Use deterministic intelligence engines for confidence, priority, silence
and resource allocation.

Make the entire system work offline in Demo Mode.

The winning prototype is not the one with the most APIs.

It is the one where, in five minutes, the judges can watch the complete
chain:

**messy reports → reality → confidence → priority → resources → action →
new information → changed decision.**
