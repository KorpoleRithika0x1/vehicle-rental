# Vehicle Rental Management System

Full-stack vehicle rental platform with:

- `FastAPI` + async `SQLAlchemy` + `MySQL 8`
- `Redis 7` caching and distributed booking locks
- `React 18` + `Vite` + `Zustand` + `TailwindCSS`
- `Docker Compose` orchestration for MySQL, Redis, backend, and frontend

## Project Layout

```text
backend/   FastAPI app, services, seed data, Alembic, tests
frontend/  React app, routed pages, Zustand stores, Tailwind UI
```

## Quick Start

1. Run the full stack:

```bash
docker compose up --build
```

2. Open:

- Frontend: `http://localhost:3000`
- Backend API: `http://localhost:8000`
- Health check: `http://localhost:8000/health`

## Seeded Accounts

- Admin: `admin@rental.com` / `Admin123!`
- Manager 1: `manager1@rental.com` / `Manager123!`
- Manager 2: `manager2@rental.com` / `Manager123!`
- Customer 1: `customer1@rental.com` / `Customer123!`
- Customer 2: `customer2@rental.com` / `Customer123!`
- Customer 3: `customer3@rental.com` / `Customer123!`

The backend container runs `alembic upgrade head`, seeds the database, and starts `uvicorn`.

## API Highlights

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/vehicles`
- `GET /api/vehicles/{id}`
- `GET /api/vehicles/{id}/availability`
- `POST /api/bookings`
- `GET /api/bookings`
- `GET /api/stats/admin`
- `GET /api/stats/manager`
- `GET /api/stats/customer`
- `GET /health`

## Redis Locking

Booking creation uses a Redis `SET NX EX` lock on `booking_lock:vehicle:{vehicle_id}` with a 10-second TTL. Each booking attempt:

1. Acquires a short distributed lock.
2. Checks the database for overlapping `pending`, `approved`, or `active` bookings.
3. Creates the booking only if the date range is still free.
4. Releases the lock only if the current request owns it.

This prevents double-booking during concurrent requests.

## Cache Coverage

- Vehicle list: `vehicles:list:{page}:{filters_hash}`
- Vehicle detail: `vehicle:{id}`
- Vehicle availability: `vehicle:availability:{id}:{date_range_hash}`
- Admin stats: `stats:admin`
- Manager stats: `stats:manager:{manager_id}`

Read endpoints expose `X-Cache: HIT|MISS` headers where relevant.

## Backend Commands

Run locally without Docker:

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
alembic upgrade head
python seed.py
uvicorn app.main:app --reload
```

If you run the backend outside Docker, update `backend/.env` first so `DATABASE_URL` and `REDIS_URL` point to `localhost` instead of the Compose service names (`mysql` and `redis`).

## Frontend Commands

```bash
cd frontend
npm install
npm run dev
```

## Test Commands

Backend unit tests:

```bash
cd backend
pytest
```

## Verification Guide

1. `GET /health` should return `{"db":"ok","redis":"ok"}` once services are up.
2. Login with a customer account and create a booking from `/vehicles/:id/book`.
3. Hit `GET /api/vehicles` twice and confirm the second response includes `X-Cache: HIT`.
4. Log in as a customer and try to access `/dashboard/manager`; the app should route you to the 403 page.
5. Log in as a manager and approve or reject pending bookings from `/dashboard/manager/bookings`.
6. Fire two simultaneous `POST /api/bookings` requests for the same vehicle and dates; one should return `409`.

## Notes

- The backend writes structured JSON logs to `backend/logs/app.log`.
- The backend auto-creates tables on startup and also ships an Alembic migration for the initial schema.
- Seed logic is idempotent, so repeated container starts do not duplicate users or vehicles.
