# Smart Classroom

Smart Classroom is a robust, production-ready classroom management platform inspired by Google Classroom. It features a modern, animated Next.js frontend and a secure Express/Prisma/PostgreSQL backend.

## Table of Contents

- [Features](#features)
- [Architecture](#architecture)
- [Local Development (Dev Mode)](#local-development-dev-mode)
- [Production Deployment](#production-deployment)
- [Environment Variables](#environment-variables)
- [Prisma Setup](#prisma-setup)

## Features

- **PostgreSQL + Prisma**: Relational data layer ensuring data integrity.
- **Secure Authentication**: Hardened JWT authentication, signed session persistence, and rate limiting.
- **Role-Based Access**: Dedicated UI features for `STUDENT` and `TEACHER` roles via protected Next.js routing.
- **Modern UI/UX**: Crafted with React, Tailwind CSS, and Framer Motion micro-animations.
- **Production-Ready Docker**: Pre-configured multi-stage container builds for rapid deployment.

## Architecture

```text
smartedu/
|-- backend/
|   |-- prisma/              # Schema, migrations, seeding
|   |-- src/                 # Controllers, Services, Middleware
|   |-- .env.example
|   |-- Dockerfile           # Dev Dockerfile
|   `-- Dockerfile.prod      # Multi-stage Prod Dockerfile
|-- frontend/
|   |-- src/                 # Next.js App Router, Components, Lib
|   |-- .env.example
|   |-- Dockerfile           # Dev Dockerfile
|   `-- Dockerfile.prod      # Multi-stage standalone Prod Dockerfile
|-- docker-compose.yml       # Local Development Compose
`-- docker-compose.prod.yml  # Production Orchestration
```

## Local Development (Dev Mode)

To run the application locally with hot-reloading:

1. **Copy Environment Variables**:

   ```bash
   cp backend/.env.example backend/.env
   cp frontend/.env.example frontend/.env
   ```

2. **Start the Development Stack**:
   This spins up the Postgres database, the backend, and the frontend dev servers using `nodemon` and `next dev`.

   ```bash
   docker compose up --build
   ```

3. **Access the App**:
   - Frontend: `http://localhost:3000`
   - Backend API: `http://localhost:5000/api/v1`

**Note**: When developing without Docker, make sure to change your `backend/.env` `DATABASE_URL` host from `postgres` to `localhost`.

## Production Deployment

The project has been heavily optimized for production deployment, utilizing secure headers, Next.js standalone builds, and multi-stage backend containers.

1. **Configure Production Variables**:
   Duplicate `.env` files for your host/VM or load them directly into your CI/CD pipeline.
   - **Important**: Change `JWT_SECRET` in `.env` or in `docker-compose.prod.yml` to a strong, random string.
   - Update `NEXT_PUBLIC_API_URL` to your production domain (e.g., `https://api.yourdomain.com/v1`).

2. **Run Production Containers**:

   ```bash
   docker compose -f docker-compose.prod.yml up -d --build
   ```

   _What this does:_
   - Packages the **Frontend** using Next.js `standalone` mode, drastically reducing image size.
   - Packages the **Backend** dependencies and securely runs `prisma migrate deploy` before taking traffic.
   - Sets up a production **PostgreSQL** instance with persistent data volumes.

3. **Check Container Health**:
   ```bash
   docker compose -f docker-compose.prod.yml ps
   docker compose -f docker-compose.prod.yml logs -f
   ```

## Environment Variables

### Backend (`backend/.env`)

| Variable         | Description                | Default / Example                     |
| ---------------- | -------------------------- | ------------------------------------- |
| `NODE_ENV`       | Environment context        | `development` / `production`          |
| `PORT`           | API Port                   | `5000`                                |
| `DATABASE_URL`   | Postgres Connection String | `postgresql://user:pass@host:5432/db` |
| `JWT_SECRET`     | Secret key for JWT signing | `super_secret_jwt_key_here`           |
| `JWT_EXPIRES_IN` | Token validity duration    | `7d`                                  |
| `CLIENT_URL`     | Allowed CORS origin        | `http://localhost:3000`               |

### Frontend (`frontend/.env`)

| Variable              | Description                      | Default / Example              |
| --------------------- | -------------------------------- | ------------------------------ |
| `NEXT_PUBLIC_API_URL` | The base URL for the backend API | `http://localhost:5000/api/v1` |

## Prisma Setup

The backend uses `Prisma` for database migrations. In development, the container automatically deploys migrations, but keeping local dependencies in-sync is recommended for editor autocomplete.

```bash
cd backend
npm install
npm run prisma:generate    # Generates local typed Prisma Client
npm run prisma:migrate     # Applies changes in schema.prisma directly
npm run prisma:validate    # Validates schema
npm run prisma:seed        # Bootstraps one account only when SEED_USER_* variables are provided
npm run prisma:studio      # Web GUI to view/edit database records
```

> **Deployment Note**: In the `docker-compose.prod.yml`, the backend automatically runs `npx prisma migrate deploy` prior to starting the Node process. This ensures the schema is always perfectly in sync with the codebase before handling requests.
