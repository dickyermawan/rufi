#!/bin/sh
set -e

# Fix permissions for data directory (mounted volume)
echo "Setting permissions for /app/data..."
if [ -d "/app/data" ]; then
  # Ensure the directory is owned by the nextjs user
  chown -R nextjs:nodejs /app/data
  # Ensure specific permissions
  chmod -R 755 /app/data
fi

# Debug: Show permissions
ls -ld /app/data

# Execute the passed command as user 'nextjs'
exec su-exec nextjs:nodejs "$@"
