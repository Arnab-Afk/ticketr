#!/bin/sh
set -e

if [ -n "$DATABASE_URL" ]; then
  echo ">> Syncing database schema..."
  npx prisma db push --skip-generate

  if [ "$SEED_DATABASE" = "true" ]; then
    echo ">> Seeding database..."
    npx prisma db seed
  fi
else
  echo ">> WARNING: DATABASE_URL is not set; skipping database setup."
fi

echo ">> Starting ticketr on port ${PORT:-3000}..."
exec "$@"
