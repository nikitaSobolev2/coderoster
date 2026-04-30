# Кодиум monorepo

Educational platform for learning programming through hands-on practice. The repository
ships every service needed to run the platform end-to-end via a single
`docker compose up`.

```
coderoster/
├── app/                    # Next.js 15 fullstack: UI + tRPC API + outbox + result consumer
├── workers/
│   ├── code-executor/      # Go: sandboxes user-submitted code
│   └── code-improve/       # Go: AI code-improve jobs (Rabbit → DB, no SSE)
├── infra/
│   ├── docker/             # Dockerfiles for app + sandbox base images
│   └── compose/            # RabbitMQ definitions and other compose-level config
├── docker-compose.yml      # Dev stack: db + redis + rabbitmq + app + outbox + result-consumer + worker
├── docker-compose.prod.yml # Production overlay
└── .env.example
```

## Quick start

1. Copy `.env.example` to `.env` and fill in WorkOS credentials.
2. `docker compose up --build` brings the whole stack online — first boot runs Prisma
   migrations and seeds initial fixture data.
3. Open `http://localhost:3000`.

## Services

| Service                 | Stack                | Purpose                                                                         |
| ----------------------- | -------------------- | ------------------------------------------------------------------------------- |
| `db`                    | PostgreSQL 16        | Primary store. Single source of truth for the domain model                      |
| `redis`                 | Redis 7              | Read-through cache, rate limits, distributed locks                              |
| `rabbitmq`              | RabbitMQ 3 (mgmt UI) | Message broker for code execution and result events                             |
| `app`                   | Next.js 15 + tRPC    | Web app, server components, tRPC API, server-side cache invalidation            |
| `outbox`                | Node                 | Polls the `OutboxEvent` table and publishes to RabbitMQ (circuit-breaker)       |
| `result-consumer`       | Node                 | Consumes `execution.completed`, updates execution + attempts + activity         |
| `code-improve-worker`   | Go                   | Consumes AI code-improve jobs, OpenAI non-stream, persists job + circuit breaker |
| `snapshot`              | Node                 | Daily aggregator from `UserActivity` to `UserActivitySnapshot`                  |
| `worker-code-exec`      | Go + Docker SDK      | Sandboxed code execution: one ephemeral container per request                   |

## Documentation

- App-level docs (UI, tRPC procedures, design system): [`app/README.md`](app/README.md)
- Frontend API surface and rate limits: [`app/ROUTES.md`](app/ROUTES.md)
- Worker entrypoint: [`workers/code-executor/cmd/code-executor/main.go`](workers/code-executor/cmd/code-executor/main.go)
