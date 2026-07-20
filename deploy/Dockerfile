ARG NODE_IMAGE=node:20-bookworm-slim
ARG NGINX_IMAGE=nginx:1.27-alpine
FROM ${NODE_IMAGE} AS build

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts --no-audit --no-fund \
    && npm cache clean --force

COPY . .

ARG APP_VERSION=0.0.0
ARG APP_REVISION=unknown
RUN npm run build \
    && printf '{"service":"svg-draw","version":"%s","revision":"%s"}\n' \
      "$APP_VERSION" "$APP_REVISION" > dist/release.json

FROM ${NGINX_IMAGE}

ARG APP_VERSION=0.0.0
ARG APP_REVISION=unknown

LABEL org.opencontainers.image.title="svg-draw" \
      org.opencontainers.image.version="$APP_VERSION" \
      org.opencontainers.image.revision="$APP_REVISION"

COPY deploy/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

HEALTHCHECK --interval=10s --timeout=5s --retries=10 --start-period=10s \
  CMD wget -q -O /dev/null http://127.0.0.1/health || exit 1
