# apps/hello-world/Dockerfile
FROM node:20-alpine
WORKDIR /app

# Install only production deps
COPY package*.json ./
RUN npm install --omit=dev

# Copy app sources
COPY . .

# Default to port 5000 locally, but overridden by the PLATFORM via $PORT
ENV PORT=5000

# Document the port your app listens on by default
EXPOSE 5000

# Start your app; it will read PORT from env
CMD ["npm", "start"]
