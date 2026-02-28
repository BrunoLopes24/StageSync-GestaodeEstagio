# StageSync - Gestão de Estágio

A full-stack internship management platform for tracking 640-hour internship progress with intelligent completion forecasting.

## Features

- **Dashboard** — Real-time progress tracking with completion percentage, remaining hours, and predicted end date
- **Daily Work Log** — CRUD operations for daily hour entries with optional notes
- **Smart Time Engine** — Predicts completion date excluding Portuguese weekends and national holidays (13/year)
- **Calendar View** — Monthly overview with color-coded days (worked, holidays, weekends)
- **Reports** — Weekly and monthly summaries with charts
- **Settings** — Configurable daily hours, working days, start date, and holiday management

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite, TypeScript, Tailwind CSS, React Query, Recharts |
| Backend | Node.js, Express, TypeScript, Prisma ORM, Zod |
| Database | PostgreSQL 16 |
| Infrastructure | Docker, Docker Compose, Nginx |

## Quick Start

### Prerequisites

- [Docker](https://www.docker.com/) and Docker Compose
- [Node.js 20+](https://nodejs.org/) (for local development)

### Production (Docker)

```bash
# Clone the repository
git clone <repo-url>
cd StageSync_Gestao_Estagio

# Copy environment variables
cp .env.example .env
# Edit .env with your preferred passwords

# Start all services
cd docker
docker compose up --build -d

# Seed the database (first time only)
docker compose exec backend npx prisma db seed
```

The application will be available at `http://localhost`.

### Development

```bash
# Start the database
cd docker
docker compose -f docker-compose.dev.yml up db -d

# Backend
cd ../backend
cp ../.env.example .env
# Edit .env: DATABASE_URL=postgresql://stagesync:stagesync_dev@localhost:5432/stagesync
npm install
npx prisma migrate dev
npx prisma db seed
npm run dev

# Frontend (new terminal)
cd ../frontend
npm install
npm run dev
```

- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:3000/api/v1`
- API Health: `http://localhost:3000/api/v1/health`

## API Endpoints

| Method | Endpoint | Description |
|--------|---------|-------------|
| GET | `/api/v1/health` | Health check |
| GET | `/api/v1/dashboard/stats` | Dashboard statistics with prediction |
| GET | `/api/v1/work-logs` | List work logs (supports `?from=&to=&page=&limit=`) |
| POST | `/api/v1/work-logs` | Create work log |
| PUT | `/api/v1/work-logs/:id` | Update work log |
| DELETE | `/api/v1/work-logs/:id` | Delete work log |
| GET | `/api/v1/settings` | Get settings |
| PUT | `/api/v1/settings` | Update settings |
| GET | `/api/v1/holidays?year=2026` | List holidays |
| POST | `/api/v1/holidays/generate/:year` | Generate holidays for a year |
| GET | `/api/v1/reports/weekly?date=YYYY-MM-DD` | Weekly summary |
| GET | `/api/v1/reports/monthly?month=YYYY-MM` | Monthly summary |

## Project Structure

```
├── backend/          # Express API + Prisma
│   ├── prisma/       # Schema, migrations, seed
│   └── src/
│       ├── controllers/
│       ├── services/  # Business logic (time-engine, reports)
│       ├── routes/
│       ├── middleware/ # Auth placeholder, validation, errors
│       ├── schemas/   # Zod validation
│       └── utils/     # Easter algorithm, Portuguese holidays
├── frontend/         # React SPA
│   └── src/
│       ├── components/ # UI, layout, dashboard, work-log, calendar, reports, settings
│       ├── pages/
│       ├── hooks/      # React Query hooks
│       ├── lib/        # API client, utilities
│       └── types/
└── docker/           # Dockerfiles, nginx, compose files
```

## Authentication

The platform is designed to be auth-ready. To add authentication:

1. Replace `backend/src/middleware/auth-placeholder.ts` with JWT/session verification
2. Add a `User` model to Prisma schema with `userId` FK on `WorkLog` and `Settings`
3. Add login page to frontend and pass token in API headers

## License

MIT
