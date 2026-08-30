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

> The backend is designed to run without `GEMINI_API_KEY`. If it is missing or the call fails, the system falls back to deterministic structured responses.

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

1. Add your key to `.env`:
   ```bash
   GEMINI_API_KEY=your-key-here
   ```
2. Restart the backend.
3. Call:
   ```bash
   curl -X POST http://localhost:8000/api/intelligence/analyze \
     -H "Content-Type: application/json" \
     -d '{"report_id":"R-001"}'
   ```

If Gemini is unavailable, the response will be a deterministic fallback derived from the report fields.
