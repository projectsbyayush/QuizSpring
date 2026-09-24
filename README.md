# QuizSpring

A production-oriented quiz platform with a React/Vite frontend and a Spring Boot REST API. The project is a monorepo:

```text
.
├── backend/   Java 17, Spring Boot 3, Maven, PostgreSQL, Flyway
├── src/       React, Vite, TypeScript, MUI, TanStack Query
└── supabase/  Legacy prototype assets; the backend Flyway migration is authoritative
```

## Prerequisites

- Java 17 or newer
- Maven 3.9 or newer
- Node.js 20 or newer and npm
- A PostgreSQL database. Supabase PostgreSQL is supported through its standard JDBC connection string.

## Supabase setup

1. Create or open the Supabase project.
2. Copy the database connection string from **Project Settings → Database**. Use the database password from that connection string as `DATABASE_PASSWORD`.
3. Do not use a Supabase API key as the PostgreSQL password. API keys are not database credentials and must not be committed.
4. Copy `backend/.env.example` to `backend/.env` and set the database values, a random `JWT_SECRET` (at least 32 bytes), CORS origin, and seed-admin values.
5. Start the backend once. Flyway applies `backend/src/main/resources/db/migration/V1__initial_schema.sql`, creates the tables, and seeds the default categories.

The supplied project API URL is not required by the Spring API. The browser calls the Spring API through `VITE_API_BASE_URL`; keep the Supabase service URL and all credentials in environment variables or a secret manager.

## Environment variables

Frontend (`.env` in the repository root):

```dotenv
VITE_API_BASE_URL=http://localhost:8080/api/v1
```

Backend (`backend/.env`, loaded by your shell or deployment platform):

```dotenv
DATABASE_URL=jdbc:postgresql://<host>:5432/postgres
DATABASE_USERNAME=postgres
DATABASE_PASSWORD=<database-password>
JWT_SECRET=<random-32-byte-or-longer-secret>
CORS_ALLOWED_ORIGINS=http://localhost:5173
SEED_ADMIN_ENABLED=true
SEED_ADMIN_EMAIL=admin@example.com
SEED_ADMIN_USERNAME=admin
SEED_ADMIN_PASSWORD=<strong-initial-password>
PASSWORD_RESET_BASE_URL=http://localhost:5173/reset-password
```

The backend also supports access/refresh token durations, the attempt grace period, SMTP settings, and `PASSWORD_RESET_EXPOSE_TOKEN` for local development. Set it to `true` only on an isolated developer machine when you need the reset link in the console; never enable it in a shared or production environment.

## Run locally

Start the API:

```bash
cd backend
mvn spring-boot:run -Dspring-boot.run.profiles=dev
```

Start the frontend in a second terminal:

```bash
npm install
npm run dev
```

Open `http://localhost:5173`. The Vite development proxy forwards `/api` requests to `http://localhost:8080`.

## API documentation

- Swagger UI: `http://localhost:8080/swagger-ui.html`
- OpenAPI JSON: `http://localhost:8080/v3/api-docs`
- Health: `http://localhost:8080/actuator/health`

Both `/api/...` paths from the product specification and `/api/v1/...` compatibility paths are served by the backend.

## Main flows

- `POST /api/auth/signup` creates a user and returns access/refresh tokens.
- `POST /api/auth/login` verifies BCrypt credentials and returns a short-lived JWT plus a rotating opaque refresh token.
- `POST /api/quizzes/{id}/start` creates or resumes a pending server-side attempt and returns sanitized questions.
- `POST /api/attempts/{id}/submit` validates ownership, question IDs, elapsed server time, completion state, and concurrency before scoring.
- Authors and administrators can manage quizzes; administrators manage users, categories, quizzes, and attempts under `/api/admin/**`.
- Clients never receive answer keys from a start/play request. Answer keys and explanations are returned only after a completed submission.

## Scoring

- Base XP per correct answer: Easy 10, Medium 20, Hard 30.
- For a timed quiz submitted within its limit, the time bonus is `floor(base XP × 20%)`.
- The first completed attempt on a new day receives `min(streak days × 5, 50)` streak XP; later attempts that day do not repeat the streak bonus.
- Level is `floor(sqrt(total XP / 100)) + 1`.
- A user can never earn XP from a quiz they authored.
- Attempts lock their completion row and verify elapsed time against `started_at`; a short configurable grace period handles timer/network delays.

## Verification

Backend:

```bash
cd backend
mvn test
mvn package
```

Frontend:

```bash
npm run typecheck
npm run lint
npm run format:check
npm run build
```

The backend unit and MockMvc tests cover JWT behavior, validation/controllers, XP calculation, streak transitions, server-side elapsed time, grace periods, ownership, and completed-attempt protection. A live Supabase connection is required for an end-to-end run; no credentials are stored in this repository.
