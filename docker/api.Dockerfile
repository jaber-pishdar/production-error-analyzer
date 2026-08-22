FROM node:20-alpine AS base

RUN npm install -g pnpm

FROM base AS deps
WORKDIR /app
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY apps/api/package.json ./apps/api/
COPY packages/parser/package.json ./packages/parser/
COPY packages/analyzer/package.json ./packages/analyzer/
COPY packages/shared/package.json ./packages/shared/
RUN pnpm install --frozen-lockfile

FROM deps AS dev
WORKDIR /app
COPY . .
CMD ["pnpm", "--filter", "@pea/api", "dev"]