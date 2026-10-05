# Hospital Management System

A full-stack **Hospital Management System** built as a learning project.

Patients register online, browse the hospital pharmacy, place medicine orders
and follow their order history. Hospital administrators manage patients, wards,
medicine inventory and order status from a protected dashboard.

---

## Architecture

```text
React Frontend  (Vercel)
      |
      |  REST API / HTTP (JSON)
      v
Express Backend  (Render)
      |
      |  Prisma ORM
      v
PostgreSQL Database
```

The frontend and backend are **two separate applications** in one repository.
They only ever talk over HTTP, which is exactly how they will talk once
deployed.

---

## Technologies

### Frontend (`frontend/`)

| Tool | Why |
| --- | --- |
| React 19 | UI built from reusable components |
| Vite 8 | Fast dev server and production build |
| JavaScript (JSX) | No TypeScript in this project |
| Tailwind CSS 4 | Utility-first styling, configured in CSS |
| React Router 7 | Client-side pages and protected routes |
| Axios | HTTP requests to the backend |

### Backend (`backend/`)

| Tool | Why |
| --- | --- |
| Node.js | Runs the server |
| Express 5 | Routing, middleware and JSON APIs |
| JavaScript (CommonJS) | No TypeScript in this project |
| PostgreSQL | Relational database |
| Prisma ORM | Schema, migrations and typed-safe queries |
| jsonwebtoken | JWT creation and verification |
| bcryptjs | Password hashing |
| express-validator | Request validation |
| cors | Allows the Vercel frontend to call the API |
| morgan | Request logging in development |

---

## Project structure

```text
hospital-management/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── common/     shared pieces (loading, errors)
│   │   │   ├── layout/     navbar, footer
│   │   │   └── ui/         small reusable UI widgets
│   │   ├── context/        auth and cart state
│   │   ├── hooks/          custom reusable hooks
│   │   ├── layouts/        page shells with <Outlet />
│   │   ├── pages/
│   │   │   ├── auth/       login, register
│   │   │   ├── patient/    patient dashboard, profile, orders
│   │   │   ├── pharmacy/   medicine list, details, cart
│   │   │   ├── admin/      admin dashboard and management pages
│   │   │   └── shared/     home, not found
│   │   ├── services/       api.js - all backend calls live here
│   │   ├── utils/          formatting helpers
│   │   ├── App.jsx         URL map
│   │   ├── index.css       Tailwind entry + theme
│   │   └── main.jsx        React entry point
│   ├── .env.example
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
│
├── backend/
│   ├── src/
│   │   ├── config/         env values (config/index.js) + Prisma client
│   │   ├── controllers/    what happens for each route
│   │   ├── middleware/     authenticate, authorizeAdmin, validate, errors
│   │   ├── routes/         URL definitions
│   │   ├── utils/          response helpers, AppError, jwt, password
│   │   └── app.js          Express app
│   ├── prisma/             schema.prisma, migrations, seed.js
│   ├── .env.example
│   ├── server.js           starts the server
│   └── package.json
│
├── .gitignore
└── package.json
```

### Why split controllers, routes and middleware?

Each file answers one question:

- **routes** &mdash; "which URL and HTTP method goes where?"
- **middleware** &mdash; "what must pass before the handler runs?"
- **controllers** &mdash; "what does this endpoint actually do?"
- **utils** &mdash; "small shared helpers" (JWT signing, bcrypt hashing, response
  envelopes).

This keeps any file short enough to read in one go.

---

## Getting started

### 1. Install dependencies

```bash
# once, from the root folder
npm run install:all

# or per application
cd backend  && npm install
cd frontend && npm install
```

### 2. Configure PostgreSQL

Create a database and a user, for example:

```bash
sudo -u postgres psql
```

```sql
CREATE USER hospital WITH PASSWORD 'your_password';
CREATE DATABASE hospital_management OWNER hospital;
```

### 3. Configure environment variables

```bash
# backend
cd backend
cp .env.example .env
```

Then edit `backend/.env`:

```env
NODE_ENV=development
PORT=5000
DATABASE_URL="postgresql://hospital:your_password@localhost:5432/hospital_management?schema=public"
JWT_SECRET=your_long_random_string
JWT_EXPIRES_IN=7d
CORS_ORIGIN=http://localhost:5173
```

`CORS_ORIGIN` accepts a comma-separated list when the frontend runs on a
different port, for example `http://localhost:5173,http://localhost:5174`.
In development the browser rarely needs it at all, because the Vite proxy makes
the API look like it lives on the same origin.

Generate a strong `JWT_SECRET`:

```bash
openssl rand -base64 48
```

```bash
# frontend
cd frontend
cp .env.example .env
```

`frontend/.env` can stay empty locally, because the Vite dev server proxies
`/api` to `http://localhost:5000`. Set `VITE_API_URL` only for production.

**Never commit `.env`.** Both `.gitignore` files exclude it. `.env.example` is
the committed template and contains no real secrets.

### 4. Database migrations and seed

```bash
cd backend
npx prisma migrate dev --name init   # create tables
node prisma/seed.js                  # dummy development data
```

Or simply:

```bash
npm run setup
```

### 5. Start both applications

```bash
# terminal 1 - backend on http://localhost:5000
cd backend
npm run dev

# terminal 2 - frontend on http://localhost:5173
cd frontend
npm run dev
```

Open <http://localhost:5173>. The home page calls `GET /api/health` and shows
"Connected to the backend" when both are running.

---

## API overview

All endpoints are prefixed with `/api`.

### Health

```text
GET  /api/health
```

### Authentication (Phase 3)

```text
POST /api/auth/register
POST /api/auth/login
GET  /api/auth/me      (any logged-in user)
```

### Patients (Phase 4)

```text
POST /api/patients
GET  /api/patients/me
PUT  /api/patients/me
GET  /api/patients          (admin)
GET  /api/patients/:id      (admin, or the owner)
```

### Medicines (Phase 5)

```text
GET    /api/medicines       (any logged-in user)
GET    /api/medicines/:id   (any logged-in user)
POST   /api/medicines       (admin)
PUT    /api/medicines/:id   (admin)
DELETE /api/medicines/:id   (admin)
```

### Orders (Phase 6)

```text
POST /api/orders
GET  /api/orders/my-orders
GET  /api/orders/:id
GET  /api/orders            (admin)
PUT  /api/orders/:id/status (admin)
```

### Wards (Phase 7)

```text
GET    /api/wards
GET    /api/wards/:id
POST   /api/wards              (admin)
PUT    /api/wards/:id          (admin)
DELETE /api/wards/:id          (admin)
POST   /api/wards/:wardId/patients/:patientId   (admin)
DELETE /api/wards/:wardId/patients/:patientId   (admin)
```

### Admin (Phase 3+)

```text
GET /api/admin/dashboard      (admin only)
```

### Query parameters for `GET /api/medicines`

```text
q=<text>            search name and description
category=<text>     exact category (case-insensitive)
inStock=true|false
lowStock=true|false stock at or below the medicine's own lowStockThreshold
expired=true|false
```

### Response shapes used by the frontend

```js
GET  /api/medicines      -> data.medicines[]
GET  /api/medicines/:id  -> data.medicine
POST /api/medicines      -> data.medicine          (201)
DELETE /api/medicines/:id-> data.message

GET  /api/patients       -> data.patients[]
GET  /api/patients/:id   -> data.patient
POST /api/orders         -> data.order             (201)
GET  /api/orders         -> data.orders[]
PUT  /api/orders/:id/status -> data.order

GET  /api/wards          -> data.wards[]           each with `occupancy`
GET  /api/wards/:id      -> data.ward              includes `patients[]`
POST /api/wards          -> data.ward              (201)
DELETE /api/wards/:id    -> data.message

POST /api/wards/:wardId/patients/:patientId -> data { message, patient, ward }
DELETE /api/wards/:wardId/patients/:patientId -> data { message, patient, ward }

GET  /api/admin/dashboard -> data { stats, wards, lowStockMedicines,
                                expiredMedicines, recentPatients, recentOrders }
GET  /api/health         -> data { uptime, timestamp }
GET  /api/auth/me        -> data.user { id, fullName, email, role, phone, address }
```

Money values are Prisma `Decimal` columns, so they arrive as JSON strings.
Always convert with `Number(...)` before arithmetic (see `utils/format.js`).

---

## Frontend routes

The URL map lives in `frontend/src/App.jsx`.

```text
Public
  /                        home, pings GET /api/health
  /login                   login (redirects admins to /admin/dashboard)
  /register                patient self-registration

Logged in (any role)
  /patient/dashboard        summary, recent orders, in-stock medicines
  /patient/profile         create or update the patient record
  /patient/orders          own order history
  /pharmacy                medicine list with search + category filter
  /pharmacy/:id            medicine details
  /cart                    cart and checkout

Admin only
  /admin/dashboard         statistics, low stock, expired, recent activity
  /admin/patients          searchable patient table
  /admin/patients/:id      patient record, ward assignment, order history
  /admin/wards             ward CRUD with occupancy bars
  /admin/pharmacy          inventory table with restock/delete
  /admin/pharmacy/new      create medicine form
  /admin/pharmacy/:id/edit edit medicine form
  /admin/orders            all orders with status updates
```

`ProtectedRoute` sends logged-out visitors to `/login` and patients who try an
admin URL back to `/patient/dashboard`. That is a UX convenience only: the real
protection is `authenticate` and `authorizeAdmin` on the backend.

---

## How authentication works

1. The user posts email and password to `POST /api/auth/login`.
2. The backend finds the user and compares the password with **bcrypt**.
3. On a match it signs a **JWT** containing the user's `id` and `role`.
4. The frontend stores that token and sends it on every request:

   ```text
   Authorization: Bearer <token>
   ```

5. The `authenticate` middleware verifies the token and attaches the user to
   `req.user`.
6. `authorizeAdmin` checks `req.user.role === 'ADMIN'` and responds
   **403 Forbidden** otherwise.

Frontend route guards are for user experience only. **The backend is the real
security boundary** &mdash; hiding an admin page in React does not protect
anything, so every admin route also requires `authenticate` + `authorizeAdmin`.

---

## Development admin credentials

The seed script creates **dummy** development data only:

```text
email:    admin@hospital.test
password: Admin@12345
```

These are fake accounts for local development. Change or delete them before any
real deployment.

---

## Deployment

Nothing has been deployed. Follow these steps when you are ready.

`render.yaml` (repo root) and `frontend/vercel.json` are committed so the setup
below is declarative rather than something you retype in dashboards.

### Backend on Render

1. Push the repository to GitHub.
2. In Render, create a **Web Service** connected to the repo. Root directory:
   `backend`. (Or pick **Blueprints** and let it read `render.yaml`.)
3. Build command:

   ```bash
   npm install && npx prisma generate && npx prisma migrate deploy
   ```

4. Start command: `npm start`
5. Health check path: `/api/health`
6. Environment variables (Render dashboard):

   ```text
   NODE_ENV=production
   DATABASE_URL=<your PostgreSQL connection string>
   JWT_SECRET=<long random string>
   JWT_EXPIRES_IN=7d
   CORS_ORIGIN=https://your-app.vercel.app
   ```

   Render sets `PORT` automatically, and the server listens on it.

### Frontend on Vercel

1. Import the same repository. Root directory: `frontend`. Framework preset:
   Vite. Build command: `npm run build`. Output directory: `dist`.
2. Environment variable:

   ```text
   VITE_API_URL=https://your-backend.onrender.com/api
   ```

3. Deploy, then add the resulting `https://*.vercel.app` URL to the backend's
   `CORS_ORIGIN` (add extra preview URLs if you use them).

`frontend/vercel.json` rewrites every path to `index.html`. Without it,
refreshing a deep link such as `/admin/dashboard` would ask Vercel for a file
that does not exist and show a 404 instead of the React app.

### Environment variable summary

| App | Variable | Purpose |
| --- | --- | --- |
| backend | `NODE_ENV` | development or production |
| backend | `PORT` | port to listen on (Render sets this) |
| backend | `DATABASE_URL` | PostgreSQL connection string |
| backend | `JWT_SECRET` | token signing secret |
| backend | `JWT_EXPIRES_IN` | token lifetime, e.g. `7d` |
| backend | `CORS_ORIGIN` | allowed frontend origins, comma separated |
| frontend | `VITE_API_URL` | backend API base URL including `/api` |

---

## Build status

```bash
cd frontend && npm run lint    # oxlint: 0 errors
cd frontend && npm run build   # verified passing
cd backend  && npm start       # verified running on port 5000
```

### Automated verification

`backend/scripts/smoke-test.js` exercises the whole API with plain `fetch`: no
test framework to install. It covers authentication, validation, role
enforcement, patient profiles, pharmacy filtering and CRUD, order totals and
stock rollback, order status rules, ward capacity and admin dashboard stats.

```bash
# terminal 1
cd backend && npm start

# terminal 2, from the repo root
npm run seed    # reset to the known demo data
npm test        # 67 checks; exits non-zero if anything fails
```

The script creates a test medicine, a test user and two orders, so run
`npm run seed` afterwards to get the clean demo state back.

### Verified manually with curl

- duplicate email `409`, invalid login `401`, `GET /auth/me` never returns the
  password hash
- role in a register payload is ignored (always `PATIENT`)
- patient hitting `/api/admin/dashboard` gets `403`; missing token gets `401`
- medicine filters (`inStock`, `lowStock`, `expired`, `q`, `category`)
- deleting a medicine that past orders reference returns `409`
- concurrent orders never oversell: 5 simultaneous orders for 3 units each
  against 10 in stock succeeded 3 times and left stock at 1
- ward capacity enforced, including under 3 simultaneous assignments to a
  2-bed ward (2 accepted, 1 rejected)
- patient ID generation stays sequential under 5 simultaneous registrations

---

## License

MIT. Fake development data only &mdash; no real patient information.