# syntax=docker/dockerfile:1.7
# EKO — one image, one explicitly selected process per container.

FROM node:22.23.3-bookworm-slim@sha256:43ac6c60b8f89723f746e8a92ce91abd5017e627ce1ddfe4238355d3a30b772c AS build
RUN corepack enable && corepack prepare pnpm@11.5.1 --activate
WORKDIR /repo
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.base.json ./
COPY packages/shared/package.json packages/shared/
COPY packages/receipts-verifier/package.json packages/receipts-verifier/
COPY packages/chain/package.json packages/chain/
COPY packages/db/package.json packages/db/
COPY packages/playbooks/package.json packages/playbooks/
COPY packages/policy/package.json packages/policy/
COPY packages/signal/package.json packages/signal/
COPY packages/untrusted/package.json packages/untrusted/
COPY apps/server/package.json apps/server/
COPY apps/bots/package.json apps/bots/
COPY apps/web/package.json apps/web/
COPY apps/indexer/package.json apps/indexer/
COPY apps/engines/package.json apps/engines/
COPY apps/mcp/package.json apps/mcp/
COPY apps/og-renderer/package.json apps/og-renderer/
COPY apps/landing/package.json apps/landing/
COPY contracts/package.json contracts/
RUN pnpm install --frozen-lockfile
COPY . .
ARG EKO_SOURCE_REVISION
# Railway injects the service variable into this ARG; .git is excluded from context.
# Refuse an unpinned production image, without placing the revision in bundle bytes.
RUN node -e "if (!/^[a-f0-9]{40}$/.test(process.env.EKO_SOURCE_REVISION || '')) process.exit(1)"
RUN pnpm --filter @eko/web build \
 && pnpm --filter @eko/landing build \
 && pnpm --filter @eko/server build \
 && pnpm --filter @eko/server deploy --prod --legacy /out

FROM node:22.23.3-bookworm-slim@sha256:43ac6c60b8f89723f746e8a92ce91abd5017e627ce1ddfe4238355d3a30b772c AS runtime
ENV NODE_ENV=production \
    APP_ROLE=api \
    RUN_WORKER=false \
    LIVE_TRADING_ENABLED=false \
    SERVE_WEB=true \
    WEB_DIST_DIR=/app/web \
    LANDING_DIST_DIR=/app/landing \
    MIGRATIONS_DIR=/app/drizzle \
    ADDRESSES_FILE=/app/dist/addresses.4663.yaml \
    PORT=8710
WORKDIR /app
COPY --from=build /out/node_modules ./node_modules
COPY --from=build /repo/apps/server/package.json ./package.json
COPY --from=build /repo/apps/server/dist ./dist
COPY --from=build /repo/apps/server/drizzle ./drizzle
COPY --from=build /repo/apps/web/dist ./web
COPY --from=build /repo/apps/landing/dist ./landing
RUN mkdir -p /app/.data && chown -R node:node /app/.data
USER node
EXPOSE 8710
# HTTP health probes belong to API services; workers have no HTTP listener.
CMD ["node", "dist/launch.js"]
