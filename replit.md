# AMX ERP Suite

A production-style AI-powered Cloud ERP web application with authentication, dashboards, finance, HR, inventory, project management, analytics, and AI demand forecasting.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080)
- `pnpm --filter @workspace/amx-erp run dev` — run the frontend
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string
- Required env: `SESSION_SECRET` — JWT signing secret

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React 19 + Vite, Tailwind CSS, shadcn/ui, Wouter, React Query, Recharts, Framer Motion
- API: Express 5, bcryptjs, jsonwebtoken, Pino logging
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- OpenAPI contract: `lib/api-spec/openapi.yaml`
- DB schema: `lib/db/src/schema/` (users, finance, hr, inventory, projects, notifications)
- API routes: `artifacts/api-server/src/routes/` (auth, dashboard, finance, hr, inventory, projects, analytics, notifications, forecast)
- Frontend pages: `artifacts/amx-erp/src/pages/`
- Generated hooks: `lib/api-client-react/src/generated/`
- Generated Zod schemas: `lib/api-zod/src/generated/`

## Architecture decisions

- Contract-first API — `openapi.yaml` is single source of truth; Orval generates both React Query hooks and Zod validators
- pnpm monorepo — frontend, API, DB, and generated libs are separate packages sharing a root lockfile
- Drizzle ORM — lightweight, TypeScript-native, SQL-like query builders
- Express 5 over NestJS — lean and sufficient; native async error handling
- JWT in localStorage — acceptable for portfolio; production should use httpOnly cookies

## Product

- Authentication with role-based access (admin / manager / staff)
- Dashboard with KPI cards, revenue/expense charts, and activity feed
- Finance module: invoice CRUD + transaction tracking + summaries
- HR module: employee management + payroll records + department analytics
- Inventory module: product catalog + stock levels + low-stock alerts
- Project management: projects with nested tasks, progress tracking
- Analytics: department spending, project status, growth metrics
- AI forecasting: demand and revenue trend charts
- Notifications center with mark-read support
- Dark/light mode toggle

## Demo Credentials

- Admin: admin@amxerp.com / Admin1234!
- Manager: sarah@amxerp.com / Admin1234!
- Staff: james@amxerp.com / Admin1234!

## User preferences

- Teal-green gradient with white color scheme
- No emojis anywhere — icons only (lucide-react)
- Downloadable zip archive requested at end of project

## Gotchas

- Always run `pnpm --filter @workspace/api-spec run codegen` after changing `openapi.yaml`
- Body schemas in openapi.yaml must be entity-named (not operation-named) to avoid TS2308 collisions
- Numeric DB columns (numeric/decimal) return as strings from Drizzle — always `parseFloat()` before sending to API responses
- Frontend `BASE_PATH` and `PORT` are injected by the workflow runner — don't hardcode them

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
