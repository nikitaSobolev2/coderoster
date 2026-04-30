#!/bin/sh
set -e

# Schema sync on every container boot.
#   - When `prisma/migrations/` contains migration files, run `migrate deploy`
#     (production-grade, idempotent).
#   - Otherwise fall back to `db push` so the dev environment tracks the
#     latest `schema.prisma` without requiring manual migration authoring.
# `prisma generate` always runs (including for outbox/consumers with
# SKIP_MIGRATIONS) so bind-mounted `schema.prisma` matches the client in
# `node_modules`, avoiding stale client validation errors at runtime.
if [ "${SKIP_MIGRATIONS:-false}" != "true" ]; then
  if [ -d "./prisma/migrations" ] && [ "$(ls -A ./prisma/migrations 2>/dev/null)" ]; then
    echo "[entrypoint] running prisma migrate deploy"
    node ./scripts/run-prisma.mjs migrate deploy
  else
    echo "[entrypoint] no migrations found — running prisma db push"
    node ./scripts/run-prisma.mjs db push --accept-data-loss --skip-generate
  fi
fi

echo "[entrypoint] running prisma generate"
node ./scripts/run-prisma.mjs generate

exec "$@"
