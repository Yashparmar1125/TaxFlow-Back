# Stage 1: Builder
FROM node:20-slim AS builder

WORKDIR /app

# Required for Prisma
RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

# Copy dependency manifests
COPY package*.json ./

# Install ALL dependencies
RUN npm ci

# Copy Prisma schema and generate client
COPY prisma ./prisma
RUN npx prisma generate

# Copy the rest of the source code
COPY . .

# Build the TypeScript project
RUN npm run build

# Prune devDependencies
RUN npm prune --production

# Stage 2: Runner
FROM node:20-slim AS runner

WORKDIR /app

# Runtime deps
RUN apt-get update && apt-get install -y openssl curl && rm -rf /var/lib/apt/lists/*

# Set production environment
ENV NODE_ENV=production

# Copy only necessary runtime files
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/secrets ./secrets

# Expose the API port
EXPOSE 4000

# Healthcheck
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:4000/api/v1/health || exit 1

# Start the application
CMD ["node", "dist/server.js"]
