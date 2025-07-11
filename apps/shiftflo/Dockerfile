# apps/hello-world/Dockerfile

FROM node:20-alpine
WORKDIR /app

# Install all dependencies (dev and production) because the 'build' step needs dev dependencies
COPY package*.json ./
RUN npm install

# Copy your source
COPY . .

# Run your build script
RUN npm run build

# Default port for local/docker run
ENV PORT=5000

# Document your default listen port
EXPOSE 5000

# When Cloud Run (or similar) injects its own PORT (e.g. 8080),
# your app (using process.env.PORT) will pick that up instead.
CMD ["npm", "start"]