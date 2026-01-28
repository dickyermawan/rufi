#!/bin/sh
set -e

# Fix permissions for data directory (mounted volume)
# This ensures the 'nextjs' user can write to the database
if [ -d "/app/data" ]; then
  chown -R nextjs:nodejs /app/data
fi

# Execute the passed command as user 'nextjs'
exec su-exec nextjs:nodejs "$@"
