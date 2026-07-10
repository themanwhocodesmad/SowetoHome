# Built from the repo root (see docker-compose.yml `context: .`) since npm workspaces
# needs the whole monorepo layout for its symlinked cross-package dependencies.
FROM node:22-slim AS base
WORKDIR /app

FROM base AS deps
COPY package.json package-lock.json tsconfig.base.json ./
COPY packages/shared/package.json packages/shared/package.json
COPY packages/db/package.json packages/db/package.json
COPY apps/api/package.json apps/api/package.json
RUN npm ci

FROM deps AS build
# Build-stage only: on small hosts (512MB droplet) Node derives a ~250MB default heap and
# tsc OOMs. An explicit larger heap can spill into swap; the runtime stage doesn't need it.
ENV NODE_OPTIONS=--max-old-space-size=768
COPY packages/shared packages/shared
COPY packages/db packages/db
COPY apps/api apps/api
RUN npm run build -w packages/shared && \
    npm run build -w packages/db && \
    npm run build -w apps/api

FROM base AS runtime
ENV NODE_ENV=production
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/package.json ./package.json
COPY --from=build /app/packages/shared/package.json packages/shared/package.json
COPY --from=build /app/packages/shared/dist packages/shared/dist
COPY --from=build /app/packages/db/package.json packages/db/package.json
COPY --from=build /app/packages/db/dist packages/db/dist
COPY --from=build /app/apps/api/package.json apps/api/package.json
COPY --from=build /app/apps/api/dist apps/api/dist

WORKDIR /app/apps/api
EXPOSE 4000
CMD ["node", "dist/server.js"]
