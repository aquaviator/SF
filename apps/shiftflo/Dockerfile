# apps/hello-world/Dockerfile

FROM node:20-alpine
WORKDIR /app

# Install only production deps
COPY package*.json ./
RUN npm install --omit=dev

# Copy your source
COPY . .

# Default port for local/docker run
ENV PORT=5000

# Document your default listen port
EXPOSE 5000

# When Cloud Run (or similar) injects its own PORT (e.g. 8080),
# your app (using process.env.PORT) will pick that up instead.
CMD ["npm", "start"]
