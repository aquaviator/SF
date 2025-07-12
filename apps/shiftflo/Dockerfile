# 1) Builder
FROM node:20-alpine AS builder
WORKDIR /app

# Copy lockfiles & configs
COPY package.json package-lock.json tsconfig.json vite.config.ts ./

# Copy source
COPY client client
COPY server server
COPY shared shared

# Install & build
RUN npm ci
RUN npm run build

# 2) Production image
FROM node:20-alpine AS production
WORKDIR /app

# Install only prod deps
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# Copy built artifacts
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/server ./server
COPY --from=builder /app/shared ./shared

ENV NODE_ENV=production
EXPOSE 5000

CMD ["node", "server/index.js"]
