FROM node:20-alpine AS build
RUN npm install -g pnpm

WORKDIR /app
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml* ./
COPY packages/shared/package.json ./packages/shared/
COPY packages/parser/package.json ./packages/parser/
COPY packages/analyzer/package.json ./packages/analyzer/
COPY apps/api/package.json ./apps/api/
COPY apps/web/package.json ./apps/web/
RUN pnpm install --frozen-lockfile

COPY . .
RUN pnpm --filter @pea/web build

EXPOSE 4000
ENV NODE_ENV=production
CMD ["pnpm", "--filter", "@pea/api", "dev"]