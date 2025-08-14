# Interface Monitoring Server

## Setup
1. `cp .env.example .env` and fill `MONGODB_URI` (Atlas), `CORS_ORIGIN` (e.g., http://localhost:5173).
2. Install: `npm i`
3. Seed (optional large dataset): `SEED_COUNT=500000 npm run seed`
4. Run: `npm run dev` (local) or `npm start` (prod)

## API
- `GET /health`
- `GET /api/summary?preset=last24h|lastWeek|lastMonth|lastHour` or `&from=ISO&to=ISO`
- `GET /api/logs?...` query: `interfaceName,integrationKey,status,severity,search,page,limit,sortBy,sortDir,preset/from/to`
- `POST /api/logs` body: `{ interfaceName, integrationKey, status, severity, message, meta }`
- `GET /api/stream` (SSE)
