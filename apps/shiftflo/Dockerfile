# Stage 1: build
FROM node:18-alpine AS builder
WORKDIR /app

# install deps & build
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Stage 2: production image
FROM node:18-alpine AS production
WORKDIR /app

# only prod deps
COPY package*.json ./
RUN npm ci --only=production --ignore-scripts

# copy over the built output
COPY --from=builder /app/dist ./dist

# drop source & TS—runtime only needs dist
# create a non-root user
RUN addgroup -g 1001 -S nodejs \
 && adduser -S shiftflo -u 1001 \
 && chown -R shiftflo:nodejs /app
USER shiftflo

EXPOSE 5000
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:5000/api/health',res=>process.exit(res.statusCode===200?0:1))"

# run the compiled server
CMD ["node", "dist/index.js"]
