FROM node:22-alpine AS deps
WORKDIR /app
COPY app/package.json app/package-lock.json* ./
# Lockfile is source of truth; matches CI. postinstall prisma is skipped here (DATABASE_URL absent at build).
# registry.npmjs.org occasionally drops TLS mid-download during image build — retry like prisma generate.
RUN for attempt in 1 2 3 4 5; do \
      npm ci --legacy-peer-deps --ignore-scripts && break; \
      echo "[dockerfile] npm ci failed (attempt ${attempt}/5), retrying in 5s"; \
      sleep 5; \
    done
RUN cp node_modules/server-only/empty.js node_modules/server-only/index.js

FROM deps AS dev
ENV NODE_ENV=development NEXT_TELEMETRY_DISABLED=1
COPY app ./
# `prisma generate` downloads engine binaries from binaries.prisma.sh on first
# run; that endpoint occasionally drops TLS during image build. Retry a few
# times before giving up so a single flake doesn't fail the whole build.
RUN for attempt in 1 2 3 4 5; do \
      SKIP_ENV_VALIDATION=1 npx prisma generate && break; \
      echo "[dockerfile] prisma generate failed (attempt ${attempt}/5), retrying in 5s"; \
      sleep 5; \
    done
COPY infra/docker/app-dev-prepare.sh /usr/local/bin/app-dev-prepare.sh
RUN chmod +x /usr/local/bin/app-dev-prepare.sh
EXPOSE 3000
CMD ["npm", "run", "dev"]

FROM deps AS builder
ENV NEXT_TELEMETRY_DISABLED=1 SKIP_ENV_VALIDATION=1
# `NEXT_PUBLIC_*` is inlined at `next build`. Runtime container env alone does not fix client
# bundles; pass the same values as build args (see docker-compose `build.args`).
ARG NEXT_PUBLIC_WORKOS_REDIRECT_URI=http://localhost:3000/callback
ARG NEXT_PUBLIC_USE_FAKE_DATA=false
ARG NEXT_PUBLIC_SELF_SERVE_PLANS=true
ENV NEXT_PUBLIC_WORKOS_REDIRECT_URI=$NEXT_PUBLIC_WORKOS_REDIRECT_URI
ENV NEXT_PUBLIC_USE_FAKE_DATA=$NEXT_PUBLIC_USE_FAKE_DATA
ENV NEXT_PUBLIC_SELF_SERVE_PLANS=$NEXT_PUBLIC_SELF_SERVE_PLANS
COPY app ./
RUN for attempt in 1 2 3 4 5; do \
      npx prisma generate && break; \
      echo "[dockerfile] prisma generate failed (attempt ${attempt}/5), retrying in 5s"; \
      sleep 5; \
    done && npm run build

FROM node:22-alpine AS prod
WORKDIR /app
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1
RUN addgroup -S app && adduser -S -u 1001 -G app app
COPY --from=builder --chown=app:app /app ./
COPY infra/docker/prod-entrypoint.sh /usr/local/bin/prod-entrypoint.sh
RUN chmod +x /usr/local/bin/prod-entrypoint.sh
USER app
EXPOSE 3000
ENTRYPOINT ["/usr/local/bin/prod-entrypoint.sh"]
CMD ["node", "node_modules/next/dist/bin/next", "start"]
