---
name: backend implementation
overview: "Stand up real backend behind the existing tRPC surface: full Prisma schema, WorkOS-synced users, Redis caching, RabbitMQ + outbox + circuit breaker for code execution, Go sandbox worker, Docker Compose for the whole stack. Folder restructure: `frontend/` → `app/`, new `workers/code-executor/`."
todos:
  - id: 01-restructure
    content: Rename `frontend/` to `app/`, scaffold `workers/code-executor/` (empty Go module), `infra/` for shared docker assets, root README/.env.example. Verify the app still builds in the new path.
    status: completed
  - id: 02-compose-baseline
    content: Author `docker-compose.yml` with db (postgres:16-alpine), redis (redis:7-alpine), rabbitmq (with management + seeded definitions), `app` Dockerfile, network, volumes, healthchecks. Wire .env.example. `docker compose up db redis rabbitmq` works.
    status: completed
  - id: 03-prisma-schema
    content: Replace the demo `Post` model with the full domain in `app/prisma/schema.prisma` (User, Course, CourseCategory, CourseModule, CourseTask, CourseTaskAttempt, Enrollment, UserActivity, UserActivitySnapshot, Achievement, UserAchievementTrack, Thread, Comment, OutboxEvent, IdempotencyKey, Execution + enums). Generate initial migration `0001_init`. Add a small `prisma/seed.ts` mirroring current fixtures so the FE keeps rendering against real DB.
    status: completed
  - id: 04-workos-user-sync
    content: Implement `UserSyncService` in `app/src/server/services/UserSyncService.ts`. Hook into `createTRPCContext` so every request resolves the local `User` row, with Redis cache by `workosUserId`. Drop the email-prefix username shim.
    status: completed
  - id: 05-prisma-repositories
    content: Replace each `Prisma*Repository` stub in `app/src/server/repositories/` with real Prisma queries. Keep the interfaces and the Fake impls untouched so `USE_FAKE_DATA=true` keeps working. Includes `SELECT … FOR UPDATE` for comment likes / counters.
    status: completed
  - id: 06-redis-cache-layer
    content: Add `app/src/server/redis.ts` (ioredis singleton), `cache.ts` (wrap/del/tag-version), and `Cached*Repository` decorators wired through `getAppRepositories()` for read-heavy domains (course, lesson, profile, activity, achievement, comment). Invalidate on writes.
    status: completed
  - id: 07-rate-limit-idempotency
    content: Add `app/src/server/api/middlewares.ts` with `withRateLimit` (Redis Lua) and `withIdempotency` (Postgres `IdempotencyKey` table + `idempotency-key` header). Apply to `execution.run`, `comment.post`, `enrollment.start/abandon`, `settings.update`, `search.global`.
    status: completed
  - id: 08-circuit-breaker
    content: Implement minimal three-state `CircuitBreaker` in `app/src/server/lib/CircuitBreaker.ts` (closed → open → half-open). Wrap RabbitMQ publish path in the outbox dispatcher and any future external HTTP calls.
    status: completed
  - id: 09-outbox-dispatcher
    content: Rewire `execution.run` to write `Execution` + `OutboxEvent` in one `$transaction`. Build the dispatcher in `app/src/server/outbox/dispatcher.ts`, run as a separate compose service `outbox` polling with `FOR UPDATE SKIP LOCKED`, retry/backoff, breaker-protected publish.
    status: completed
  - id: 10-rabbit-topology
    content: "Seed RabbitMQ definitions (`infra/compose/rabbitmq/definitions.json`): exchange `coderoster.events`, queues `execution.requested` / `execution.completed`, DLX + DLQs, TTLs. Add typed publisher helper in `app/src/server/amqp/publisher.ts` and consumer helper in `app/src/server/amqp/consumer.ts`."
    status: completed
  - id: 11-result-consumer
    content: "Build `app/src/server/consumers/executionResult.ts` (separate compose service): consumes `execution.completed`, updates `Execution`, upserts `CourseTaskAttempt`, recomputes `Enrollment.progressPercent`, inserts `UserActivity`, evaluates `UserAchievementTrack`, invalidates Redis keys."
    status: completed
  - id: 12-go-worker
    content: "Implement Go worker in `workers/code-executor/`: AMQP consumer, Docker SDK sandbox runner with strict limits, AMQP producer for completion events, Dockerfile (multi-stage from golang:1.23-alpine to scratch + ca-certs). Build sandbox base images for python and php."
    status: completed
  - id: 13-shared-contracts
    content: Define event shapes once in `app/src/shared/contracts/execution.ts` (Zod schemas + inferred TS types). Mirror as Go structs in `workers/code-executor/internal/contracts/events.go`. Document that the two must stay in lockstep until codegen lands.
    status: completed
  - id: 14-activity-snapshot
    content: Add daily snapshot job in `app/src/server/jobs/activitySnapshot.ts` aggregating `UserActivity` into `UserActivitySnapshot`. Run as a `snapshot` compose service. Update `ProfileRepository.getActivity` to read snapshots.
    status: completed
  - id: 15-security-headers-sanitize
    content: Add `next.config.js` security headers (CSP, HSTS, nosniff, referrer, permissions). Run `sanitize-html` on every persisted markdown / comment / bio in repository write paths. Tighten Zod `.max()` on user-supplied strings.
    status: completed
  - id: 16-fe-execution-polling
    content: "Update `InCourseShell` (`app/src/features/platform/in-course/InCourseShell/index.tsx`) to handle the new flow: `execution.run` returns `{ executionId }`, then a polling `execution.get` query (added to `executionRouter`) drives the UI until status reaches a terminal state."
    status: completed
  - id: 17-docs-update
    content: Refresh `app/README.md` (rename, new compose, repos, outbox, worker, security) and `app/ROUTES.md` (new `execution.get`, idempotency-key header, rate limits per procedure). Add a top-level `README.md` at repo root linking to `app/` and `workers/code-executor/`.
    status: completed
  - id: 18-final-check
    content: "Run `npm run check` inside `app/`, `go vet ./...` inside the worker, and `docker compose up --build` end-to-end smoke: register via WorkOS, hit `/courses`, run a Python task, observe Execution row + ActivityHeatmap update."
    status: completed
isProject: false
---

## Stack picks (locked)

- **Worker**: Go + Docker SDK. Single static binary, smallest image, best concurrency, native AMQP and Docker libs. Spawns one ephemeral container per execution (`python:3.12-slim`, `php:8.3-cli-alpine`).
- **ORM**: keep Prisma 6 — already wired in [app/prisma/schema.prisma](app/prisma/schema.prisma) (post-rename). Repository pattern stays; swap `Prisma*Repository` stubs for real impls. Use `$queryRaw` for any hot aggregate (heatmap) only if it shows up in profiling.
- **Sandbox**: Docker-per-exec via host socket. Worker runs as non-root with `docker` group. Each container: `--read-only`, `--network=none`, `--memory=128m`, `--cpus=0.5`, `--pids-limit=64`, `--security-opt=no-new-privileges`, drop all caps, tmpfs `/tmp`, hard 5s wall-clock kill via context.
- **CSRF**: tRPC over `fetch` with same-site cookies — already CSRF-safe. Add explicit double-submit cookie only on legacy REST `POST /api/v1/contact`.
- **XSS**: every markdown / comment body run through `sanitize-html` server-side **before** persistence. Server components escape by default — no `dangerouslySetInnerHTML`.
- **SQLi**: Prisma parameterises everything; `$queryRaw` only via tagged template (Prisma forbids interpolation otherwise).

## Architecture

```mermaid
flowchart TB
  subgraph client [Browser]
    UI[Next.js client]
  end

  subgraph appsvc [app container]
    SSR[Server components]
    TRPC[tRPC procedures]
    Outbox[Outbox dispatcher]
    ResultC[Result consumer]
    Snap[Daily activity snapshot]
  end

  subgraph workersvc [code-executor worker, Go]
    Cons[AMQP consumer]
    Box[Docker sandbox]
    Prod[AMQP producer]
  end

  PG[(PostgreSQL)]
  RD[(Redis)]
  MQ{{RabbitMQ}}
  WOS[WorkOS]
  DKR[Host Docker daemon]

  UI --> TRPC
  SSR --> TRPC
  TRPC -->|Prisma| PG
  TRPC -->|cache, rate-limit, idem| RD
  TRPC -->|"INSERT Execution + OutboxEvent (1 TX)"| PG
  Outbox -->|poll PENDING| PG
  Outbox -->|"publish execution.requested"| MQ
  MQ --> Cons --> Box --> DKR
  Box --> Prod -->|"publish execution.completed"| MQ
  MQ --> ResultC --> PG
  ResultC -->|invalidate keys| RD
  TRPC -->|verify session| WOS
  Snap --> PG
```

## Folder restructure

```
coderoster/
├── app/                          # was frontend
│   └── (everything moves verbatim)
├── workers/
│   └── code-executor/            # Go module
│       ├── cmd/code-executor/main.go
│       ├── internal/{amqp,sandbox,contracts,metrics}/
│       ├── go.mod
│       └── Dockerfile
├── infra/
│   ├── docker/
│   │   ├── app.Dockerfile        # Next.js production image
│   │   └── sandbox/              # base images for user code
│   └── compose/
│       └── rabbitmq/definitions.json
├── docker-compose.yml            # dev: db + redis + rabbit + app + worker + outbox
├── docker-compose.prod.yml       # production overlay
├── .env.example
└── README.md                     # root → links to app/README.md
```

Path alias `~/` continues to resolve to `app/src/`. WorkOS callback path stays `/callback`. All scripts stay relative inside `app/`.

## Database (Prisma)

Replace the lone `Post` model with the full domain. Skeleton (final shape lives in [app/prisma/schema.prisma](app/prisma/schema.prisma)):

```prisma
model User {
  id                String   @id @default(cuid())
  workosUserId      String   @unique
  email             String   @unique
  username          String   @unique
  displayName       String
  bio               String   @default("")
  avatarUrl         String?
  role              Role     @default(LEARNER)
  socials           Json     @default("{}")
  appearance        Json     @default("{\"colorScheme\":\"dark\"}")
  commentsThreadId  String?  @unique  // lazily created on first comment
  joinedAt          DateTime @default(now())
  updatedAt         DateTime @updatedAt
}
enum Role { LEARNER AUTHOR MODERATOR ADMIN }

model Course           { ... language, difficulty, status, authorId, categoryId ... }
model CourseCategory   { ... parentCategoryId for tree ... }
model CourseModule     { courseId, order, title, description }
model CourseTask       { moduleId, order, kind, title, description (markdown), result Json?, initialData Json, estimatedMinutes }
model CourseTaskAttempt{ courseTaskId, userId, currentData Json, status, tryN, @@unique([courseTaskId, userId]) }
model Enrollment       { userId, courseId, status, progressPercent, startedAt, finishedAt, @@unique([userId, courseId]) }

model UserActivity         { userId, type, payload Json, createdAt, @@index([userId, createdAt]) }
model UserActivitySnapshot { userId, date String, count Int, level Int, @@unique([userId, date]) }

model Achievement          { slug @unique, title, description, goal Int?, category, rarity, hidden, ... }
model UserAchievementTrack { userId, achievementId, status, currentN, earnedAt, @@unique([userId, achievementId]) }

model Thread  { totalCount Int @default(0), createdAt, updatedAt }
model Comment { authorId, threadId, message, likesN, dislikesN, @@index([threadId, createdAt]) }

model OutboxEvent      { topic, payload Json, status, retries, lastError, publishedAt, @@index([status, createdAt]) }
model IdempotencyKey   { key @id, userId?, endpoint, response Json?, status, expiresAt, @@index([expiresAt]) }
model Execution        { userId, taskId, language, code, status, stdout, stderr, runtimeMs, testResults Json?, passed, ... }
```

`SELECT … FOR UPDATE` for like/dislike counters lives inside `CommentRepository.likes()` via `prisma.$transaction(async tx => tx.$queryRaw\`… FOR UPDATE\`)`.

Migrations: `prisma migrate dev` for authoring, `prisma migrate deploy` runs from app container entrypoint on boot.

## WorkOS ↔ local User

New service [app/src/server/services/UserSyncService.ts](app/src/server/services/UserSyncService.ts):

```ts
async syncFromSession(workosUser): Promise<User>
```

- Lookup by `workosUserId`.
- If missing: derive `username` from email (collision-suffixed), `displayName` from `firstName + lastName || email`, persist.
- Cache hydrated `User` in Redis under `user:byWorkos:{workosUserId}` for 10 min.

Called once inside `createTRPCContext` ([app/src/server/api/trpc.ts](app/src/server/api/trpc.ts)). Replaces today's email-prefix shim. `ctx.user.id` becomes the local cuid; downstream code unchanged because `AuthenticatedUser` interface stays.

## Repositories — switch from fake to Prisma

Replace stubs in `app/src/server/repositories/*.repository.ts`:

- `FakeXxxRepository` stays for tests + `USE_FAKE_DATA=true` dev flag.
- `PrismaXxxRepository` implements the same interface against the new schema.
- Factory in [app/src/server/repositories/index.ts](app/src/server/repositories/index.ts) keeps the env-driven switch.
- Each Prisma method maps directly to the existing interface signature — no router changes.

Caching wrapper added as a decorator class per read-heavy repo (`CachedCourseRepository implements CourseRepository`):

```ts
async getBySlug(slug) {
  return this.cache.wrap(`course:slug:${slug}`, 300, () => this.inner.getBySlug(slug))
}
```

Invalidation: writes call `cache.del('course:slug:*')` via Redis `SCAN + DEL` helper, batched.

## Redis — cache + rate-limit + locks

Single client in [app/src/server/redis.ts](app/src/server/redis.ts) (`ioredis`). Three concerns, three modules:

- `cache.ts` — `wrap(key, ttl, loader)`, `del`, `bumpVersion(tag)` for tag-based invalidation.
- `rateLimit.ts` — fixed-window via Lua script (atomic incr+expire). Limits:
  - `execution.run`: 10 / minute / userId
  - `comment.post`: 5 / minute / userId
  - `search.global`: 30 / minute / IP
  - default protected: 120/min/userId, default public: 60/min/IP
- `locks.ts` — `withLock(key, ttl, fn)` redlock-style (single-node OK).

Cached procedures: `course.list`, `course.getBySlug`, `lesson.getOne`, `profile.getByUsername`, `profile.getActivity` (1h), `profile.getAchievements`, `comment.listOnProfile` (60s).

## tRPC middlewares

New file [app/src/server/api/middlewares.ts](app/src/server/api/middlewares.ts) exposes composable middlewares attached in [app/src/server/api/trpc.ts](app/src/server/api/trpc.ts):

- `withRateLimit(name, limit, window)` — 429 with `retryAfter`.
- `withIdempotency()` — reads `idempotency-key` header (extract from `ctx.headers`), stores response in `IdempotencyKey` table; replays cached response on duplicate within 24h. Applied only on mutations that are user-visible (`comment.post`, `enrollment.start/abandon`, `execution.run`, `settings.update`).
- `withCsrfDoubleSubmit()` — only on `/api/v1/*` REST handlers (tRPC fetch is already same-origin POST, exempt).

Builders:

```ts
export const protectedProcedure = baseWithAuth.use(timingMiddleware);
export const heavyProcedure = protectedProcedure
  .use(withRateLimit("heavy", 10, 60))
  .use(withIdempotency());
```

`execution.run` migrates to `heavyProcedure`.

## Outbox + RabbitMQ

`execution.run` becomes write-only:

1. In a single `prisma.$transaction`:
   - `Execution.create({ status: QUEUED, code, ... })`
   - `OutboxEvent.create({ topic: 'execution.requested', payload: { executionId, language, code, taskId, userId } })`
2. Return `{ executionId, status: 'queued' }` to the client.
3. Client polls `execution.get({ id })` (new procedure) or subscribes via Server-Sent Events (future); for now polling is enough.

Outbox dispatcher ([app/src/server/outbox/dispatcher.ts](app/src/server/outbox/dispatcher.ts)) — separate Node process started by docker-compose service `outbox`:

- Loops every 500ms, `SELECT … FOR UPDATE SKIP LOCKED LIMIT 100` of PENDING events.
- Publishes via single AMQP channel; on success marks `PUBLISHED`, sets `publishedAt`.
- Failure: increments `retries`, exponential backoff, after 5 retries → `FAILED` + alert (log).
- Wrapped by **circuit breaker** ([app/src/server/lib/CircuitBreaker.ts](app/src/server/lib/CircuitBreaker.ts), tiny in-memory three-state) — opens after 5 consecutive publish failures, half-open after 30s, closes after one success. While open, dispatcher sleeps and emits a metric.

Topology (RabbitMQ definitions seeded from [infra/compose/rabbitmq/definitions.json](infra/compose/rabbitmq/definitions.json)):

- Exchange `coderoster.events` (topic, durable).
- Queue `execution.requested` bound `execution.requested.*`.
- Queue `execution.completed` bound `execution.completed.*`.
- DLX `coderoster.dlx` + DLQs for both.
- TTL 10min on requested; rejected messages go to DLQ.

Result consumer ([app/src/server/consumers/executionResult.ts](app/src/server/consumers/executionResult.ts)) — also a separate compose service `result-consumer`:

- Consumes `execution.completed`.
- `prisma.$transaction`: update `Execution`, upsert `CourseTaskAttempt` (status SUCCESS if passed, increment `tryN`), insert `UserActivity` row, recompute `Enrollment.progressPercent`, evaluate achievement tracks (delegated to `AchievementService`).
- Invalidate Redis keys `course:slug:*` for the course of the task and `profile:byUsername:{user.username}`.

## Worker (`workers/code-executor/`)

Layout:

```
workers/code-executor/
├── cmd/code-executor/main.go
├── internal/
│   ├── amqp/{consumer.go, producer.go, conn.go}
│   ├── sandbox/{runner.go, image_python.go, image_php.go, limits.go}
│   ├── contracts/{events.go}      # mirrors TS event types
│   └── metrics/{prometheus.go}
├── go.mod, go.sum
├── Dockerfile
```

Flow per message:

1. Parse `ExecutionRequested { id, language, code, taskId, userId }`.
2. Pick image by language (whitelist).
3. `client.ContainerCreate` with `HostConfig`: `ReadonlyRootfs`, `NetworkMode: "none"`, `Memory: 128MB`, `NanoCPUs: 5e8`, `PidsLimit: 64`, `CapDrop: ["ALL"]`, `SecurityOpt: ["no-new-privileges"]`, tmpfs `/tmp` 64M.
4. Stream code through stdin (no host file mount).
5. `context.WithTimeout(5 * time.Second)` for wall clock; `ContainerWait` race with timer; on timeout `ContainerKill`.
6. Drain stdout/stderr, attempt to parse trailing `__CODEROSTER_RESULT__` JSON line if the task expected structured output.
7. `ContainerRemove` always (defer + RemoveOptions{Force:true}).
8. Publish `ExecutionCompleted { id, stdout, stderr, runtimeMs, passed, testResults }` with manual ack only after publish OK.

Contracts shared via [app/src/shared/contracts/execution.ts](app/src/shared/contracts/execution.ts) → mirrored hand-written Go struct in `internal/contracts/events.go` (we'll add a CI step later to diff them).

Worker runs as non-root user (UID 1000) member of host `docker` group; container has `/var/run/docker.sock` bind-mounted **read-only is not possible for the daemon socket**, so we accept the elevation and document that production should swap to Firecracker / gVisor.

## Daily activity snapshot

Cron service ([app/src/server/jobs/activitySnapshot.ts](app/src/server/jobs/activitySnapshot.ts)) — runs once per day at 00:30 UTC:

- For every active user with activity in the previous day: aggregate `UserActivity` count → upsert `UserActivitySnapshot { date, count, level }`.
- Started either by a tiny `node-cron` loop in the `app` container or a dedicated `cron` compose service. Default: dedicated service `snapshot` with command `node ./dist/server/jobs/activitySnapshot.js`.

`profile.getActivity` reads from `UserActivitySnapshot` (fast; one `SELECT` per year window).

## Docker Compose

Top-level [docker-compose.yml](docker-compose.yml) (dev):

- `db` — `postgres:16-alpine`, volume, healthcheck `pg_isready`.
- `redis` — `redis:7-alpine`, healthcheck `redis-cli ping`.
- `rabbitmq` — `rabbitmq:3-management-alpine`, definitions mounted, healthcheck `rabbitmq-diagnostics ping`.
- `app` — built from [infra/docker/app.Dockerfile](infra/docker/app.Dockerfile); entrypoint runs `prisma migrate deploy` then `node server.js`. Depends-on healthy db + redis + rabbitmq.
- `outbox` — same image, command `node ./dist/server/outbox/dispatcher.js`.
- `result-consumer` — same image, command `node ./dist/server/consumers/executionResult.js`.
- `snapshot` — same image, command `node ./dist/server/jobs/activitySnapshot.js`.
- `worker-code-exec` — built from `workers/code-executor/Dockerfile`; mounts `/var/run/docker.sock`; depends-on rabbitmq.
- All wired through a single `coderoster` network.

Production overlay [docker-compose.prod.yml](docker-compose.prod.yml) tightens resource limits, removes `app:dev` ports of internal services, swaps secrets to `secrets:`.

Single command: `docker compose up -d` brings the entire stack online from a clean checkout.

## Hardening checklist

- `next.config.js` adds security headers: `Strict-Transport-Security`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy`, `Content-Security-Policy` (script-src 'self' + WorkOS, no inline except styles).
- `sanitize-html` runs on every persisted markdown body and every comment.
- `zod` already validates every tRPC input; tighten `string().max()` everywhere.
- Cookies: `Secure`, `SameSite=Lax`, `HttpOnly` (WorkOS already does this).
- File uploads (avatar via signed URL) — out of scope this pass; placeholder remains text URL field.

## Environment variables (added)

```
DATABASE_URL=...
REDIS_URL=redis://redis:6379
RABBITMQ_URL=amqp://guest:guest@rabbitmq:5672
WORKER_DOCKER_HOST=unix:///var/run/docker.sock
WORKER_PYTHON_IMAGE=coderoster/sandbox-python:latest
WORKER_PHP_IMAGE=coderoster/sandbox-php:latest
EXECUTION_TIMEOUT_MS=5000
EXECUTION_MEMORY_MB=128
RATE_LIMIT_REDIS_PREFIX=rl:
SANITIZE_MARKDOWN=true
ACTIVITY_SNAPSHOT_CRON=30 0 * * *
```

`USE_FAKE_DATA` keeps working for offline development (skips DB, RabbitMQ, Redis at the repository / cache wrapper level).

## Out of scope (explicit)

- Frontend changes beyond what the new `Execution` polling needs (one new tRPC procedure call site).
- Admin panel.
- WebSocket push for execution results — polling for now.
- Real S3 avatar upload.
- Production-grade sandboxing (Firecracker). Documented as a future swap.
- Tests — separate plan.
