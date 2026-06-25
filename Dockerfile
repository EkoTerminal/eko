# syntax=docker/dockerfile:1.7
# EKO — one image, one explicitly selected process per container.

FROM node:22-bookworm-slim AS build
RUN corepack enable && corepack prepare pnpm@11.5.1 --activate
WORKDIR /repo
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.base.json ./
COPY packages/shared/package.json packages/shared/
COPY packages/chain/package.json packages/chain/
COPY packages/db/package.json packages/db/
COPY packages/playbooks/package.json packages/playbooks/
COPY packages/policy/package.json packages/policy/
COPY packages/signal/package.json packages/signal/
COPY packages/untrusted/package.json packages/untrusted/
COPY apps/server/package.json apps/server/
COPY apps/web/package.json apps/web/
COPY apps/indexer/package.json apps/indexer/
COPY apps/engines/package.json apps/engines/
COPY apps/mcp/package.json apps/mcp/
COPY contracts/package.json contracts/
RUN pnpm install --frozen-lockfile
COPY . .
RUN pnpm --filter @eko/web build \
 && pnpm --filter @eko/server build \
 && pnpm --filter @eko/server deploy --prod --legacy /out

FROM node:22-bookworm-slim AS runtime
ENV NODE_ENV=production \
    APP_ROLE=api \
    RUN_WORKER=false \
    LIVE_TRADING_ENABLED=false \
    SERVE_WEB=true \
    WEB_DIST_DIR=/app/web \
    MIGRATIONS_DIR=/app/drizzle \
    ADDRESSES_FILE=/app/dist/addresses.4663.yaml \
    PORT=8710
WORKDIR /app
COPY --from=build /out/node_modules ./node_modules
COPY --from=build /repo/apps/server/package.json ./package.json
COPY --from=build /repo/apps/server/dist ./dist
COPY --from=build /repo/apps/server/drizzle ./drizzle
COPY --from=build /repo/apps/web/dist ./web
RUN mkdir -p /app/.data && chown -R node:node /app/.data
USER node
EXPOSE 8710
# HTTP health probes belong to API services; workers have no HTTP listener.
CMD ["node", "dist/launch.js"]
