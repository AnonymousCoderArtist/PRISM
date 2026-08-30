# AGENTS_FRONTEND.md --- PRISM Frontend Agent Contract

## Mission

Build the PRISM disaster command-center frontend in the frontend
worktree.

The frontend must be visually exceptional, stable, and independently
runnable with mock data.

The backend is being built on another laptop. Do not block frontend work
waiting for backend APIs.

------------------------------------------------------------------------

# 1. Non-negotiable architecture

Use:

-   React
-   TypeScript
-   Vite
-   CesiumJS
-   Tailwind CSS
-   Framer Motion
-   Lucide React
-   optional Apache ECharts
-   Turf.js if needed

Do NOT introduce:

-   Next.js
-   Firebase
-   Supabase
-   Mapbox
-   Google Maps
-   Hightopo
-   God's Eye View
-   another globe engine

Cesium is the spatial foundation.

------------------------------------------------------------------------

# 2. Worktree

Create/use:

``` text
../prism-frontend
```

Never work directly on `main`.

Suggested branch:

``` text
frontend
```

Commit frequently.

Suggested commits:

``` text
feat(frontend): bootstrap prism shell
feat(frontend): add cesium globe
feat(frontend): add guwahati layers
feat(frontend): add incident visualization
feat(frontend): add command panels
feat(frontend): add response plan
feat(frontend): add information void layer
feat(frontend): add demo mode
fix(frontend): integration polish
```

------------------------------------------------------------------------

# 3. Build order

## Phase 1 --- skeleton

First make:

``` text
App
 ├── TopBar
 ├── LeftPanel
 ├── CesiumViewport
 ├── RightPanel
 └── BottomPanel
```

Do not start with charts.

------------------------------------------------------------------------

## Phase 2 --- Cesium

Build:

1.  global Earth
2.  camera transition
3.  Guwahati focus
4.  local GeoJSON
5.  incident points
6.  resource points
7.  sector polygons
8.  information-void polygons

The globe must work without Google Maps.

------------------------------------------------------------------------

# 4. Globe behavior

Initial:

``` text
camera = global Earth
```

On startup:

``` text
Earth
→ India
→ Assam
→ Guwahati
```

Use a cinematic camera flight.

Do not make the transition too slow.

Target:

**3--5 seconds.**

------------------------------------------------------------------------

# 5. Local map assets

Expect:

``` text
/public/data/guwahati/
```

with:

``` text
wards.geojson
roads.geojson
water.geojson
buildings.geojson
hospitals.geojson
schools.geojson
bridges.geojson
```

If some assets are unavailable:

**do not stop development.**

Use seeded local mock GeoJSON.

------------------------------------------------------------------------

# 6. Visual system

PRISM should feel:

-   dark
-   tactical
-   premium
-   technical
-   restrained
-   cinematic

Avoid:

-   generic dashboard cards
-   huge gradients
-   rounded SaaS cards
-   excessive glassmorphism
-   giant icons
-   rainbow charts
-   excessive animation

Preferred:

``` text
near-black background
thin borders
small corner cuts
monospace labels
compact typography
subtle glow
precise alignment
```

Use CSS/SVG to build the HUD.

Do not depend on Hightopo.

------------------------------------------------------------------------

# 7. Main colors

Suggested system:

``` text
BG       #050607
PANEL    #0A0D0F
TEXT     #E8ECEB
MUTED    #6E7778

LIME     #CCFF00
CYAN     #48D8FF
AMBER    #F5B942
RED      #FF4D4D
PURPLE   #A88BFF
GREEN    #46E09B
```

Purple is specifically reserved for:

**INFORMATION VOID**

------------------------------------------------------------------------

# 8. Information hierarchy

The map is the hero.

Panels support the map.

Do not let panels visually overpower Cesium.

The visual hierarchy must be:

``` text
1. map
2. critical incident
3. priority
4. confidence
5. response plan
6. raw evidence
```

------------------------------------------------------------------------

# 9. State model

Create a frontend store/context with:

``` text
selectedIncident
selectedSector
selectedResource
reports
incidents
resources
responsePlan
activityLog
informationVoids
simulationState
mapMode
```

Use a lightweight store if necessary.

Do not overengineer state management.

------------------------------------------------------------------------

# 10. Backend contract

Frontend must consume the API contract in README.md.

Until backend is ready:

``` text
src/data/demo/
```

must provide identical TypeScript types.

Frontend development should never be blocked by backend progress.

------------------------------------------------------------------------

# 11. Required components

``` text
PRISMHeader
LiveIndicator
CesiumGlobe
IncidentMarker
SectorOverlay
ResourceMarker
InformationVoidOverlay

ReportStream
ConfidencePanel
PriorityPanel
SourcePanel
ActivityTimeline
ResponsePlan
ResourceList
WeatherRisk
EvidenceInspector
```

------------------------------------------------------------------------

# 12. Interaction rules

Click incident:

-   camera flies to incident
-   incident becomes selected
-   right panel updates
-   activity timeline updates
-   source panel updates
-   confidence updates
-   response plan filters

Click sector:

-   show sector confidence
-   show population
-   show risk
-   show information status

Click resource:

-   show status
-   location
-   capacity
-   assignment

------------------------------------------------------------------------

# 13. Demo mode

Implement:

``` text
START SIMULATION
PAUSE
RESET
```

The frontend should animate events coming from a deterministic local
simulator.

The simulation must look real-time.

------------------------------------------------------------------------

# 14. Do not fake live status

If data is simulated, show:

``` text
SIM
```

If data comes from backend:

``` text
LOCAL
```

If an actual external service is used:

``` text
LIVE
```

Never display LIVE for simulated information.

------------------------------------------------------------------------

# 15. Performance

Cesium is expensive.

Therefore:

-   don't render hundreds of DOM markers over the globe
-   prefer Cesium entities/primitives
-   cluster if needed
-   don't constantly recreate layers
-   update only changed entities
-   keep animations subtle
-   avoid giant SVG trees over the entire map

Target smooth interaction.

------------------------------------------------------------------------

# 16. Integration

At integration time:

``` text
frontend
  ↓
GET /api/incidents
GET /api/resources
GET /api/reports
WS /ws/live
```

When:

``` text
REPORT_RECEIVED
```

update the UI.

When:

``` text
PRIORITY_UPDATED
```

update marker styling.

When:

``` text
INFORMATION_VOID_DETECTED
```

show the purple zone.

------------------------------------------------------------------------

# 17. Hard rule

Do not spend 2 hours making the map "perfect" before the rest of the
interface exists.

Milestone:

``` text
Hour 2:
map + shell

Hour 5:
map + incidents + panels

Hour 8:
full dashboard

Hour 10:
integration

Hour 12:
polish
```

------------------------------------------------------------------------

# 18. Definition of done

Frontend is DONE when:

``` text
npm run build
```

passes and the app can:

-   open Cesium
-   fly to Guwahati
-   show local geography
-   show incidents
-   select incidents
-   show confidence
-   show priority
-   show resources
-   show response plan
-   show information void
-   run demo mode
-   update from WebSocket/mock events \`\`\`

STOP adding features after this point.

------------------------------------------------------------------------

# 19. Final principle

You are building a **command center**, not a website.

Every pixel must answer:

> "What does the operator need to know or do next?"
