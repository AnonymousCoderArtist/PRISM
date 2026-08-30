# PRISM Backend

Local-first disaster intelligence backend for PRISM.

## Stack

- Python 3.14+
- FastAPI
- SQLite / SQLAlchemy
- Pydantic
- Uvicorn
- WebSockets
- OR-Tools
- Google GenAI SDK (optional)
- OpenAI-compatible provider support (optional)
- wttr.in (live weather)

## Run

```bash
cd backend
uv sync
copy .env.example .env
uv run uvicorn backend.main:app --host 0.0.0.0 --port 8001 --reload
```

The API is at <http://localhost:8001>. Interactive docs at <http://localhost:8001/docs>.

The first run auto-creates `backend/data/prism.db` and seeds 5 areas, 2 incidents, 3 reports, 5 resources, 2 evidences from `backend/data/demo/`.

## Environment

Copy `.env.example` to `.env` and set values as needed.

| Variable | Purpose | Default |
| --- | --- | --- |
| `DATABASE_URL` | SQLite database URL | `sqlite:///data/prism.db` |
| `SIMULATION_SPEED_MS` | Simulation tick interval | `2000` |
| `GEMINI_API_KEY` | Google AI API key | _(empty = demo mode)_ |
| `GEMINI_MODEL` | Gemini model name | `gemini-3.5-flash` |
| `GEMINI_MODEL_FALLBACKS` | Gemini fallback models (comma-separated) | `gemini-1.5-flash,gemini-flash-latest` |
| `AI_PROVIDER` | AI provider selection | _(empty = auto)_ |
| `OPENAI_API_KEY` | OpenAI-compatible API key | _(empty)_ |
| `OPENAI_BASE_URL` | OpenAI-compatible base URL | `https://api.openai.com/v1` |
| `OPENAI_MODEL` | OpenAI-compatible model name | `gpt-4o-mini` |

### Demo mode vs live AI

The backend ships in **demo mode** by default. Every AI method returns a precomputed deterministic response — no API key, no token consumption, no rate limit. The frontend shows a **DEMO · AI NOT INVOKED** badge.

When the user clicks SIMULATE in the UI, the frontend calls `POST /api/simulation/start`. The backend then tries to initialise the configured AI provider. If a key is present, the adapter switches to live mode and every subsequent AI call invokes the model. The frontend badge switches to **AI LIVE**.

If no key is configured, the simulation starts but demo responses continue to be served. `GET /api/simulation/status` returns `ai_live: false` and a `ai_stats` block with simulated call count.

### Provider selection rules

- If `AI_PROVIDER=openai`, the backend uses the OpenAI-compatible client.
- If `GEMINI_API_KEY` is set and `AI_PROVIDER` is not `openai`, the backend uses Gemini.
- Otherwise, the backend uses precomputed demo responses.

### Model fallbacks (Gemini)

If the primary Gemini model returns an error (404, 503, quota exhaustion, etc.), the adapter automatically retries with each model in `GEMINI_MODEL_FALLBACKS` before returning a demo response.

### Example: OpenAI-compatible local model

```bash
AI_PROVIDER=openai
OPENAI_API_KEY=sk-...
OPENAI_BASE_URL=http://localhost:11434/v1
OPENAI_MODEL=llama3
```

### Example: Groq

```bash
AI_PROVIDER=openai
OPENAI_API_KEY=gsk_...
OPENAI_BASE_URL=https://api.groq.com/openai/v1
OPENAI_MODEL=llama3-8b-8192
```

## Serve the built frontend

```bash
cd ..\frontend
npm run build
mkdir ..\backend\static 2>nul
xcopy /E /I /Y dist\* ..\backend\static\
```

Now `uv run uvicorn backend.main:app --host 0.0.0.0 --port 8001` serves both the API and the SPA at <http://localhost:8001>.

## CORS

CORS is preconfigured for:

- `http://localhost:5173` (Vite)
- `http://localhost:3000`
- `http://localhost:8080`
- `*` (development fallback)

In production, the SPA is served by FastAPI so CORS is not needed. Edit `src/backend/main.py` to extend the allow list.

## Endpoints

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/api/health` | Liveness + DB status |
| `GET` | `/api/areas` | List Guwahati areas |
| `GET` | `/api/incidents` | List incidents |
| `GET` | `/api/reports` | List reports |
| `GET` | `/api/resources` | List resources + assignments |
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

### WebSocket events

- `SIMULATION_TICK` — `{ tick, phase }`
- `REPORT_RECEIVED` — `{ report_id, source, location }`
- `INCIDENT_UPDATED` — `{ incident_id, status }`
- `RESOURCE_ASSIGNED` — `{ resource_id, incident_id, eta_minutes }`
- `PLAN_GENERATED` — `{ plan_id, assignments }`
- `INFORMATION_VOID_DETECTED` — `{ area_id, void_score }`
- `WEATHER_FORECAST_UPDATED` — `{ location_id, name, latitude, longitude, weather, prediction }` (broadcast every 6 ticks per watch location)

## Quick test commands

```bash
# health
curl http://localhost:8001/api/health

# list incidents
curl http://localhost:8001/api/incidents

# live weather forecast for Guwahati
curl http://localhost:8001/api/intelligence/predict/26.1445/91.7362

# situation summary (AI — demo response if no key)
curl -X POST http://localhost:8001/api/intelligence/situation

# start simulation, then check status
curl -X POST http://localhost:8001/api/simulation/start -H "Content-Type: application/json" -d "{}"
curl http://localhost:8001/api/simulation/status
```
