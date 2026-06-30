# Build stage
FROM node:24-alpine AS build

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci

# Copy source code and build
COPY . .
RUN npm run build

# Production stage
FROM node:24-alpine

WORKDIR /app

# Copy package.json for production install
COPY package*.json ./
RUN npm ci --omit=dev

# Copy compiled output from build stage
COPY --from=build /app/dist ./dist
# Copy src for static docs and templates
COPY --from=build /app/src ./src
RUN mkdir -p /app/src/docs

# Start the application
CMD ["npm", "run", "start:prod"]
