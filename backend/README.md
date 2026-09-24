# QuizSpring backend

Spring Boot 3.4 / Java 17 REST API for the QuizSpring React client. It uses PostgreSQL, Flyway, Hibernate validation, stateless JWT access tokens, rotating hashed refresh tokens, BCrypt passwords, and server-side scoring.

## Run locally

1. Copy `.env.example` to `.env` and set `DATABASE_URL`, `DATABASE_USERNAME`, `DATABASE_PASSWORD`, and a random `JWT_SECRET` of at least 32 bytes.
2. Set `SEED_ADMIN_ENABLED=true`, `SEED_ADMIN_EMAIL`, `SEED_ADMIN_USERNAME`, and `SEED_ADMIN_PASSWORD` for the first startup if an administrator is needed.
3. Start with `mvn spring-boot:run -Dspring-boot.run.profiles=dev`.

Flyway applies `src/main/resources/db/migration/V1__initial_schema.sql` and the follow-up indexes in `V2__attempt_lifecycle_and_streaks.sql` on startup. Hibernate uses `ddl-auto=validate`; it does not create or mutate production tables. The migration seeds the default categories. A Supabase API key is not a PostgreSQL password; use the database connection string and database credentials from Supabase Project Settings.

## API surface

The product routes are available under `/api`; `/api/v1` aliases are retained for the frontend.

- `POST /api/auth/signup`, `/login`, `/refresh`, `/logout`
- `POST /api/auth/forgot-password`, `/reset-password`; `GET /api/auth/me`
- `GET /api/categories`
- `GET /api/quizzes`, `GET /api/quizzes/{id}`, `GET /api/quizzes/recommended`, `GET /api/quizzes/mine`
- `POST /api/quizzes`, `PUT|DELETE /api/quizzes/{id}`
- `POST /api/quizzes/{id}/start`
- `POST /api/attempts/{id}/submit`, `GET /api/attempts/mine`, `GET /api/attempts/{id}`
- `GET /api/users/me/dashboard`, `GET|PUT /api/users/me/profile`, password change endpoint
- `/api/admin/**` for administrator statistics and moderation

Responses use snake_case. Quiz creation, attempt scoring, XP, streak changes, role checks, ownership checks, and elapsed-time validation are server-authoritative. The client submits selected option indexes only; answer keys are excluded from start responses and revealed after completion.

OpenAPI JSON is available at `/v3/api-docs` and Swagger UI at `/swagger-ui.html`. Health is available at `/actuator/health`.

## Verification

```bash
mvn test
mvn package
```
