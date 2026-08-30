# AGENTS_BACKEND.md --- PRISM Backend Agent Contract

## Mission

Build the local-first intelligence backend for PRISM.

The backend must work without a cloud database and must remain useful
even when Gemini or external APIs fail.

------------------------------------------------------------------------

# 1. Non-negotiable stack

Use:

-   Python
-   FastAPI
-   Pydantic
-   SQLite
-   SQLAlchemy
-   Uvicorn
-   WebSocket
-   OR-Tools where useful
-   httpx
-   Gemini through an adapter

Do NOT use:

-   Supabase
-   Firebase
-   MongoDB
-   PostgreSQL
-   Redis unless a real blocker appears
-   Kafka
-   Kubernetes
-   microservices

This is a 12-hour hackathon MVP.

------------------------------------------------------------------------

# 2. Worktree

Create/use:

``` text
../prism-backend
```

Suggested branch:

``` text
backend
```

Never work directly on `main`.

Commit frequently.

------------------------------------------------------------------------

# 3. Architecture

``` text
FastAPI
 │
 ├── API
 │
 ├── Services
 │
 ├── Intelligence
 │
 ├── AI Adapter
 │
 ├── Database
 │
 └── WebSocket
```

Keep the code modular but not overengineered.

------------------------------------------------------------------------

# 4. Database

SQLite file:

``` text
data/prism.db
```

Tables:

``` text
reports
incidents
evidence
resources
resource_assignments
sectors
activity_log
simulation_state
```

Use SQLAlchemy models.

Create a deterministic seed script.

------------------------------------------------------------------------

# 5. Core report schema

Every report must support:

``` text
id
source_type
source_name
timestamp
lat
lng
location_name
content
media_type
event_type
severity
people_affected
people_trapped
vulnerable_population
evidence_type
confidence
status
incident_id
created_at
updated_at
```

------------------------------------------------------------------------

# 6. AI adapter

Create:

``` text
app/ai/adapter.py
```

Interface:

``` python
analyze_report(...)
verify_reports(...)
summarize_situation(...)
```

The rest of the backend must not know which Gemini model is used.

Use environment variables:

``` text
GEMINI_API_KEY=
GEMINI_MODEL=
```

Never hard-code credentials.

------------------------------------------------------------------------

# 7. AI output must be structured

Do NOT allow free-form AI output to directly control the database.

Expected JSON:

``` json
{
  "event_type": "flood",
  "severity": 4,
  "people_affected": 620,
  "people_trapped": 84,
  "location_name": "Village A",
  "lat": 26.12,
  "lng": 91.74,
  "evidence": ["photo", "field_report"],
  "summary": "..."
}
```

Validate with Pydantic.

If validation fails:

-   retry once
-   then fall back to deterministic parsing/demo data

------------------------------------------------------------------------

# 8. Confidence engine

Create:

``` text
app/intelligence/confidence.py
```

The backend calculates confidence.

Suggested source weights:

``` text
field officer       25
satellite           25
drone               20
verified citizen    10
sensor              10
social               5
unverified social    2
```

Then apply:

``` text
freshness
corroboration
location agreement
evidence quality
contradiction penalty
```

Return:

``` text
score
breakdown
explanation
```

The LLM may generate the explanation.

The LLM must not decide the final score.

------------------------------------------------------------------------

# 9. Incident fusion

Multiple reports should be merged into an incident.

Use:

-   location proximity
-   time window
-   event type

Simple MVP rule:

``` text
same event type
AND
within radius
AND
within time window
→ candidate same incident
```

Do not build a complex graph database.

------------------------------------------------------------------------

# 10. Contradiction engine

Detect examples:

``` text
Bridge PASSABLE
vs
Bridge COLLAPSED
```

Store:

``` text
contradiction = true
```

Then reduce confidence.

Return:

``` text
conflicting_reports
penalty
resolution_needed
```

------------------------------------------------------------------------

# 11. Sector confidence

Aggregate incident/report evidence into sectors.

A sector should have:

``` text
population
risk
confidence
priority
information_void
last_verified
report_count
```

------------------------------------------------------------------------

# 12. Priority engine

Create:

``` text
app/intelligence/priority.py
```

Formula:

``` text
25% severity
20% population at risk
15% vulnerable population
15% urgency
10% isolation
10% forecast risk
5% confidence
```

Return:

``` text
priority_score
priority_level
breakdown
```

Levels:

``` text
P1 = 90–100
P2 = 75–89
P3 = 50–74
MONITOR <50
```

------------------------------------------------------------------------

# 13. Weather engine

Create:

``` text
app/intelligence/weather_risk.py
```

Use Open-Meteo optionally.

But NEVER make external weather mandatory.

Fallback:

``` text
data/demo/weather.json
```

Return:

``` text
rainfall_next_6h
rain_probability
weather_condition
forecast_risk
```

The system should label forecast risk as an MVP heuristic.

------------------------------------------------------------------------

# 14. Information Void Engine

Create:

``` text
app/intelligence/information_void.py
```

Compare:

``` text
expected reports
observed reports
expected activity
observed activity
connectivity
last verification
weather risk
population
```

Output:

``` json
{
  "sector_id": "S17",
  "void_score": 96,
  "status": "INVESTIGATION_REQUIRED",
  "reason": [
    "no recent reports",
    "connectivity unavailable",
    "high weather risk"
  ]
}
```

Never state:

``` text
silent = disaster confirmed
```

Instead:

``` text
silent = information uncertainty
```

------------------------------------------------------------------------

# 15. Resource model

Example:

``` text
{
  "id": "B-174",
  "type": "rescue_boat",
  "capacity": 100,
  "lat": 26.11,
  "lng": 91.73,
  "status": "available"
}
```

Types:

``` text
boat
ambulance
helicopter
medical_team
excavator
water_tanker
supply_vehicle
```

------------------------------------------------------------------------

# 16. Resource optimizer

Input:

``` text
priority incidents
resources
capacities
locations
availability
```

Output:

``` text
resource_id
incident_id
eta_minutes
reason
```

Use OR-Tools if it can be implemented quickly.

If not, implement deterministic greedy assignment:

1.  sort incidents by priority
2.  find available suitable resources
3.  choose lowest ETA satisfying capacity
4.  assign
5.  continue

Do NOT spend more than 45 minutes fighting an optimizer library.

------------------------------------------------------------------------

# 17. ETA

MVP ETA may use:

``` text
geodesic distance
/
assumed average speed
```

For example:

``` text
boat = 25 km/h
ambulance = 35 km/h
helicopter = 180 km/h
```

Clearly label as:

``` text
ESTIMATED ETA
```

Do not claim real traffic routing.

------------------------------------------------------------------------

# 18. Response plan

Create:

``` text
app/services/response_plan.py
```

Return:

``` json
{
  "plan_id": "PLAN-014",
  "assignments": [
    {
      "resource": "B-174",
      "incident": "INC-07",
      "eta": 18,
      "reason": "highest priority and sufficient capacity"
    }
  ]
}
```

The frontend displays this.

------------------------------------------------------------------------

# 19. WebSocket

Create:

``` text
/ws/live
```

Events:

``` text
REPORT_RECEIVED
REPORT_ANALYZED
INCIDENT_UPDATED
CONFIDENCE_UPDATED
PRIORITY_UPDATED
RESOURCE_ASSIGNED
PLAN_GENERATED
INFORMATION_VOID_DETECTED
SIMULATION_TICK
```

Keep event payloads small.

------------------------------------------------------------------------

# 20. Simulation engine

Create:

``` text
app/services/simulation.py
```

Scenario timeline:

``` text
T+00 normal
T+05 reports begin
T+10 incidents form
T+15 contradictions
T+20 evidence arrives
T+25 priorities recalculate
T+30 resources assigned
T+35 sector goes silent
T+40 information void detected
T+45 verification recommended
```

The simulation must be deterministic.

Seed it with:

``` text
data/demo/
```

------------------------------------------------------------------------

# 21. Demo data

Create:

``` text
data/demo/
├── reports.json
├── incidents.json
├── resources.json
├── sectors.json
├── weather.json
└── scenario.json
```

Target:

``` text
100–150 reports
20–30 incidents
15–20 resources
10–20 sectors
3 information voids
```

------------------------------------------------------------------------

# 22. API contract

Implement exactly:

``` http
GET  /api/health

POST /api/reports
GET  /api/reports
GET  /api/reports/{id}
POST /api/reports/{id}/verify

GET  /api/incidents
GET  /api/incidents/{id}
POST /api/incidents/recalculate

POST /api/intelligence/analyze
POST /api/intelligence/verify
POST /api/intelligence/priority
POST /api/intelligence/situation
POST /api/intelligence/silence

GET  /api/resources
POST /api/resources/optimize
POST /api/resources/plan

GET  /api/weather/{lat}/{lon}

POST /api/simulation/start
POST /api/simulation/pause
POST /api/simulation/reset

WS /ws/live
```

------------------------------------------------------------------------

# 23. API documentation

FastAPI automatically exposes:

``` text
/docs
```

Use it continuously during frontend integration.

The frontend developer should never need to inspect backend internals to
understand an endpoint.

------------------------------------------------------------------------

# 24. Error handling

Every external dependency can fail.

Gemini:

``` text
failure → deterministic fallback
```

Weather:

``` text
failure → demo weather
```

Database:

``` text
failure → fail loudly with useful log
```

WebSocket:

``` text
disconnect → frontend reconnect
```

Never allow one external API to kill the demo.

------------------------------------------------------------------------

# 25. Security basics

Even though this is local:

-   `.env` in `.gitignore`
-   never commit API keys
-   never return API keys
-   validate all AI output
-   validate coordinates
-   validate numeric ranges
-   sanitize user-provided report text before UI display

------------------------------------------------------------------------

# 26. Testing priority

Do not write 100 tests.

Write tests for:

1.  confidence calculation
2.  priority calculation
3.  incident merging
4.  contradiction penalty
5.  resource assignment
6.  information void score
7.  report API
8.  WebSocket event creation

These are the intelligence core.

------------------------------------------------------------------------

# 27. Work schedule

## Hour 0--1

-   FastAPI
-   SQLite
-   models
-   health endpoint
-   seed

## Hour 1--3

-   reports
-   incidents
-   resources
-   activity log
-   demo data

## Hour 3--5

-   confidence
-   priority
-   incident fusion

## Hour 5--7

-   Gemini adapter
-   verification
-   situation summary

## Hour 7--9

-   resource optimizer
-   weather
-   information void

## Hour 9--10

-   WebSocket
-   simulation

## Hour 10--11

-   frontend integration
-   fix contract mismatches

## Hour 11--12

-   failure testing
-   demo rehearsal support

## Hour 12--13

-   FREEZE

------------------------------------------------------------------------

# 28. Definition of done

Backend is DONE when this sequence works:

``` text
POST report
   ↓
stored
   ↓
AI extraction / fallback
   ↓
incident fusion
   ↓
confidence
   ↓
priority
   ↓
resource optimizer
   ↓
response plan
   ↓
WebSocket event
```

and:

``` text
simulation start
```

produces the entire demo sequence.

------------------------------------------------------------------------

# 29. Critical rule

Do not build infrastructure for future scale.

You have hours, not months.

The backend exists to make the PRISM intelligence loop work.

If a proposed abstraction does not directly support:

-   report fusion
-   confidence
-   priority
-   weather risk
-   information void
-   resource allocation
-   live events

do not build it.

------------------------------------------------------------------------

# 30. Final principle

The frontend is the command center.

The backend is the brain.

The database is local.

The AI is replaceable.

The intelligence scores are deterministic.

The demo is simulated.

The system must survive external API failure.

**Make the core loop bulletproof before adding anything else.**
