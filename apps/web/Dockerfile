# Built from the repo root (see docker-compose.yml `context: .`) - same reasoning as
# apps/api/Dockerfile. Vite bakes VITE_ vars into the static bundle at BUILD time, not
# runtime, so VITE_API_URL must be supplied as a build arg, not a container env var.
FROM node:22-slim AS base
WORKDIR /app

FROM base AS deps
COPY package.json package-lock.json tsconfig.base.json ./
COPY packages/shared/package.json packages/shared/package.json
COPY apps/web/package.json apps/web/package.json
RUN npm ci

FROM deps AS build
COPY packages/shared packages/shared
COPY apps/web apps/web
# Empty VITE_API_URL means "same origin" - correct behind the Caddy reverse proxy, which
# serves web and api on one domain. Only set it when the API lives on a different origin.
ARG VITE_API_URL=
ENV VITE_API_URL=$VITE_API_URL
ARG VITE_GOOGLE_CLIENT_ID=
ENV VITE_GOOGLE_CLIENT_ID=$VITE_GOOGLE_CLIENT_ID
RUN npm run build -w packages/shared && \
    npm run build -w apps/web

FROM nginx:1.27-alpine AS runtime
COPY --from=build /app/apps/web/dist /usr/share/nginx/html
COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
