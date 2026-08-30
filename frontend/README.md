# PRISM Frontend

React + TypeScript + Vite command-centre dashboard for PRISM.

## Stack

- React 19
- TypeScript
- Vite
- MapLibre GL JS + PMTiles
- Framer Motion
- Lucide icons
- ECharts (optional)
- Tailwind CSS
- Three.js (resource visualisation)

## Run

In one terminal start the backend (see `../backend/README.md`):

```bash
cd backend
uv run uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload
```

In another terminal:

```bash
cd frontend
npm install
npm run dev
```

Open <http://localhost:5173>.

The Vite dev server proxies `/api/*` and `/api/simulation/ws/*` to `http://localhost:8000`. No CORS setup needed in development.

## Build for production

```bash
npm run build
```

Output goes to `frontend/dist/`. Copy it into the backend static dir to ship as a single server:

```bash
mkdir ..\backend\static
xcopy /E /I /Y dist\* ..\backend\static\
# macOS / Linux: cp -r dist/* ../backend/static/
```

Then start only the backend — it serves both the API and the SPA at <http://localhost:8000>.

## Configuration

`frontend/.env.development` and `frontend/.env.production`:

| Variable | Purpose | Default |
| --- | --- | --- |
| `VITE_API_URL` | Backend origin. Empty = use Vite proxy | empty |

If `VITE_API_URL` is set (e.g. `http://localhost:8000`), the frontend calls the API directly and opens the WebSocket against that host. If empty, it relies on the Vite dev server proxy and uses `window.location.host` for the WebSocket — this is the recommended setup.

## Project layout

```
frontend/
├── public/
│   └── data/guwahati/      Local map data (GeoJSON + PMTiles)
├── src/
│   ├── components/         Dashboard panels
│   │   ├── TopBar.tsx
│   │   ├── LeftPanel.tsx
│   │   ├── MapView.tsx
│   │   ├── RightPanel.tsx
│   │   ├── BottomPanel.tsx
│   │   ├── WeatherPanel.tsx
│   │   ├── EmergencyBanner.tsx
│   │   ├── PrismLogo.tsx
│   │   └── ResourcesPage.tsx
│   ├── store/PrismContext.tsx   Global state (reports, incidents, plan, weather)
│   ├── services/api.ts          Backend client + WebSocket
│   ├── lib/mapStyle.ts          Map config + ward fill colours
│   ├── types/prism.ts
│   └── index.css                Design tokens (editorial / Swiss-modern)
└── vite.config.ts
```
