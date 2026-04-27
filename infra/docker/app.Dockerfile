FROM node:20-alpine AS deps
WORKDIR /app
COPY app/package.json app/package-lock.json* ./
RUN npm install --legacy-peer-deps --ignore-scripts
RUN cp node_modules/server-only/empty.js node_modules/server-only/index.js

FROM deps AS dev
ENV NODE_ENV=development NEXT_TELEMETRY_DISABLED=1 SKIP_ENV_VALIDATION=1
COPY app ./
RUN npx prisma generate
COPY infra/docker/app-entrypoint.sh /usr/local/bin/app-entrypoint.sh
RUN chmod +x /usr/local/bin/app-entrypoint.sh
EXPOSE 3000
ENTRYPOINT ["/usr/local/bin/app-entrypoint.sh"]
CMD ["npm", "run", "dev"]

FROM deps AS builder
ENV NEXT_TELEMETRY_DISABLED=1 SKIP_ENV_VALIDATION=1
COPY app ./
RUN npx prisma generate && npm run build

FROM node:20-alpine AS prod
WORKDIR /app
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1
RUN addgroup -S app && adduser -S -u 1001 -G app app
COPY --from=builder --chown=app:app /app ./
COPY infra/docker/app-entrypoint.sh /usr/local/bin/app-entrypoint.sh
RUN chmod +x /usr/local/bin/app-entrypoint.sh
USER app
EXPOSE 3000
ENTRYPOINT ["/usr/local/bin/app-entrypoint.sh"]
CMD ["node", "node_modules/next/dist/bin/next", "start"]
