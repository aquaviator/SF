# apps/hello-world/Dockerfile

FROM node:20-alpine
WORKDIR /app

# Install only production deps
# Copy package.json and package-lock.json (or yarn.lock) first for caching
COPY package*.json ./
RUN npm install --omit=dev

# Copy your source (all your .ts files, etc.)
COPY . .

# *** IMPORTANT: ADD THIS BUILD STEP ***
# This assumes you have a 'build' script defined in your package.json
# e.g., "build": "tsc" or "build": "webpack" or "build": "next build" etc.
# Make sure your build script outputs to a 'dist' directory.
RUN npm run build

# Default port for local/docker run
ENV PORT=5000

# Document your default listen port
EXPOSE 5000

# When Cloud Run (or similar) injects its own PORT (e.g. 8080),
# your app (using process.env.PORT) will pick that up instead.
CMD ["npm", "start"]