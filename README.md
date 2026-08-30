# PRISM

PRISM = Post-Disaster Reality Intelligence & Situation Mapping.

Local-first, multi-disaster intelligence and situation-mapping platform. Focus geography: Guwahati, Assam, India. Disaster model is generic (flood, cyclone, heatwave, cold wave, fire, landslide, earthquake) — not flood-only.

## What it does

PRISM ingests reports, satellite, drone, official and social signals, fuses them with AI to verify incidents, scores areas by priority and information void, plans optimal resource dispatch, and streams the entire operation live to a command-centre dashboard over WebSockets.

- Multi-source disaster reports (text, media, geo-tagged)
- AI report structuring (Gemini or any OpenAI-compatible endpoint)
- Evidence verification and fusion
- Confidence scoring per incident
- Area priority scoring
- Information-void detection with signal-loss highlight
- OR-Tools resource allocation plan
- Live operational dashboard (map + panels + WebSocket)
- Simulated real-time disaster evolution with 12 distinct resources from 8 operational bases
- Curved 3D resource paths with per-resource speed and heading
- Live weather forecasting and AI disaster prediction via wttr.in
- **Demo mode**: precomputed AI results with zero token consumption; live AI only when SIMULATE is clicked

## What the dashboard does

- **Top bar** — PRISM identity, Guwahati location pill, SIMULATE/PAUSE + RESET, live clock
- **Left panel — Response Plan** — live plan assignments, upcoming 6h weather, information-void card
- **Right panel — Incoming Reports + Resource Intel + Confidence + Evidence Sources**
- **Bottom panel — Activity Graph + Signal Diagnostics** — clicking a signal-loss ward (33 / 41 / 57) forces a flat-line graph and shows "NO SIGNAL" status
- **Map** — Guwahati wards (60), 3 pulsing signal-loss wards, incidents with severity glow, 12 PNG vehicle icons travelling along curved Bézier routes with per-resource speed
- **Resources page (top-right toggle)** — full inventory + LIVE DISPATCH list that updates as each unit is dispatched

## Run locally

Two terminals. Backend on `:8001`, frontend on `:5173`. The Vite dev server proxies `/api/*` and WebSocket upgrades to the backend so CORS is not needed in development.

> **Note:** On some Windows setups port `8000` may be blocked by a stale socket. The project defaults to `8001` for local testing. If you must use `8000`, free the port or run the terminal as Administrator.

### 1. Backend

```bash
cd backend
uv sync
copy .env.example .env       # Windows
# or:  cp .env.example .env  # macOS / Linux
uv run uvicorn backend.main:app --host 0.0.0.0 --port 8001 --reload
```

Verify:

```bash
curl http://localhost:8001/api/health
# -> {"status":"ok", ...}

curl http://localhost:8001/api/incidents
# -> seeded incidents

curl http://localhost:8001/api/intelligence/predict/26.1445/91.7362
# -> live forecast + AI disaster prediction for Guwahati
```

Interactive API docs: <http://localhost:8001/docs>

The first run auto-creates `backend/data/prism.db` and seeds 10 areas, 8 incidents, 14 reports, 12 resources, 4 weather watch locations.

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

Open <http://localhost:5173>.

Vite dev server proxies `/api/*` and WebSockets to `http://localhost:8001` (see `frontend/vite.config.ts`). The frontend auto-detects this when `VITE_API_URL` is empty in `frontend/.env.development`.

### 3. Demo workflow

1. Open the dashboard. All AI fields are served from precomputed responses (demo mode, no token consumption).
2. Click **SIMULATE** in the left panel. Reports stream in, the plan builds up, and resources dispatch one by one.
3. Watch the 12 vehicles (4 boats, 3 ambulances, 2 helicopters, 2 rescue vehicles, 1 excavator) fly out from 8 distinct operational bases (Pandu Ghat, Fatasil Ghat, Guwahati Port, Jalukbari Depot, GMCH, Dispur Hospital, Panbazar Fire Station, Borjhar Airbase, Chandmari, Khanapara, Azara) along curved Bézier paths to their assigned incidents.
4. Click on a yellow-pulsing signal-loss ward (33 / 41 / 57). The bottom activity graph goes flat, the signal diagnostics panel flips to "VOID CONDITION", and a "NO SIGNAL" tooltip appears.
5. Click **PAUSE** or **RESET** at any time. RESET clears the fleet and the simulation state.

### 4. Production — single-server build

```bash
cd frontend
npm run build

# copy the built SPA into the backend static dir
mkdir ..\backend\static
xcopy /E /I /Y dist\* ..\backend\static\
# macOS / Linux: cp -r dist/* ../backend/static/
```

Now run only the backend and it serves both the API and the dashboard:

```bash
cd backend
uv run uvicorn backend.main:app --host 0.0.0.0 --port 8001
```

Open <http://localhost:8001>.

## Simulated fleet

12 resources, each with a distinct base, target, alternate target, and speed. After the plan is ready, resources dispatch one by one (staggered ~0.9s per unit) and travel along a quadratic Bézier curve at their real-world speed. On reaching the target, the loop continues to the alternate target, then back to the home base.

| ID | Kind | Base | Target | Alt target | Speed (km/h) |
| --- | --- | --- | --- | --- | --- |
| BOAT-174 | boat | Pandu Ghat | Dispur | Maligaon | 45 |
| BOAT-181 | boat | Fatasil Ghat | Paltan Bazaar | Ganeshguri | 32 |
| BOAT-192 | boat | Guwahati Port | Six Mile | Paltan Bazaar | 38 |
| BOAT-205 | boat | Jalukbari | Noonmati | Lokhra | 52 |
| AMB-021 | ambulance | GMCH | Paltan Bazaar | Bhangagarh | 72 |
| AMB-014 | ambulance | Dispur Hospital | Maligaon | Lokhra | 42 |
| AMB-033 | ambulance | Panbazar Fire | Khanapara | Six Mile | 58 |
| AIR-007 | helicopter | Borjhar Airbase | Six Mile | Bhangagarh | 280 |
| AIR-011 | helicopter | Azara | Chandmari | Dispur | 320 |
| RV-009 | rescue_vehicle | Panbazar Fire | Beltola | Dispur | 62 |
| RV-015 | rescue_vehicle | Khanapara | Khanapara | Jalukbari W | 78 |
| EXC-002 | rescue_vehicle | Chandmari | Bhangagarh | Paltan Bazaar | 28 |

## Endpoints

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/api/health` | Liveness + DB status |
| `GET` | `/api/incidents` | List incidents |
| `GET` | `/api/reports` | List reports |
| `GET` | `/api/resources` | List resources |
| `GET` | `/api/areas` | List Guwahati areas |
| `POST` | `/api/intelligence/analyze` | Structure a report (AI) |
| `POST` | `/api/intelligence/verify` | Verify a report set (AI) |
| `POST` | `/api/intelligence/priority` | Recompute incident priority |
| `POST` | `/api/intelligence/situation` | Overall situation summary (AI) |
| `POST` | `/api/intelligence/silence` | Information-void detection |
| `GET` | `/api/intelligence/confidence` | Confidence breakdown |
| `GET` | `/api/intelligence/weather/{lat}/{lon}` | Weather forecast (wttr.in) |
| `GET` | `/api/intelligence/predict/{lat}/{lon}` | Live forecast + AI disaster prediction |
| `POST` | `/api/intelligence/resources/plan` | OR-Tools dispatch plan |
| `POST` | `/api/simulation/start` | Start simulation (enables live AI) |
| `POST` | `/api/simulation/pause` | Pause simulation |
| `POST` | `/api/simulation/reset` | Reset simulation |
| `GET` | `/api/simulation/status` | Status, AI mode, AI stats |
| `WS` | `/api/simulation/ws/live` | Live event stream |

WebSocket events: `SIMULATION_TICK`, `REPORT_RECEIVED`, `INCIDENT_UPDATED`, `RESOURCE_ASSIGNED`, `INFORMATION_VOID_DETECTED`, `PLAN_GENERATED`, `WEATHER_FORECAST_UPDATED`.

## Configuration

Backend env (`backend/.env`):

| Variable | Purpose | Default |
| --- | --- | --- |
| `DATABASE_URL` | SQLite database URL | `sqlite:///data/prism.db` |
| `SIMULATION_SPEED_MS` | Tick interval in ms | `2000` |
| `GEMINI_API_KEY` | Google AI key (optional) | empty |
| `GEMINI_MODEL` | Primary Gemini model | `gemini-3.5-flash` |
| `GEMINI_MODEL_FALLBACKS` | Comma-separated fallback list | `gemini-1.5-flash,gemini-flash-latest` |
| `AI_PROVIDER` | `openai` to force OpenAI-compatible | auto |
| `OPENAI_API_KEY` | OpenAI-compatible key | empty |
| `OPENAI_BASE_URL` | OpenAI-compatible base URL | `https://api.openai.com/v1` |
| `OPENAI_MODEL` | OpenAI-compatible model | `gpt-4o-mini` |

If no AI key is set, all AI calls return precomputed demo responses and **no tokens are consumed**. Weather calls (wttr.in) run regardless of AI configuration.

Frontend env (`frontend/.env.development`, `frontend/.env.production`):

| Variable | Purpose | Default |
| --- | --- | --- |
| `VITE_API_URL` | Backend origin. Empty = use Vite proxy | empty |

## Project layout

```
PRISM/
├── backend/                  FastAPI + SQLite + AI
│   ├── src/backend/
│   │   ├── main.py           App, CORS, static SPA mount
│   │   ├── routers/          HTTP routes
│   │   ├── services/         AI adapter, simulation, weather, seed
│   │   ├── models/           SQLAlchemy models
│   │   ├── schemas/          Pydantic schemas
│   │   └── database.py
│   ├── data/
│   │   ├── demo/             Seed JSON, scenario, weather
│   │   ├── guwahati/         Local GeoJSON + PMTiles + raw PBF
│   │   └── prism.db          SQLite (created on first run)
│   ├── static/               Built SPA (optional, see prod steps)
│   └── pyproject.toml
├── frontend/                 React + Vite + MapLibre + Framer Motion + ECharts
│   ├── src/
│   │   ├── components/       TopBar, LeftPanel, RightPanel, BottomPanel, MapView, ResourcesPage
│   │   ├── store/            PrismContext state
│   │   ├── services/api.ts   Backend client + WS
│   │   ├── lib/mapStyle.ts   Map config
│   │   ├── resources/        Simulated fleet, curve path helpers
│   │   ├── map/layers/       MapLibre layer setup (routes, etc.)
│   │   └── index.css         Design tokens (dark + lime)
│   └── public/data/guwahati/ Local map data + vehicle PNG icons
├── data/guwahati/            Read-only canonical map data (raw PBF here)
├── MVP.md                    Product spec
├── AGENTS.md                 Agent operating rules
└── README.md
```

## Hard architecture rules

- Frontend: React, TypeScript, Vite, MapLibre GL JS, PMTiles, GeoJSON, Framer Motion, Lucide, ECharts, Space Grotesk.
- Backend: Python, uv, FastAPI, SQLite, SQLAlchemy, Pydantic, Google GenAI SDK, OR-Tools, WebSockets.
- Local-first. No Firebase, Supabase, Mongo Atlas, cloud databases, hosted GIS, Google Maps, Mapbox, or paid map APIs.
- Local Guwahati data under `data/guwahati/` and `frontend/public/data/guwahati/`. Do not delete or modify the raw PBF.
- OpenStreetMap attribution must remain visible wherever OSM-derived data is rendered.
- Never work directly on `main`. Branch names: `backend/<feature>` and `frontend/<feature>`.

## Documentation

- `MVP.md` — product concept, architecture, API contract, demo plan
- `AGENTS.md` — agent operating rules
- `AGENTS_BACKEND.md` — backend agent guidance
- `AGENTS_FRONTEND.md` — frontend agent guidance
