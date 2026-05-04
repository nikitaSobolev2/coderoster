#!/bin/sh
# Production / APP_ENV=prod: schema sync then process (no npm — deps baked in image).
set -e

echo "[prod-entrypoint] boot (cwd=$(pwd), NODE_ENV=${NODE_ENV:-unset})" >&2

if [ "${SKIP_MIGRATIONS:-false}" != "true" ]; then
  if [ -d "./prisma/migrations" ] && [ "$(ls -A ./prisma/migrations 2>/dev/null)" ]; then
    echo "[prod-entrypoint] prisma migrate deploy" >&2
    node ./scripts/run-prisma.mjs migrate deploy
  else
    echo "[prod-entrypoint] no migrations — prisma db push" >&2
    node ./scripts/run-prisma.mjs db push --accept-data-loss --skip-generate
  fi
fi

echo "[prod-entrypoint] prisma generate" >&2
node ./scripts/run-prisma.mjs generate

exec "$@"
