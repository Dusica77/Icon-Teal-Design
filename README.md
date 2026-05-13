# AMX ERP Suite

A production-style, AI-powered Cloud ERP web application built as a full-stack portfolio project. Features a clean teal-green dashboard UI with authentication, finance, HR, inventory, project management, analytics, and AI demand forecasting.

---

## Features

- **Authentication & Role-Based Access** — JWT login/register with admin, manager, and staff roles
- **Dashboard & Analytics** — KPI cards, revenue charts, and recent activity feed
- **Finance Management** — Invoice CRUD, transaction tracking, and financial summaries
- **HR & Payroll** — Employee management, payroll records, and department analytics
- **Inventory Management** — Product catalog, stock levels, low-stock alerts
- **Project Management** — Projects with nested task tracking and progress
- **Analytics** — Department spending, project status breakdowns, growth metrics
- **AI Demand Forecasting** — Simulated forecasting charts for product demand and revenue trends
- **Notifications** — In-app notification center with mark-read support
- **Dark/Light Mode** — Full theme toggle support

---

## Tech Stack

### Frontend
- React 19 + Vite
- TypeScript
- Tailwind CSS + shadcn/ui
- Wouter (routing)
- React Query (TanStack)
- React Hook Form + Zod
- Recharts
- Lucide React (icons)
- Framer Motion (animations)

### Backend
- Express 5 (Node.js)
- TypeScript
- Drizzle ORM
- PostgreSQL
- bcryptjs (password hashing)
- jsonwebtoken (JWT auth)
- Pino (structured logging)
- Zod (request/response validation)

### Tooling
- pnpm workspaces (monorepo)
- Orval (OpenAPI codegen → React Query hooks + Zod schemas)
- esbuild (API server bundler)

---

## Project Structure

```
amx-erp-suite/
├── artifacts/
│   ├── amx-erp/               # React + Vite frontend
│   │   ├── src/
│   │   │   ├── pages/         # Login, Register, Dashboard, Finance, HR, Inventory, Projects, Analytics, Forecast, Notifications, Settings
│   │   │   ├── components/    # Shared UI components (shadcn/ui)
│   │   │   ├── App.tsx        # Router + layout setup
│   │   │   └── index.css      # Teal-green theme variables
│   │   └── vite.config.ts
│   │
│   └── api-server/            # Express 5 REST API
│       └── src/
│           ├── routes/
│           │   ├── auth.ts         # Login, register, me, logout
│           │   ├── dashboard.ts    # KPI summary, activity, revenue chart
│           │   ├── finance.ts      # Invoices + transactions
│           │   ├── hr.ts           # Employees + payroll
│           │   ├── inventory.ts    # Products + inventory summary
│           │   ├── projects.ts     # Projects + tasks (nested)
│           │   ├── analytics.ts    # Overview, dept spending, project status
│           │   ├── notifications.ts
│           │   └── forecast.ts     # AI demand + revenue forecast
│           ├── app.ts
│           └── index.ts
│
├── lib/
│   ├── api-spec/
│   │   └── openapi.yaml       # OpenAPI 3.1 contract (source of truth)
│   ├── api-client-react/      # Generated React Query hooks (Orval)
│   ├── api-zod/               # Generated Zod schemas (Orval)
│   └── db/
│       └── src/schema/        # Drizzle ORM schema
│           ├── users.ts
│           ├── finance.ts
│           ├── hr.ts
│           ├── inventory.ts
│           ├── projects.ts
│           └── notifications.ts
│
├── pnpm-workspace.yaml
├── package.json
└── README.md
```

---

## Database Schema

| Table           | Key Fields                                                       |
|-----------------|------------------------------------------------------------------|
| `users`         | id, name, email, password_hash, role, created_at                 |
| `employees`     | id, name, email, department, position, salary, status, joined_at |
| `payrolls`      | id, employee_id, month, year, gross_salary, deductions, net_salary |
| `invoices`      | id, invoice_number, client_name, amount, status, due_date        |
| `transactions`  | id, type, amount, category, description, date                    |
| `products`      | id, name, sku, category, quantity, price, reorder_level, status  |
| `projects`      | id, name, description, status, priority, start_date, end_date, budget, progress |
| `tasks`         | id, project_id, title, description, status, priority, assignee   |
| `notifications` | id, title, message, type, read                                   |

---

## API Endpoints

### Auth
| Method | Path             | Description          |
|--------|------------------|----------------------|
| POST   | /api/auth/login  | Login (returns JWT)  |
| POST   | /api/auth/register | Register new user  |
| GET    | /api/auth/me     | Get current user     |
| POST   | /api/auth/logout | Logout               |

### Dashboard
| Method | Path                         | Description             |
|--------|------------------------------|-------------------------|
| GET    | /api/dashboard/summary       | KPI metrics             |
| GET    | /api/dashboard/recent-activity | Activity feed         |
| GET    | /api/dashboard/revenue-chart | Monthly revenue data    |

### Finance
| Method | Path                        | Description             |
|--------|-----------------------------|-------------------------|
| GET    | /api/finance/invoices       | List invoices           |
| POST   | /api/finance/invoices       | Create invoice          |
| GET    | /api/finance/invoices/:id   | Get invoice             |
| PATCH  | /api/finance/invoices/:id   | Update invoice          |
| DELETE | /api/finance/invoices/:id   | Delete invoice          |
| GET    | /api/finance/transactions   | List transactions       |
| POST   | /api/finance/transactions   | Create transaction      |
| GET    | /api/finance/summary        | Finance summary metrics |

### HR
| Method | Path                  | Description          |
|--------|-----------------------|----------------------|
| GET    | /api/hr/employees     | List employees       |
| POST   | /api/hr/employees     | Create employee      |
| GET    | /api/hr/employees/:id | Get employee         |
| PATCH  | /api/hr/employees/:id | Update employee      |
| DELETE | /api/hr/employees/:id | Delete employee      |
| GET    | /api/hr/payrolls      | List payroll records |
| POST   | /api/hr/payrolls      | Create payroll entry |
| GET    | /api/hr/summary       | HR summary metrics   |

### Inventory
| Method | Path                        | Description              |
|--------|-----------------------------|--------------------------|
| GET    | /api/inventory/products     | List products            |
| POST   | /api/inventory/products     | Create product           |
| GET    | /api/inventory/products/:id | Get product              |
| PATCH  | /api/inventory/products/:id | Update product           |
| DELETE | /api/inventory/products/:id | Delete product           |
| GET    | /api/inventory/summary      | Inventory summary        |

### Projects
| Method | Path                                      | Description    |
|--------|-------------------------------------------|----------------|
| GET    | /api/projects                             | List projects  |
| POST   | /api/projects                             | Create project |
| GET    | /api/projects/:id                         | Get project    |
| PATCH  | /api/projects/:id                         | Update project |
| DELETE | /api/projects/:id                         | Delete project |
| GET    | /api/projects/:projectId/tasks            | List tasks     |
| POST   | /api/projects/:projectId/tasks            | Create task    |
| PATCH  | /api/projects/:projectId/tasks/:taskId    | Update task    |
| DELETE | /api/projects/:projectId/tasks/:taskId    | Delete task    |

### Analytics
| Method | Path                              | Description              |
|--------|-----------------------------------|--------------------------|
| GET    | /api/analytics/overview           | Growth metrics overview  |
| GET    | /api/analytics/department-spending | Salary by department    |
| GET    | /api/analytics/project-status     | Project status counts    |

### Notifications
| Method | Path                           | Description              |
|--------|--------------------------------|--------------------------|
| GET    | /api/notifications             | List all notifications   |
| PATCH  | /api/notifications/:id/read    | Mark notification read   |
| PATCH  | /api/notifications/read-all    | Mark all as read         |

### AI Forecasting
| Method | Path                    | Description              |
|--------|-------------------------|--------------------------|
| GET    | /api/forecast/demand    | Product demand forecast  |
| GET    | /api/forecast/revenue   | Revenue forecast         |

---

## Getting Started

### Prerequisites

- Node.js 20+
- pnpm 9+
- PostgreSQL database (connection string required)

### Setup

```bash
# 1. Clone the repository
git clone <your-repo-url>
cd amx-erp-suite

# 2. Install dependencies
pnpm install

# 3. Set environment variables
cp .env.example .env
# Edit .env and add your DATABASE_URL and SESSION_SECRET

# 4. Push database schema
pnpm --filter @workspace/db run push

# 5. Run the API server (development)
pnpm --filter @workspace/api-server run dev

# 6. Run the frontend (in a separate terminal)
pnpm --filter @workspace/amx-erp run dev
```

### Environment Variables

| Variable         | Description                          | Required |
|------------------|--------------------------------------|----------|
| `DATABASE_URL`   | PostgreSQL connection string          | Yes      |
| `SESSION_SECRET` | Secret key for JWT signing            | Yes      |
| `PORT`           | Server port (auto-set by platform)    | Auto     |
| `BASE_PATH`      | Frontend base URL path (auto-set)     | Auto     |

### Demo Credentials

| Role    | Email                  | Password     |
|---------|------------------------|--------------|
| Admin   | admin@amxerp.com       | Admin1234!   |
| Manager | sarah@amxerp.com       | Admin1234!   |
| Staff   | james@amxerp.com       | Admin1234!   |

---

## Development Commands

```bash
# Run full typecheck across all packages
pnpm run typecheck

# Build all packages
pnpm run build

# Regenerate API hooks and Zod schemas from OpenAPI spec
pnpm --filter @workspace/api-spec run codegen

# Push DB schema changes (dev only)
pnpm --filter @workspace/db run push

# Typecheck the frontend only
pnpm --filter @workspace/amx-erp run typecheck

# Typecheck the API server only
pnpm --filter @workspace/api-server run typecheck
```

---

## Architecture Decisions

- **Contract-first API** — `lib/api-spec/openapi.yaml` is the single source of truth. Orval generates both React Query hooks (frontend) and Zod validators (backend) from it, ensuring the two sides never drift.
- **Monorepo with pnpm workspaces** — Frontend, API server, DB, and generated libs are separate packages sharing a root lockfile. This keeps dependency management clean without requiring a build orchestrator.
- **Drizzle ORM over Prisma** — Drizzle is lightweight, fully TypeScript-native, and uses SQL-like query builders rather than magic abstractions, making it more transparent and easier to audit.
- **Express 5 over NestJS** — NestJS adds substantial boilerplate for a portfolio project. Express 5's native async error handling is sufficient and keeps the codebase lean.
- **JWT in localStorage** — For a portfolio/demo project, localStorage is acceptable. Production deployments should use httpOnly cookies with CSRF protection.
- **Simulated AI forecasting** — The `/forecast/*` endpoints return algorithmically varied data seeded from real inventory quantities. Integrating Prophet or scikit-learn would be the next step for real ML predictions.

---

## Roadmap / Next Steps

- [ ] Real ML forecasting service (Python FastAPI + Prophet/scikit-learn)
- [ ] Role-based route guards on the API (middleware)
- [ ] File upload for employee avatars and invoice attachments
- [ ] Email notifications (invoice due, low stock alerts)
- [ ] Audit log for all mutations
- [ ] Docker Compose setup for local dev
- [ ] GitHub Actions CI/CD pipeline
- [ ] Redis caching for dashboard summary endpoints

---

## License

MIT — Free to use for personal and commercial projects.

## 
DUSICA S - https://github.com/Dusica77/
