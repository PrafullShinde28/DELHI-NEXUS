# Delhi Nexus

Delhi Nexus is a smart-city intelligence dashboard for monitoring and managing urban operations in Delhi NCR. It combines real-time traffic, pollution, weather, flood, hospital, and crime data into a modern operational dashboard with AI-driven forecasting and alerts.

The project is built as a full-stack application with:
- React + TypeScript + Vite for the frontend
- Express + Node.js for the backend API and WebSocket server
- PostgreSQL + Drizzle ORM for storage
- FastAPI + Python + scikit-learn for prediction and anomaly detection
- Mapbox / map-based visualizations for urban monitoring

---

## Overview

Delhi Nexus is designed to help civic operators and analysts understand city conditions in real time and make faster decisions. The system includes:

- Live traffic and congestion monitoring
- Pollution and AQI tracking
- Flood risk monitoring and alerts
- Crime incident data and reporting
- Hospital and emergency-service awareness
- AI-powered predictions for traffic and city conditions
- Real-time dashboard updates through Socket.IO
- Responsive, dark-mode analytics UI

---

## Features

### Smart city dashboard
- Multi-panel dashboards for city performance and situational awareness
- KPI cards for live conditions and risk indicators
- Map-based views for Delhi regions and infrastructure data

### Real-time updates
- WebSocket-based push updates for live events
- Automated cron-driven monitoring and data refresh
- Background services for flood, crime, and hospital alert generation

### AI forecasting
- Python AI service using FastAPI and scikit-learn
- Traffic prediction models
- AQI / pollution predictions
- City-level forecast generation
- Anomaly detection for risky conditions

### Data and monitoring layer
- PostgreSQL integration via Drizzle ORM
- Historical data tracking and zone-level aggregation
- Alert list and dashboard summaries
- Risk scoring for urban hotspots

---

## Tech Stack

### Frontend
- React 18
- TypeScript
- Vite
- Tailwind CSS
- shadcn/ui style component system
- Recharts for charts
- React Map GL / Mapbox GL for maps
- Wouter for routing
- Framer Motion for UI animation

### Backend
- Node.js
- Express
- Socket.IO
- Drizzle ORM
- PostgreSQL
- node-cron for scheduled jobs

### AI / Analytics Service
- Python 3.11+
- FastAPI
- Uvicorn
- NumPy
- Pandas
- scikit-learn
- statsmodels

---

## Project Structure

```text
Delhi-nexus/
├── client/                  # React frontend
│   ├── src/
│   ├── public/
│   └── requirements.md
├── server/                 # Backend server and services
│   ├── ai_service.py       # FastAPI prediction service
│   ├── cron.ts            # Scheduled jobs
│   ├── db.ts              # DB config
│   ├── index.ts           # Express app bootstrap
│   ├── routes.ts          # API route configuration
│   ├── storage.ts         # Data access layer
│   ├── vite.ts            # Vite dev setup
│   ├── ws-crime.ts       # WebSocket crime logic
│   ├── services/          # Traffic, flood, crime, hospital logic
│   └── requirements.txt   # Python dependencies
├── shared/                 # Shared schemas and route definitions
├── drizzle/                # Drizzle migration metadata
├── script/                 # Build script
├── docker/                 # Docker-related assets
├── .env                    # Local environment variables
├── docker-compose.yml      # Multi-container local setup
├── Dockerfile.node         # Node app container
├── Dockerfile.python       # Python AI service container
├── drizzle.config.ts       # Drizzle config
├── package.json            # Node scripts and dependencies
├── pyproject.toml          # Python project metadata
├── tailwind.config.ts     # Tailwind config
├── tsconfig.json          # TypeScript config
├── vite.config.ts         # Vite config
├── main.py                # Generic Python entrypoint
└── README.md              # Project documentation
```

---

## Prerequisites

Before running the app, make sure you have:

- Node.js 20+ recommended
- Python 3.11+
- PostgreSQL 15+ (or use Docker Compose)
- Redis (used by the project config and some services)
- A Mapbox token for map rendering

---

## Environment Variables

The project uses environment variables defined in `.env`.

Example configuration:

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/smartcity
SESSION_SECRET=devsecret
VITE_MAPBOX_TOKEN=your_mapbox_token
REDIS_URL=redis://localhost:6379
AI_SERVICE_URL=http://localhost:5001
NODE_ENV=development
PORT=5000
WAQI_KEY=your_aqi_key
TOMTOM_API_KEY=your_tomtom_key
```

### Variable notes
- `DATABASE_URL`: PostgreSQL connection string
- `VITE_MAPBOX_TOKEN`: required for map rendering
- `AI_SERVICE_URL`: FastAPI prediction service URL
- `WAQI_KEY`: AQI provider API key
- `TOMTOM_API_KEY`: traffic or navigation data key
- `REDIS_URL`: Redis connection for the app stack

> If you are using Docker Compose, the service configuration already wires these values for containers.

---

## Installation

### 1) Install Node dependencies

```bash
npm install
```

### 2) Install Python dependencies

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r server/requirements.txt
```

On Windows PowerShell:

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r server/requirements.txt
```

### 3) Configure database

If using a local PostgreSQL instance, create the database and ensure `DATABASE_URL` matches the database name and credentials.

Then push the schema:

```bash
npx drizzle-kit push
```

---

## Running the Project

### Development mode

This project starts both the Python AI service and the Node backend together:

```bash
npm run dev
```

This will launch:
- FastAPI server on `http://localhost:5001`
- Express app on `http://localhost:5000`
- frontend served through the dev stack

### Production build

```bash
npm run build
npm start
```

The production server serves the built frontend and API from the Node app.

### Run the WebSocket crime service separately

```bash
npm run crime-ws
```

### Type-checking

```bash
npm run check
```

---

## Docker Setup

The project includes a Docker Compose setup for local orchestration:

```bash
docker compose up --build
```

This starts:
- app service on port `5000`
- ai-service on port `5001`
- PostgreSQL on port `5432`
- Redis on port `6379`

---

## API and Service Overview

### Main app API
The backend exposes dashboard and city data routes such as:
- `/api/dashboard/overview`
- `/api/traffic/current`
- `/api/traffic/history`
- `/api/pollution/current`
- `/api/pollution/history`
- `/api/risk/list`
- `/api/crime/list`
- `/api/hospital/list`
- `/api/alerts`

### AI prediction endpoints
The Python FastAPI service includes endpoints for:
- `/health`
- `/train`
- `/predict/traffic`
- `/predict/pollution`
- `/predict/city`
- `/detect/anomaly`

These are used by the Node app to generate predictions and anomaly checks for the city dashboard.

---

## Common Workflow

1. Start PostgreSQL and Redis
2. Ensure `.env` values are correct
3. Run `npm install`
4. Run `pip install -r server/requirements.txt`
5. Run `npm run dev`
6. Open the app in the browser at the local frontend URL

---

## Notes

- The app is built around a city monitoring dashboard and is best suited for a real-time urban operations environment.
- The AI service is intentionally lightweight and uses classical machine learning models rather than a heavy deep learning stack.
- Vite development setup and backend service are coordinated together for local iteration.
- Some features depend on external API keys for AQI and mapping data.

---

## License

This project is currently configured under the MIT license in the Node package metadata.

---

## Contributing

Contributions are welcome. Suggested workflow:

1. Create a feature branch
2. Implement and validate locally
3. Run type checking and app smoke tests
4. Open a pull request with a concise summary of changes

---

## Troubleshooting

### AI service not responding
- Check that the Python service is running on port `5001`
- Verify `AI_SERVICE_URL` in `.env`
- Confirm `pip install -r server/requirements.txt` completed successfully

### Map not loading
- Set a valid `VITE_MAPBOX_TOKEN`
- Ensure environment variables are loaded before starting the app

### Database connection error
- Verify `DATABASE_URL` is correct
- Ensure PostgreSQL is running
- Run `npx drizzle-kit push` again if the schema is not synchronized

---

## Summary

Delhi Nexus is a modern smart-city analytics platform that combines dashboards, live urban monitoring, and AI-driven insight generation into a single operational workspace for Delhi NCR intelligence.
