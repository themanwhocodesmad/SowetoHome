# Built from the repo root (see docker-compose.yml `context: .`) - same reasoning as
# apps/api/Dockerfile.
FROM node:22-slim AS base
WORKDIR /app

FROM base AS deps
COPY package.json package-lock.json tsconfig.base.json ./
COPY packages/shared/package.json packages/shared/package.json
COPY packages/db/package.json packages/db/package.json
COPY apps/worker/package.json apps/worker/package.json
RUN npm ci

FROM deps AS build
# Build-stage only: see apps/api/Dockerfile - prevents tsc OOM on small (512MB) hosts.
ENV NODE_OPTIONS=--max-old-space-size=768
COPY packages/shared packages/shared
COPY packages/db packages/db
COPY apps/worker apps/worker
RUN npm run build -w packages/shared && \
    npm run build -w packages/db && \
    npm run build -w apps/worker

FROM base AS runtime
ENV NODE_ENV=production
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/package.json ./package.json
COPY --from=build /app/packages/shared/package.json packages/shared/package.json
COPY --from=build /app/packages/shared/dist packages/shared/dist
COPY --from=build /app/packages/db/package.json packages/db/package.json
COPY --from=build /app/packages/db/dist packages/db/dist
COPY --from=build /app/apps/worker/package.json apps/worker/package.json
COPY --from=build /app/apps/worker/dist apps/worker/dist

WORKDIR /app/apps/worker
CMD ["node", "dist/worker.js"]
