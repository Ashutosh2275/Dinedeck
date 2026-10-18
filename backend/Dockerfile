# ==============================================================================
# DINEDECK PRODUCTION DOCKERFILE - MULTI-STAGE OPTIMIZED
# ==============================================================================

# --- Stage 1: Dependency & Build ---
FROM node:20-alpine AS builder
RUN apk add --no-cache openssl libc6-compat
WORKDIR /app

# Copy dependency manifests
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies including devDependencies for build
RUN npm ci || npm install

# Copy application source code
COPY . .

# Generate Prisma Client with native & linux-musl binaries
RUN npx prisma generate

# Build TypeScript to dist
RUN npm run build

# --- Stage 2: Production Runtime ---
FROM node:20-alpine AS runner
RUN apk add --no-cache openssl libc6-compat curl
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=8080
ENV HOST=0.0.0.0

# Install production dependencies only
COPY package*.json ./
RUN npm ci --omit=dev || npm install --omit=dev

# Copy compiled application code and Prisma artifacts from builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder /app/public ./public

# Health check to ensure the service is responsive
HEALTHCHECK --interval=10s --timeout=5s --start-period=15s --retries=3 \
  CMD curl -f http://localhost:8080/health || exit 1

EXPOSE 8080

CMD ["node", "dist/index.js"]
