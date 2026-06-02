FROM node:22-alpine AS base
RUN corepack enable pnpm

# ─── Builder ─────────────────────────────────────────────────────────────────
FROM base AS builder
WORKDIR /app

# Copy workspace manifests first for layer caching
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY tsconfig.base.json tsconfig.json ./

COPY apps/api/package.json ./apps/api/
COPY packages/db/package.json ./packages/db/
COPY packages/shared/package.json ./packages/shared/
COPY packages/api-client/package.json ./packages/api-client/
COPY packages/api-spec/package.json ./packages/api-spec/

RUN pnpm install --frozen-lockfile

# Copy all source
COPY apps/api/ ./apps/api/
COPY packages/db/ ./packages/db/
COPY packages/shared/ ./packages/shared/

# Build
RUN pnpm --filter @workspace/api-server run build

# ─── Runtime ─────────────────────────────────────────────────────────────────
FROM node:22-alpine AS runtime
WORKDIR /app

COPY --from=builder /app/apps/api/dist ./dist

ENV NODE_ENV=production

CMD ["node", "--enable-source-maps", "./dist/index.mjs"]
