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

## Setup

```bash
cd backend
uv sync
```

## Environment

Copy `.env.example` to `.env` and set values as needed.

| Variable | Purpose | Default |
|---|---|---|
| `DATABASE_URL` | SQLite database URL | `sqlite:///data/prism.db` |
| `SIMULATION_SPEED_MS` | Simulation tick interval | `2000` |
| `GEMINI_API_KEY` | Google AI API key | _(empty = deterministic fallback)_ |
| `GEMINI_MODEL` | Gemini model name | `gemini-3.5-flash` |
| `GEMINI_MODEL_FALLBACKS` | Gemini fallback models (comma-separated) | `gemini-1.5-flash,gemini-flash-latest` |
| `AI_PROVIDER` | AI provider selection | _(empty = auto)_ |
| `OPENAI_API_KEY` | OpenAI-compatible API key | _(empty)_ |
| `OPENAI_BASE_URL` | OpenAI-compatible base URL | `https://api.openai.com/v1` |
| `OPENAI_MODEL` | OpenAI-compatible model name | `gpt-4o-mini` |

> The backend is designed to run without any AI key. If no provider is configured or the call fails, the system falls back to deterministic structured responses.

### Model fallbacks (Gemini)

If the primary Gemini model returns an error (404, 503, quota exhaustion, etc.), the adapter automatically retries the request with the models listed in `GEMINI_MODEL_FALLBACKS` before falling back to deterministic responses. This makes the system resilient to model deprecations and temporary outages.

### Provider selection rules

- If `AI_PROVIDER=openai`, the backend uses the OpenAI-compatible client.
- If `GEMINI_API_KEY` is set and `AI_PROVIDER` is not `openai`, the backend uses Gemini.
- Otherwise, the backend uses deterministic fallback responses.

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

## Run

```bash
uv run uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload
```

The API is available at `http://localhost:8000`.
Interactive docs: `http://localhost:8000/docs`.

## CORS

The backend allows requests from the frontend dev servers by default.

Allowed origins during development:
- `http://localhost:5173`
- `http://localhost:3000`
- `http://localhost:8080`
- `*`

If you need to extend this, edit `backend/src/backend/main.py`.

## Serve the built frontend

1. Build the frontend and copy the output into `backend/static`:

```bash
cd frontend
npm run build
mkdir -p ../backend/static
cp -r dist/* ../backend/static/
```

2. Start the backend. In addition to the API, it will serve:
- static assets under `/static`
- the frontend `index.html` under `/`

## Key Endpoints

- `GET /api/health`
- `GET /api/areas`
- `GET /api/incidents`
- `GET /api/resources`
- `GET /api/reports`
- `POST /api/intelligence/analyze`
- `POST /api/intelligence/verify`
- `POST /api/intelligence/priority`
- `POST /api/intelligence/situation`
- `POST /api/intelligence/silence`
- `GET /api/intelligence/confidence`
- `GET /api/intelligence/weather/{lat}/{lon}`
- `POST /api/intelligence/resources/plan`
- `POST /api/intelligence/query`
- `POST /api/simulation/start`
- `POST /api/simulation/pause`
- `POST /api/simulation/reset`
- `GET /api/simulation/status`
- `WS /api/simulation/ws/live`

## Testing the AI Adapter

### Gemini

```bash
curl -X POST http://localhost:8000/api/intelligence/analyze \
  -H "Content-Type: application/json" \
  -d '{"report_id":"R-001"}'
```

### OpenAI-compatible

```bash
curl -X POST http://localhost:8000/api/intelligence/analyze \
  -H "Content-Type: application/json" \
  -d '{"report_id":"R-001"}'
```

If the configured provider is unavailable, the response will be a deterministic fallback derived from the report fields.
