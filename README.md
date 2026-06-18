# Clinic Appointment API — Starter Project

A basic clinic appointment management API. The project is functional but has **several bugs, design flaws, and missing features**.

## Setup

```bash
# 1. Start PostgreSQL
docker-compose up -d

# 2. Install dependencies
npm install

# 3. Setup environment
cp .env.example .env

# 4. Push schema to database
npm run db:push

# 5. Generate Prisma client
npm run db:generate

# 6. Seed sample data
npm run seed

# 7. Start dev server
npm run dev
```

The server will start on `http://localhost:3000`.

## Current Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/patients` | Register a patient |
| `GET` | `/api/patients?search=` | Search patients |
| `GET` | `/api/patients/:id` | Get patient details |
| `GET` | `/api/doctors/:id/slots?date=` | Get available slots |
| `POST` | `/api/appointments` | Book appointment |
| `PATCH` | `/api/appointments/:id/status` | Update status |
| `GET` | `/api/appointments?doctorId=&date=` | List appointments |
| `GET` | `/api/appointments/:id` | Get appointment |
