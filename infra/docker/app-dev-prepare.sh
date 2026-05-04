#!/bin/sh
# One-shot dev stack bootstrap: sync shared node_modules volume, migrate, generate.
# Runs only in the `app-prepare` compose service (no cross-container npm locks).
set -e

echo "[app-prepare] cwd=$(pwd)"

sync_node_modules_if_needed() {
  [ -f package-lock.json ] || return 0

  if command -v sha256sum >/dev/null 2>&1; then
    LOCK_SIG=$(sha256sum package-lock.json | awk '{print $1}')
  else
    LOCK_SIG=$(
      node -p "require('crypto').createHash('sha256').update(require('fs').readFileSync('package-lock.json')).digest('hex')"
    )
  fi
  STAMP_FILE=node_modules/.coderoster-package-lock.sha256
  if [ -f "$STAMP_FILE" ] && [ "$(cat "$STAMP_FILE")" = "$LOCK_SIG" ]; then
    echo "[app-prepare] node_modules already matches package-lock.json"
    return 0
  fi

  echo "[app-prepare] package-lock changed or fresh volume — npm ci --legacy-peer-deps --ignore-scripts"
  mkdir -p node_modules
  if [ -n "$(ls -A node_modules 2>/dev/null)" ]; then
    find node_modules -mindepth 1 -maxdepth 1 -exec rm -rf {} +
  fi
  npm ci --legacy-peer-deps --ignore-scripts || {
    echo "[app-prepare] npm ci failed. Reset volume: docker compose down && docker volume rm <project>_app_node_modules && docker compose up" >&2
    exit 1
  }
  if [ -f node_modules/server-only/empty.js ]; then
    cp node_modules/server-only/empty.js node_modules/server-only/index.js
  fi
  printf '%s\n' "$LOCK_SIG" > "$STAMP_FILE"
}

sync_node_modules_if_needed

if [ -d "./prisma/migrations" ] && [ "$(ls -A ./prisma/migrations 2>/dev/null)" ]; then
  echo "[app-prepare] prisma migrate deploy"
  node ./scripts/run-prisma.mjs migrate deploy
else
  echo "[app-prepare] no migrations — prisma db push"
  node ./scripts/run-prisma.mjs db push --accept-data-loss --skip-generate
fi

echo "[app-prepare] prisma generate"
node ./scripts/run-prisma.mjs generate

echo "[app-prepare] ok"
