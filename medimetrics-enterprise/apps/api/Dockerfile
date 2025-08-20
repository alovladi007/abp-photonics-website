# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig*.json ./

# Install dependencies
RUN npm ci --only=production && \
    npm cache clean --force

# Copy source code
COPY src ./src

# Build application
RUN npm run build

# Development stage
FROM node:20-alpine AS development

WORKDIR /app

# Install all dependencies for development
COPY package*.json ./
RUN npm ci && \
    npm cache clean --force

COPY . .

EXPOSE 8000 9100

CMD ["npm", "run", "dev"]

# Production stage
FROM node:20-alpine AS production

RUN apk add --no-cache tini

WORKDIR /app

# Copy only production dependencies
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY package*.json ./

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

USER nodejs

EXPOSE 8000 9100

ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "dist/main"]