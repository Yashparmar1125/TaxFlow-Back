# TaxFlow Backend

Backend API for the TaxFlow/ComplianceOS platform, built with **Node.js + TypeScript + Express + Prisma**.
It supports CA and client workflows for onboarding, compliance tasks, document exchange, messaging, notifications, and reminder automation.

## Core capabilities

- Authentication with JWT (access/refresh) and invite-based registration
- Google OAuth integration
- Role-based access for **CA** and **CLIENT** users
- CA-side client management and onboarding
- Compliance rule and task lifecycle management
- Document upload/review workflow with metadata updates
- Real-time style communication model (threads/messages)
- Notification management (read, clear, delete)
- Scheduled cron jobs for reminders and overdue updates
- OpenAPI/Swagger docs endpoint

## Tech stack

- **Runtime:** Node.js
- **Language:** TypeScript
- **API framework:** Express 5
- **ORM/DB:** Prisma + PostgreSQL
- **Validation:** Zod
- **Auth/Security:** JWT, Helmet, CORS, rate limiting
- **File handling:** Multer
- **Testing:** Vitest + Supertest
- **Containerization:** Docker + Docker Compose (Postgres + API + Nginx)

## Project structure

```text
/tmp/workspace/Yashparmar1125/TaxFlow-Back
├── prisma/                 # Prisma schema and migrations
├── src/
│   ├── config/             # Env, Swagger, Prisma, security config
│   ├── controllers/        # Request handlers
│   ├── cron/               # Scheduled jobs (reminders/overdue)
│   ├── middlewares/        # Auth, validation, error handling
│   ├── routes/             # API route modules
│   ├── services/           # Business logic
│   ├── tests/              # Unit + integration tests
│   ├── app.ts              # Express app wiring
│   └── server.ts           # Server bootstrap and shutdown hooks
├── docker-compose.yml
├── Dockerfile
└── package.json
```

## Prerequisites

- Node.js 20+
- npm 9+
- PostgreSQL 16+ (or Docker)

## Environment setup

1. Create env file:

```bash
cp /tmp/workspace/Yashparmar1125/TaxFlow-Back/.env.example /tmp/workspace/Yashparmar1125/TaxFlow-Back/.env
```

2. Update required values in `.env`.

### Important environment variables

| Variable | Required | Notes |
|---|---|---|
| `NODE_ENV` | Yes | `development` / `production` / `test` |
| `PORT` | Yes | API server port |
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `JWT_SECRET` | Yes | Min length 10 |
| `JWT_REFRESH_SECRET` | Yes | Min length 10 |
| `ALLOWED_ORIGINS` | Yes | Comma-separated CORS origins |
| `GOOGLE_CLIENT_ID` | Yes | Google OAuth |
| `GOOGLE_CLIENT_SECRET` | Yes | Google OAuth |
| `GOOGLE_REDIRECT_URI` | Yes | Google OAuth callback |
| `GOOGLE_APPLICATION_CREDENTIALS` | Optional | Service account JSON path |
| `FIREBASE_SERVICE_ACCOUNT_PATH` | Optional | Firebase credentials file path |
| `FIREBASE_SERVICE_ACCOUNT_JSON` | Optional | Inline Firebase credentials JSON |
| `FIREBASE_DATABASE_URL` | Optional | Firebase realtime DB URL |

## Local development

```bash
cd /tmp/workspace/Yashparmar1125/TaxFlow-Back
npm install
npm run prisma:generate
npm run prisma:migrate
npm run dev
```

API will run at: `http://localhost:4000` (or your configured `PORT`)

## Docker run

```bash
cd /tmp/workspace/Yashparmar1125/TaxFlow-Back
docker compose up --build
```

Services:
- Postgres: `localhost:5432`
- API: internal service (proxied by Nginx)
- Nginx: `http://localhost` / `https://localhost` (depending on cert setup)

## API documentation

Swagger UI is exposed at:

- `GET /api/docs`

Health checks:

- `GET /`
- `GET /api/v1/health`

## Main API route groups (v1)

- `/api/v1/auth` - auth, token, invite verification, firebase sync
- `/api/v1/users` - authenticated user profile
- `/api/v1/ca` - CA onboarding, dashboard, clients, CA tasks/rules
- `/api/v1/client` - client onboarding, claim invite, client task views
- `/api/v1/documents` - upload and document status/metadata operations
- `/api/v1/messages` - conversation threads and task messages
- `/api/v1/notifications` - list/read/delete/clear notifications

## Available npm scripts

- `npm run dev` - start development server with nodemon + tsx
- `npm run build` - generate Prisma client and compile TypeScript
- `npm run start` - run compiled app from `dist`
- `npm test` - run Vitest test suite
- `npm run test:watch` - run Vitest in watch mode
- `npm run test:coverage` - generate coverage report
- `npm run prisma:generate` - generate Prisma client
- `npm run prisma:migrate` - run Prisma migrations (dev)
- `npm run prisma:push` - push schema directly to DB
- `npm run prisma:reset` - reset DB via Prisma
- `npm run prisma:studio` - open Prisma Studio

## Notes

- Server starts cron jobs on boot (`src/cron/index.ts`).
- App includes Helmet, CORS, cookie parsing, global/auth rate limiting, and centralized error handling.
- If Firebase credentials are absent, Firebase-dependent features may fail at runtime.
