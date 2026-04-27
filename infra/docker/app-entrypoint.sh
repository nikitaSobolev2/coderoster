#!/bin/sh
set -e

# Apply pending migrations on every container boot. Safe — `migrate deploy`
# is a no-op when the database is already at the head revision.
if [ "${SKIP_MIGRATIONS:-false}" != "true" ]; then
  echo "[entrypoint] running prisma migrate deploy"
  node ./scripts/run-prisma.mjs migrate deploy
fi

exec "$@"
