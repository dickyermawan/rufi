FROM node:20-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Install dependencies based on the preferred package manager
COPY package.json package-lock.json* ./
RUN npm ci

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generate Prisma Client
RUN npx prisma generate

# Next.js collects completely anonymous telemetry data about general usage.
ENV NEXT_TELEMETRY_DISABLED=1

RUN npm run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Install openssl for Prisma
RUN apk add --no-cache openssl

COPY --from=builder /app/public ./public

# Set the correct permission for prerender cache
RUN mkdir .next
RUN chown nextjs:nodejs .next

# Create data directory for SQLite persistence
RUN mkdir -p /app/data
RUN chown -R nextjs:nodejs /app/data

# Automatically leverage output traces to reduce image size
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma

# Setup user environment
USER nextjs
# Set NPM prefix to user directory and put it FIRST in PATH to override any system globals
ENV NPM_CONFIG_PREFIX=/home/nextjs/.npm-global
ENV PATH=/home/nextjs/.npm-global/bin:$PATH

# Install prisma locally for the user with unsafe-perm to ensure postinstall scripts run
# This is critical for downloading the correct engines for the architecture
RUN mkdir -p /home/nextjs/.npm-global && \
    npm install -g prisma@5 --unsafe-perm

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
# Default database URL if not provided
ENV DATABASE_URL="file:/app/data/rufi.db"

# Run migrations and start the server
CMD ["sh", "-c", "prisma migrate deploy && node server.js"]
