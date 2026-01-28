# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies for build (including libc for some native modules if needed)
RUN apk add --no-cache libc6-compat

# Copy package files
COPY package.json package-lock.json* ./

# Install dependencies (including devDependencies for build)
RUN npm ci

# Copy application files
COPY . .

# Generate Prisma Client
RUN npx prisma generate

# Build Next.js application
# Disable telemetry during build
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# Production stage
FROM node:20-alpine AS runner

WORKDIR /app

# Add labels
LABEL maintainer="Dicky Ermawan S <dikywana@gmail.com>"
LABEL description="Rufi - Modern S3 File Manager with Multi-provider Support"
LABEL version="1.0.0"

# Install runtime dependencies
# openssl is required for Prisma, su-exec for entrypoint script
RUN apk add --no-cache openssl su-exec sqlite-libs

# Create non-root user for security
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Set environment variables
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
ENV DATABASE_URL="file:/app/data/rufi.db"

# Setup NPM config for user (to avoid permission issues with global install if needed)
# We override PATH to prioritize user's bin
USER nextjs
ENV NPM_CONFIG_PREFIX=/home/nextjs/.npm-global
ENV PATH=/home/nextjs/.npm-global/bin:$PATH

# Install prisma CLI locally for the user (safe permission handling)
# We need this for 'prisma migrate deploy' at runtime
RUN mkdir -p /home/nextjs/.npm-global && \
    npm install -g prisma@5 --unsafe-perm

# Switch back to root to setup files and permissions
USER root

# Create necessary directories
RUN mkdir -p /app/data /app/public

# Copy built application from builder
# 1. Standalone build (includes necessary node_modules)
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
# 2. Static assets
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
# 3. Public assets
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
# 4. Prisma schema (Critical for migrations)
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma

# Copy entrypoint script
COPY docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

# Ensure permissions
RUN chown -R nextjs:nodejs /app

# Expose port
EXPOSE 3000

# Set entrypoint
ENTRYPOINT ["/usr/local/bin/docker-entrypoint.sh"]

# Start application (runs migrations first)
# We use full path to prisma to be safe, or rely on PATH
CMD ["sh", "-c", "prisma migrate deploy && node server.js"]
