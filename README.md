# Smart Classroom

Smart Classroom is a graduation-project foundation for a classroom management platform inspired by Google Classroom. This upgraded phase moves the project to PostgreSQL and Prisma, improves the frontend presentation layer, and keeps the architecture clean for future milestones.

## Architecture Overview

- `frontend/`: Next.js App Router frontend with protected teacher and student dashboards, reusable UI components, and motion-enhanced interactions.
- `backend/`: Express API using Prisma ORM, JWT authentication, versioned routes, and PostgreSQL as the system of record.
- `backend/prisma/`: Relational schema and generated migration files.
- `docker-compose.yml`: Development orchestration for frontend, backend, and PostgreSQL.

## Updated Folder Structure

```text
smartedu/
|-- backend/
|   |-- prisma/
|   |   |-- migrations/
|   |   `-- schema.prisma
|   |-- src/
|   |   |-- config/
|   |   |-- constants/
|   |   |-- controllers/
|   |   |-- lib/
|   |   |-- middlewares/
|   |   |-- routes/
|   |   |   `-- v1/
|   |   |-- services/
|   |   `-- utils/
|   |-- .env.example
|   |-- Dockerfile
|   `-- package.json
|-- frontend/
|   |-- src/
|   |   |-- app/
|   |   |-- components/
|   |   |-- context/
|   |   |-- hooks/
|   |   `-- lib/
|   |-- .env.example
|   |-- Dockerfile
|   `-- package.json
|-- docker-compose.yml
`-- README.md
```

## Core Features In This Phase

- PostgreSQL + Prisma relational data layer
- JWT authentication with role-based access
- Teacher and student dashboards
- Protected frontend routing
- Modern academic SaaS-style UI
- Framer Motion powered transitions and micro-animations
- Docker-ready local development setup

## Relational Models

- `User`
- `Course`
- `Enrollment`
- `Assignment`
- `Submission`
- `ActivityLog`

## Environment Setup

1. Copy environment files:

   ```powershell
   Copy-Item backend/.env.example backend/.env
   Copy-Item frontend/.env.example frontend/.env
   ```

2. Review the connection values before running the project.

## Prisma Commands

```bash
cd backend
npm run prisma:validate
npm run prisma:generate
npm run prisma:migrate -- --name init
```

For production-style deployment migrations:

```bash
cd backend
npm run prisma:deploy
```

## Docker Commands

```bash
docker compose up --build
```

Services:

- Frontend: `http://localhost:3000`
- Backend: `http://localhost:5000`
- PostgreSQL: `postgresql://smartclassroom:smartclassroom@localhost:5432/smart_classroom`

## Run Without Docker

### Backend

```bash
cd backend
npm install
npm run prisma:generate
npm run prisma:migrate -- --name init
npm run dev
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

## API Route Groups

- `/api/v1/auth`
- `/api/v1/users`
- `/api/v1/courses`
- `/api/v1/assignments`
- `/api/v1/submissions`
- `/api/v1/dashboard`

## Backend Validation Checklist

- Server boot sequence separated from app wiring
- Environment validation for required secrets and database URL
- Prisma client initialization through a shared module
- JWT protection for private routes
- Role-based authorization middleware
- Consistent JSON response formatting
- Centralized Prisma-aware error handling
- Dashboard aggregation for both roles

## Recommended Git Workflow

- Default branch: `main`
- Feature branches: `feature/<scope>`
- Fix branches: `fix/<scope>`
- Docs branches: `docs/<scope>`

Suggested commit message:

```text
feat: migrate smart classroom to postgresql and prisma
```

## Verification Notes

- Prisma schema validates successfully.
- Prisma client generates successfully.
- Backend modules load successfully with required environment variables.
- Frontend production build completes successfully.

If Docker is installed on the target machine, the full stack can be started directly with `docker compose up --build`.
