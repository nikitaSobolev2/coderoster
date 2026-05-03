#!/bin/sh
set -e

# Dev compose: `./app` is bind-mounted but `node_modules` lives on a Docker volume. That volume
# survives `docker compose up --build` / `--force-recreate`, so new deps from package-lock.json
# never appear until something runs `npm ci` inside the container. Keep a stamp on the volume
# and sync when the lockfile hash changes. Cross-container lock uses mkdir on the bind mount
# (`/app/.coderoster-npm-ci-lock`) so parallel app/outbox/etc. boots don't run npm ci twice.
sync_node_modules_if_needed() {
  [ "${NODE_ENV:-development}" = "development" ] || return 0
  [ -f package-lock.json ] || return 0

  LOCK_DIR=/app/.coderoster-npm-ci-lock
  while ! mkdir "$LOCK_DIR" 2>/dev/null; do
    sleep 1
  done
  trap 'rmdir "$LOCK_DIR" 2>/dev/null || true' EXIT

  if command -v sha256sum >/dev/null 2>&1; then
    LOCK_SIG=$(sha256sum package-lock.json | awk '{print $1}')
  else
    LOCK_SIG=$(node -p "require('crypto').createHash('sha256').update(require('fs').readFileSync('package-lock.json')).digest('hex')")
  fi
  STAMP_FILE=node_modules/.coderoster-package-lock.sha256
  if [ -f "$STAMP_FILE" ] && [ "$(cat "$STAMP_FILE")" = "$LOCK_SIG" ]; then
    trap - EXIT
    rmdir "$LOCK_DIR" 2>/dev/null || true
    return 0
  fi

  echo "[entrypoint] package-lock.json changed — npm ci --legacy-peer-deps --ignore-scripts"
  npm ci --legacy-peer-deps --ignore-scripts
  mkdir -p node_modules
  if [ -f node_modules/server-only/empty.js ]; then
    cp node_modules/server-only/empty.js node_modules/server-only/index.js
  fi
  printf '%s\n' "$LOCK_SIG" > "$STAMP_FILE"

  trap - EXIT
  rmdir "$LOCK_DIR" 2>/dev/null || true
}

sync_node_modules_if_needed

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
