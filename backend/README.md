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
| `GEMINI_MODEL` | Gemini model name | `gemini-1.5-flash` |
| `AI_PROVIDER` | AI provider selection | _(empty = auto)_ |
| `OPENAI_API_KEY` | OpenAI-compatible API key | _(empty)_ |
| `OPENAI_BASE_URL` | OpenAI-compatible base URL | `https://api.openai.com/v1` |
| `OPENAI_MODEL` | OpenAI-compatible model name | `gpt-4o-mini` |

> The backend is designed to run without any AI key. If no provider is configured or the call fails, the system falls back to deterministic structured responses.

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
