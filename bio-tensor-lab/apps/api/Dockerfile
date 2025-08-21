FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json pnpm-workspace.yaml turbo.json ./
COPY apps/api/package.json apps/api/package.json
RUN corepack enable && corepack prepare pnpm@latest --activate && pnpm install --frozen-lockfile

FROM node:20-alpine AS builder
WORKDIR /app
COPY . .
RUN corepack enable && corepack prepare pnpm@latest --activate && pnpm --filter @biotensor/api build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/apps/api/dist ./dist
COPY --from=builder /app/apps/api/package.json ./package.json
EXPOSE 4000
CMD ["node", "dist/main.js"]