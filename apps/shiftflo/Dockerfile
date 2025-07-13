# 1) Builder stage: install & build everything
FROM node:20-alpine AS builder
WORKDIR /app

# install all deps (dev+prod) so esbuild can bundle / resolve correctly
COPY package*.json ./
RUN npm ci

# copy your source & build
COPY . .
RUN npm run build   # => vite build && esbuild server/index.ts … --outdir=dist

# 2) Production stage: only pull in the prod deps + your built output
FROM node:20-alpine AS production
WORKDIR /app

# install only prod deps (express, dotenv, etc)
COPY package*.json ./
RUN npm ci --omit=dev

# pull in your compiled app
COPY --from=builder /app/dist ./dist

# runtime env
ENV NODE_ENV=production
ENV PORT=8080
EXPOSE 8080

# use your start script (which does: cross-env NODE_ENV=production node dist/index.js)
CMD ["npm","start"]
