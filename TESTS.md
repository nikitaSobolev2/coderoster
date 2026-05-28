# Test suite — Кодиум / CodeRoster

This document describes the functional and load test suite added on top of the existing Vitest setup. It is the canonical reference for **how tests are organised, how to run them, and how to add new ones**.

For day-to-day commands, see also the **Testing** subsection in [`app/README.md`](app/README.md).

---

## What changed (vs `master`)

The staged work introduces a full pyramid across the monorepo:

| Area                 | Added / changed                                                                                                                                 |
| -------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| **App (TypeScript)** | ~89 Vitest files — unit, service, Fake repository, tRPC integration, middleware                                                                 |
| **Test harness**     | `app/tests/setup/` — global mocks, faker factories, Fake admin repos, `buildTestCaller`                                                         |
| **Load**             | 7 k6 scenarios under `tests/load/` + `tests-load` compose service                                                                               |
| **Workers (Go)**     | Unit tests for code-executor (sandbox, AMQP) and code-improve (OpenAI client, job processor)                                                    |
| **Docker**           | `tests-load`, `tests-go-code-executor`, `tests-go-code-improve` services (`profiles: ["tests"]`); npm ci retry in `infra/docker/app.Dockerfile` |
| **Tooling**          | `@faker-js/faker`, `@vitest/coverage-v8`; scripts `test`, `test:watch`, `test:coverage`                                                         |

**Design choice:** Vitest tests never hit Postgres, Redis, or RabbitMQ. They use in-memory **Fake repositories** and targeted `vi.mock` stubs. Load tests and optional Go integration tests are the only paths that exercise a live stack.

Current count (local run): **358 Vitest tests**, **89 test files**, plus Go packages under `workers/*/internal/...`.

---

## Test tiers

| Tier                         | Runner                      | Location                     | Needs live stack?                     |
| ---------------------------- | --------------------------- | ---------------------------- | ------------------------------------- |
| **Unit**                     | Vitest                      | `app/src/**`, `app/tests/**` | No                                    |
| **Integration (tRPC)**       | Vitest + `createCaller`     | `app/src/server/api/**`      | No                                    |
| **Load**                     | [k6](https://k6.io)         | `tests/load/*.js`            | Yes — HTTP to `app:3000`              |
| **Workers (Go unit)**        | `go test`                   | `workers/**/_test.go`        | No                                    |
| **Workers (Go integration)** | `go test` + `INTEGRATION=1` | `runner_docker_test.go`      | Yes — Docker socket + language images |

---

## Running tests

All commands assume the repository root and a running compose stack where noted.

### TypeScript — unit + integration (recommended default)

```bash
docker compose up -d
docker compose exec app npm run test
docker compose exec app npm run test:watch
docker compose exec app npm run test:coverage
```

Run inside the `app` container so Node 22, lockfile, and path aliases match CI. Tests set `USE_FAKE_DATA=true` in [`app/tests/setup/vitest.setup.ts`](app/tests/setup/vitest.setup.ts) and **ignore** host `.env` fixture flags.

Single file or pattern:

```bash
docker compose exec app npx vitest run src/server/services/XpService.test.ts
docker compose exec app npx vitest run src/server/api/routers/course
```

### Load (k6)

Stack must be up. Services use the `tests` compose profile.

```bash
docker compose up -d
docker compose run --rm tests-load run /tests/load/catalog_browse.js
docker compose run --rm tests-load run /tests/load/course_detail.js
docker compose run --rm tests-load run /tests/load/execution_run.js
docker compose run --rm tests-load run /tests/load/search_global.js
docker compose run --rm tests-load run /tests/load/profile_read.js
docker compose run --rm tests-load run /tests/load/livechat_read.js

# Authenticated mutation — pass session cookie from browser devtools
docker compose run --rm tests-load -e K6_AUTH_COOKIE="<session-cookie>" run /tests/load/settings_update.js
```

See [`tests/load/README.md`](tests/load/README.md) for scenario details. Shared helpers live in [`tests/load/common.js`](tests/load/common.js) (k6 cannot import npm packages, so faker-like data is inlined).

### Go workers

Runtime worker containers (`worker-code-exec`, `code-improve-worker`) ship **only the compiled binary** on Alpine — they do **not** include the Go toolchain. Do **not** run `docker compose exec worker-code-exec go test`.

Use dedicated test services instead:

```bash
docker compose run --rm tests-go-code-executor test ./...
docker compose run --rm tests-go-code-improve test ./...
```

Optional Docker-bound sandbox test (requires `docker.sock`, Python/PHP images):

```bash
docker compose run --rm -e INTEGRATION=1 tests-go-code-executor test -tags=integration ./internal/sandbox/...
```

---

## TypeScript architecture

### Configuration

- [`app/vitest.config.ts`](app/vitest.config.ts) — `node` environment, includes `src/**/*.test.ts` and `tests/**/*.test.ts`, setup file, v8 coverage thresholds on `src/server/services`, `src/server/repositories`, `src/shared/lib`.
- [`app/tests/setup/vitest.setup.ts`](app/tests/setup/vitest.setup.ts) — global mocks and env:
  - `faker.seed(42)` for deterministic data
  - `vi.mock('server-only')`, Prisma `db` Proxy, AuthKit, `next/headers`, `ioredis`
  - `USE_FAKE_DATA=true` forced for every test run

### Fake data

| Piece                  | Path                                                                                                 | Role                                                                                  |
| ---------------------- | ---------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| Factories              | [`app/tests/setup/fixtures/`](app/tests/setup/fixtures)                                              | `@faker-js/faker` builders with partial overrides (`userFactory`, `courseFactory`, …) |
| User-facing Fakes      | [`app/src/server/repositories/*.repository.ts`](app/src/server/repositories)                         | `FakeCourseRepository`, `FakeEnrollmentRepository`, … co-located with Prisma impl     |
| Admin + livechat Fakes | [`app/tests/setup/repositories/fakeAdmin.ts`](app/tests/setup/repositories/fakeAdmin.ts)             | In-memory admin domains that previously had Prisma-only access                        |
| Admin bundle           | [`app/tests/setup/repositories/fakeAdminBundle.ts`](app/tests/setup/repositories/fakeAdminBundle.ts) | `buildFakeAdminBundle()` — one instance per domain                                    |

### tRPC integration harness

[`app/tests/setup/trpcCallerFactory.ts`](app/tests/setup/trpcCallerFactory.ts) exports `buildTestCaller()`:

- Builds an in-process tRPC caller via `createCaller` from [`app/src/server/api/root.ts`](app/src/server/api/root.ts)
- Injects `FakeUserRepositoryBag` + default `buildFakeAdminBundle()`
- Accepts overrides: `user`, `headers` (idempotency-key, x-forwarded-for), `repositories`, `adminOverrides`

Example:

```typescript
import { buildTestCaller } from "~/../tests/setup/trpcCallerFactory";
import { authenticatedUserFactory } from "~/../tests/setup/fixtures/userFactory";

const { caller, repositories } = buildTestCaller({
  user: authenticatedUserFactory({ role: "admin" }),
  headers: { "idempotency-key": "11111111-1111-1111-1111-111111111111" },
});
await caller.enrollment.start({ courseSlug: "python-basics" });
```

For middleware tests that need Prisma side effects (idempotency keys, role re-check), override methods on the global `db` mock from `~/server/db`.

### Mocking rules

- Prefer **Fake repositories** over deep Prisma mocks when testing routers or services that go through `ctx.repositories`.
- When using `vi.mock` with variables defined in the test file, wrap them in **`vi.hoisted()`** — Vitest hoists `vi.mock` to the top of the file; bare `const x = vi.fn()` causes `ReferenceError: Cannot access 'x' before initialization`.
- Service tests that replace `~/server/db` entirely should not rely on the global Proxy unless they merge behaviour explicitly.

---

## Naming conventions

Tests follow domain-oriented naming (one file per domain, long names encouraged):

| Rule                                   | Example                                                          |
| -------------------------------------- | ---------------------------------------------------------------- |
| File name = domain                     | `enrollment.test.ts`, `courseEditor.test.ts`                     |
| Case name includes **outcome**         | `start_enrollment_success`, `start_enrollment_fail_unknown_slug` |
| Case name includes **behaviour**       | `rate_limit_throws_TOO_MANY_REQUESTS_when_exceeded`              |
| Platform suffix when behaviour differs | `foo_success_web` / `foo_success_mobile`                         |
| `test_` prefix                         | Not required (Vitest discovers `*.test.ts`)                      |

---

## Test inventory (by layer)

### Shared / pure functions — `app/src/shared/lib/*.test.ts`

`planTier`, `taskAttemptCurrentData`, `taskStarterCodes`, `executionTerminalView`, `formatStableDate`, `coursePremiumSignals`.

### Server utilities — `app/src/server/lib/*.test.ts`

`sanitize`, `featureFlags`, `CircuitBreaker`, `activityHeatmapLevel`.

### Services — `app/src/server/services/*.test.ts`

`XpService`, `StreakService`, `PlanService`, `LeaderboardService`, `DailyChallengeService`, `WeeklyChallengeService`, `AchievementService`, `AccountDeletionService`, `UserSyncService`, `StorageService`, `planSelection`, `aiImproveAvailability`, `codeImproveEnqueue`.

### Repositories (Fake impl) — `app/src/server/repositories/*.test.ts`

`course`, `lesson`, `enrollment`, `progress`, `execution`, `profile`, `settings`, `comment`, `search`, `account`.

Admin Fake repos — `app/tests/repositories/admin/*.test.ts` and `app/tests/repositories/livechat.test.ts`.

### tRPC routers — `app/src/server/api/routers/**/*.test.ts`

User-facing: `course`, `lesson`, `enrollment`, `progress`, `execution`, `profile`, `settings`, `comment`, `search`, `account`, `achievement`, `sandbox`, `leaderboard`, `daily`, `weekly`, `livechat`, `plan`, `codeImprove`.

Admin: `catalog`, `courseEditor`, `contentPages`, `achievements`, `challenges`, `users`, `moderation`, `languages`, `audit`, `plans`, `aiCodeImprove`, `contactMessages`, `livechat`.

### Middleware — `app/src/server/api/middlewares.*.test.ts`

`rateLimit`, `idempotency`, `requireRoles`, `auditLog` — exercised through real procedures (e.g. `execution.run`, `enrollment.start`, `admin.audit.list`).

### Background / edge —

`outbox/dispatcher`, `consumers/executionResult`, `consumers/accountDeletion`, `jobs/activitySnapshot`, `contact/persistContactMessage`, `uploads/imageUploadValidation`, `auth/workosSessionEmail`, `features/.../inCourseShellLessonActions`.

### Load scenarios — `tests/load/`

| Script               | Exercises                         |
| -------------------- | --------------------------------- |
| `catalog_browse.js`  | `course.list` with random filters |
| `course_detail.js`   | Course detail + lesson tree       |
| `execution_run.js`   | Sandbox code execution path       |
| `search_global.js`   | Global search                     |
| `profile_read.js`    | Public profile read               |
| `livechat_read.js`   | Livechat message list             |
| `settings_update.js` | Authenticated settings mutation   |

### Go — `workers/`

| Worker          | Packages tested                                                                         |
| --------------- | --------------------------------------------------------------------------------------- |
| `code-executor` | `internal/amqp`, `internal/sandbox` (command/stdin/submit; optional Docker integration) |
| `code-improve`  | `internal/openai`, `internal/job`                                                       |

Dependencies: `github.com/stretchr/testify`, `github.com/brianvoe/gofakeit/v7` (see each worker’s `go.mod`).

---

## Coverage

```bash
docker compose exec app npm run test:coverage
```

Thresholds (minimum) in `vitest.config.ts`: **60%** statements/functions/lines, **50%** branches on:

- `src/server/services/**`
- `src/server/repositories/**`
- `src/shared/lib/**`

Reports: terminal summary + `app/coverage/lcov.info` for CI upload.

---

## Adding a new test

1. **Pick tier** — default to Vitest + Fakes unless the behaviour requires HTTP (k6) or real Docker sandboxes (Go integration).
2. **One file per domain** next to the code under test (`src/...`) or under `app/tests/repositories/` for admin-only Fakes.
3. **Seed data** via factories in `app/tests/setup/fixtures/`; override only fields the case depends on.
4. **Router test** — use `buildTestCaller()`; stub `db.user.findUnique` when testing role gates that re-read the DB.
5. **Admin router** — default admin bundle is injected; pass `adminOverrides` only when you need a pre-seeded Fake (e.g. catalog rows).
6. **Run** — `docker compose exec app npx vitest run path/to/your.test.ts`.
7. **Name cases** so CI output reads as a spec: `{action}_{condition}_{expectedOutcome}`.

---

## Troubleshooting

| Symptom                                                  | Cause                                 | Fix                                                                        |
| -------------------------------------------------------- | ------------------------------------- | -------------------------------------------------------------------------- |
| `go: executable file not found` in worker container      | Runtime image has no toolchain        | Use `tests-go-code-*` compose services                                     |
| Sandbox tests return real DB errors in Vitest            | Host `.env` had `USE_FAKE_DATA=false` | Vitest setup forces `true`; rebuild/restart if env was cached before setup |
| `vi.mock` / `before initialization`                      | Hoisting                              | Use `vi.hoisted(() => ({ ... }))`                                          |
| `No procedure found on path "admin,catalog,listCourses"` | Nested router path                    | Use `admin.catalog.courses.list`, not flat `listCourses`                   |
| k6 connection refused                                    | App not running                       | `docker compose up -d` first                                               |
| npm ci fails in Docker build                             | Registry flake                        | Dockerfile retries `npm ci` up to 5 times                                  |

---

## Related files

- [`app/vitest.config.ts`](app/vitest.config.ts)
- [`app/tests/setup/vitest.setup.ts`](app/tests/setup/vitest.setup.ts)
- [`app/tests/setup/trpcCallerFactory.ts`](app/tests/setup/trpcCallerFactory.ts)
- [`docker-compose.yml`](docker-compose.yml) — `tests-load`, `tests-go-code-executor`, `tests-go-code-improve`
- [`tests/load/README.md`](tests/load/README.md)
