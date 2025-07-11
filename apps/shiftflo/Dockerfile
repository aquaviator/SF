# apps/hello-world/Dockerfile
FROM node:20-alpine
WORKDIR /app

# Copy only package manifests, install dependencies
COPY package*.json ./

# Use npm install (omit dev deps), since we don’t have a lockfile
RUN npm install --omit=dev

# Copy the rest of your app
COPY . .

EXPOSE 8080
CMD ["npm", "start"]
