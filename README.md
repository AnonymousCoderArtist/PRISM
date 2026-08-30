# PRISM

PRISM = Post-Disaster Reality Intelligence & Situation Mapping.

Local-first disaster intelligence and situation-mapping prototype for the Avinya 2026 final round. Focus geography: Guwahati, Assam.

## Status

- Backend: running on `http://localhost:8000`
- Interactive docs: `http://localhost:8000/docs`
- Frontend: scaffolded (`frontend/`)

## Quickstart (Backend)

```bash
cd backend
cp .env.example .env
uv sync
uv run uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload
```

## Documentation

- `MVP.md` — product concept, architecture, API contract, and demo plan
- `backend/README.md` — backend setup, environment, and endpoints
- `AGENTS.md` — agent operating rules
- `AGENTS_BACKEND.md` — backend agent guidance
- `AGENTS_FRONTEND.md` — frontend agent guidance
