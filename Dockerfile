# Stage 1: Builder
FROM node:20-slim AS builder

WORKDIR /app

# Copy dependency manifests
COPY package*.json ./

# Install ALL dependencies with BuildKit cache mount for speed
RUN --mount=type=cache,target=/root/.npm \
    npm ci

# Copy Prisma schema and generate client
COPY prisma ./prisma
RUN npx prisma generate

# Copy the rest of the source code
COPY . .

# Build the TypeScript project
RUN npm run build

# Prune devDependencies to keep the image lean
RUN npm prune --production

# Stage 2: Runner
FROM node:20-slim AS runner

WORKDIR /app

# Set production environment
ENV NODE_ENV=production

# Copy only the necessary runtime files from the builder
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/secrets ./secrets

# Expose the API port
EXPOSE 4000

# Start the application
CMD ["node", "dist/server.js"]
