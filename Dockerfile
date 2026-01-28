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

# Install openssl for Prisma and su-exec for entrypoint
RUN apk add --no-cache openssl su-exec

COPY --from=builder /app/public ./public

# Setup user environment
# We stay as root initially to fix permissions in entrypoint
ENV NPM_CONFIG_PREFIX=/home/nextjs/.npm-global
ENV PATH=/home/nextjs/.npm-global/bin:$PATH

# Install prisma locally for the user with unsafe-perm
RUN mkdir -p /home/nextjs/.npm-global && \
    npm install -g prisma@5 --unsafe-perm && \
    chown -R nextjs:nodejs /home/nextjs

# Copy entrypoint script
COPY docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
# Default database URL if not provided
ENV DATABASE_URL="file:/app/data/rufi.db"

ENTRYPOINT ["/usr/local/bin/docker-entrypoint.sh"]

# Run migrations and start the server
CMD ["sh", "-c", "prisma migrate deploy && node server.js"]
