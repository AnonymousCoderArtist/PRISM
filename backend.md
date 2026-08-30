# PRISM BACKEND AGENT

## ROLE

You own the PRISM backend.

You do NOT own frontend UI.

## STACK

Python 3.12+
uv
FastAPI
SQLite
SQLAlchemy
Pydantic
Google GenAI SDK
OR-Tools
WebSockets

## DATABASE

SQLite only.

Database:

backend/data/prism.db

No:
- Firebase
- Supabase
- PostgreSQL
- MongoDB
- cloud database

## CORE PIPELINE

PRISM must implement:

REPORT
↓
STRUCTURE
↓
VERIFY / FUSE
↓
CONFIDENCE
↓
AREA ASSESSMENT
↓
PRIORITY
↓
RESOURCE OPTIMIZATION
↓
LIVE UPDATE

## DATA MODEL

Minimum entities:

Report
Incident
Evidence
Area
Resource
ResourceAssignment
ActivityEvent

## REPORT

A report should contain:

id
timestamp
source_type
source_name
latitude
longitude
raw_text
media_type
claimed_severity
people_affected
status
confidence

Supported simulated sources:

citizen
field_officer
drone
satellite
social_media
news
voice
photo
video

## INCIDENT

Incident:

id
title
latitude
longitude
area_id
severity
people_affected
confidence
priority
status
created_at
updated_at

## EVIDENCE

Evidence:

id
incident_id
source_type
source_id
confidence
supports_claim
timestamp
metadata

## CONFIDENCE

Implement explainable confidence.

Example:

field officer confirmation = strong
satellite confirmation = strong
drone confirmation = strong
multiple independent citizens = moderate/strong
single social media report = weak/moderate

Do NOT produce arbitrary AI numbers.

Store component scores.

Example:

{
  "field": 35,
  "satellite": 35,
  "citizen": 15,
  "consistency": 10,
  "total": 95
}

## PRIORITY

Priority should consider:

severity
people affected
vulnerability
confidence
hazard escalation
time sensitivity

Do not simply use confidence as priority.

High confidence does NOT automatically mean high priority.

## INFORMATION VOID

This is a core PRISM feature.

Detect areas where:

- expected reporting activity exists
- reports suddenly stop
- communication/network status deteriorates
- hazard conditions remain high
- population is present

Produce:

information_void_score
last_known_activity
silence_duration
risk_level

The system must be able to distinguish:

LOW REPORTING

from:

POTENTIAL INFORMATION VOID

## WEATHER

For MVP:

weather can be simulated.

The architecture should allow a future weather provider.

Do not make the entire system dependent on an external weather API.

## AI

Gemini is an adapter, not the core system.

The backend must work with simulated structured AI responses if the API is unavailable.

Use AI primarily for:

- extracting facts from reports
- identifying location
- severity estimation
- people affected
- event classification
- contradictions
- evidence summarization

Never allow an AI response to directly mutate critical state without validation.

## RESOURCE OPTIMIZATION

Resources:

boat
ambulance
helicopter
rescue_team
excavator
medical_team
water_tanker

Each resource has:

id
type
status
latitude
longitude
capacity
availability

Generate response recommendations.

Example:

BOAT-174
TARGET: Area A
ETA: 18 min
REASON:
High drowning risk + 420 affected + high confidence

## SIMULATION

Create a deterministic simulation engine.

The simulation should generate:

- incoming reports
- incidents
- changing confidence
- changing priorities
- resource assignments
- information voids

The frontend must be able to start/pause/reset the simulation.

Endpoints:

POST /api/simulation/start
POST /api/simulation/pause
POST /api/simulation/reset
GET /api/simulation/status

## API

Minimum:

GET /api/health
GET /api/reports
GET /api/incidents
GET /api/resources
GET /api/areas

GET /api/incidents/{id}

POST /api/simulation/start
POST /api/simulation/pause
POST /api/simulation/reset

WebSocket:

/ws/live

## API CONTRACT

Return stable JSON.

Never make frontend agents reverse-engineer Python internals.

Document changes.

## WORKTREE

Create your own branch/worktree.

Never work directly on main.

## DEFINITION OF DONE

1. uv sync works.
2. FastAPI starts with uv run.
3. SQLite initializes automatically.
4. Seed data exists.
5. Reports endpoint works.
6. Incidents endpoint works.
7. Resources endpoint works.
8. Simulation works.
9. WebSocket broadcasts events.
10. Backend works without Gemini.
11. Gemini adapter works when configured.
12. No critical runtime errors.