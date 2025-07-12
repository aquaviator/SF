# 1) Build & bundle everything
FROM node:20-alpine AS builder
WORKDIR /app

# copy just what we need
COPY package*.json tsconfig.json vite.config.ts ./
COPY client client
COPY server server
COPY shared shared

# full install (incl. devDeps for esbuild & Vite)
RUN npm ci

# build client & bundle server into single dist/index.js
RUN npm run build

# 2) Production slice
FROM node:20-alpine AS production
WORKDIR /app

# install only prod-deps
COPY package*.json ./
RUN npm ci --omit=dev

# copy our single-file server + public assets
COPY --from=builder /app/dist ./dist

# cloud run uses PORT env var (defaults to 8080)
ENV PORT=8080 NODE_ENV=production

EXPOSE 8080

# run the bundled server
CMD ["node", "dist/index.js"]
