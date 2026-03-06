# Overview

This is an **AI-Powered Smart City Digital Dashboard** focused on Delhi, India. It monitors traffic congestion and air pollution in real-time, provides AI-driven predictions and anomaly detection, and displays everything through an interactive web dashboard with maps and charts.

The application follows a microservices architecture with three main services:
1. **Frontend** — React SPA with interactive maps and data visualizations
2. **Backend API** — Node.js/Express server handling REST APIs, WebSocket connections, and scheduled data ingestion
3. **AI Service** — Python FastAPI microservice for traffic/pollution predictions and anomaly detection

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend (React + Vite)
- **Location**: `client/` directory
- **Framework**: React with Vite bundler, TypeScript
- **Styling**: Tailwind CSS with shadcn/ui component library (New York style)
- **UI Components**: Radix UI primitives wrapped in `client/src/components/ui/`
- **Routing**: `wouter` (lightweight client-side router)
- **State/Data Fetching**: TanStack React Query with 30-second polling for real-time feel
- **Charts**: Recharts (Area, Line, Bar charts for traffic/pollution data)
- **Maps**: `react-map-gl` + Mapbox GL for interactive Delhi city map visualization (requires `VITE_MAPBOX_TOKEN`)
- **Animations**: Framer Motion for transitions
- **Theme**: Dark mode by default ("Deep Space" theme with CSS custom properties)

**Pages**:
- `/` — Landing page (marketing/intro)
- `/dashboard` — Main overview with stats, map, and trend charts
- `/traffic` — Detailed traffic analytics
- `/pollution` — Air quality index monitoring
- `/predictions` — AI forecast visualizations
- `/alerts` — System alerts and anomaly notifications

**Key custom components**: `Layout` (sidebar navigation), `CityMap` (Mapbox wrapper), `StatCard` (metric display)

### Backend (Node.js + Express)
- **Location**: `server/` directory
- **Entry point**: `server/index.ts` — starts Express server, spawns Python AI service as child process
- **HTTP Server**: Express with Socket.IO for real-time WebSocket updates
- **API Routes**: Defined in `server/routes.ts`, route contracts in `shared/routes.ts`
- **Background Jobs**: `node-cron` in `server/cron.ts` periodically generates/fetches mock traffic, pollution, and weather data
- **Data Flow**: Cron jobs generate data → store in PostgreSQL → emit via Socket.IO → frontend updates
- **AI Integration**: Backend calls Python AI service at `http://localhost:5001` via REST (axios) for predictions and anomaly detection
- **Vite Dev Server**: In development, Vite middleware is used for HMR (`server/vite.ts`); in production, static files are served from `dist/public`

**API Endpoints** (prefixed with `/api`):
- `GET /api/dashboard/overview` — aggregated traffic, pollution, weather, alerts
- `GET /api/traffic/current` and `/api/traffic/history`
- `GET /api/pollution/current` and `/api/pollution/history`
- `GET /api/predictions/list` — AI predictions with optional type filter
- `GET /api/alerts` — active system alerts
- `POST /api/predictions/traffic` and `/api/predictions/pollution` — trigger AI predictions

### AI Service (Python + FastAPI)
- **Location**: `server/ai_service.py`
- **Framework**: FastAPI running on port 5001 via uvicorn
- **Endpoints**:
  - `GET /health` — health check
  - `POST /predict/traffic` — traffic congestion forecasting (mock ARIMA logic)
  - `POST /predict/pollution` — AQI prediction based on history and environmental factors
  - `POST /detect/anomaly` — anomaly detection for traffic/pollution spikes (mock Isolation Forest logic)
- **Current state**: Uses mock/simulated ML models. Production would use trained scikit-learn RandomForest, IsolationForest, and statsmodels ARIMA.
- **Started automatically** by the Node.js backend as a child process

### Database (PostgreSQL + Drizzle ORM)
- **ORM**: Drizzle ORM with PostgreSQL dialect
- **Schema**: Defined in `shared/schema.ts`
- **Config**: `drizzle.config.ts` (migrations output to `./migrations/`)
- **Connection**: Via `DATABASE_URL` environment variable, using `pg` Pool in `server/db.ts`
- **Push command**: `npm run db:push` (uses drizzle-kit push)

**Tables**:
| Table | Purpose | Key Columns |
|-------|---------|-------------|
| `traffic_data` | Vehicle density readings | `locationId`, `vehicleDensity`, `congestionIndex`, `timestamp` |
| `pollution_data` | Air quality measurements | `locationId`, `aqi`, `pm2_5`, `pm10`, `no2`, `timestamp` |
| `weather_data` | Weather conditions | `locationId`, `temperature`, `humidity`, `windSpeed`, `timestamp` |
| `predictions` | AI model outputs | `type` (traffic/pollution), `predictedValue`, `confidenceScore`, `forecastTime` |
| `alerts` | System alerts/anomalies | `type`, `severity`, `message`, `locationId`, `isActive` |

### Storage Layer
- **Location**: `server/storage.ts`
- **Pattern**: Interface `IStorage` with `DatabaseStorage` implementation
- **Operations**: CRUD for all five tables with methods like `getLatestTraffic()`, `createAlert()`, `resolveAlert()`

### Shared Code
- **Location**: `shared/` directory
- **`shared/schema.ts`**: Drizzle table definitions + Zod insert schemas + TypeScript types
- **`shared/routes.ts`**: API route contracts with path strings and Zod response schemas — used by both frontend and backend

### Build System
- **Dev**: `npm run dev` → runs `tsx server/index.ts` which starts Express + Vite dev server + Python AI service
- **Build**: `npm run build` → Vite builds frontend to `dist/public`, esbuild bundles server to `dist/index.cjs`
- **Production**: `npm start` → runs `node dist/index.cjs`
- **Port**: Application serves on port 5000 (both frontend and backend); AI service on port 5001

### Real-Time Updates
- Socket.IO server initialized in `server/routes.ts`
- Events emitted: `data_update` (new traffic/pollution data), `alert_new` (new anomaly alerts)
- Frontend can subscribe to these for live dashboard updates

## External Dependencies

### Required Services
- **PostgreSQL** — Primary database (must be provisioned; connection via `DATABASE_URL` env var)
- **Python 3.11+** — Required for AI service (FastAPI + uvicorn)

### Environment Variables
| Variable | Required | Purpose |
|----------|----------|---------|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `VITE_MAPBOX_TOKEN` | Optional | Mapbox GL access token for map visualization (falls back to placeholder) |

### Key NPM Dependencies
- `express`, `socket.io` — Server framework and WebSockets
- `drizzle-orm`, `drizzle-kit`, `pg` — Database ORM and PostgreSQL driver
- `node-cron` — Scheduled background data ingestion
- `axios` — HTTP client for AI service communication
- `@tanstack/react-query` — Frontend data fetching/caching
- `react-map-gl`, `mapbox-gl` — Map visualization
- `recharts` — Chart components
- `framer-motion` — UI animations
- `wouter` — Client-side routing
- `zod`, `drizzle-zod` — Schema validation
- Radix UI primitives + shadcn/ui — UI component library

### Python Dependencies (AI Service)
- `fastapi`, `uvicorn` — Web framework
- `pydantic` — Data validation
- Future/production: `scikit-learn`, `statsmodels`, `pandas`, `numpy`

### Optional Services
- **Redis** — Mentioned for caching (via Docker), not yet implemented in code
- **Docker** — `docker-compose` available for containerized deployment
- **Mapbox** — Map tiles (gracefully degrades without valid token)