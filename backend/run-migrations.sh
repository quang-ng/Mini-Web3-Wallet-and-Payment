#!/bin/bash

# Migration runner script
# Applies all pending migrations to the database

set -e

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
MIGRATIONS_DIR="$SCRIPT_DIR/migrations"

# Load environment variables
if [ -f "$SCRIPT_DIR/.env" ]; then
    export $(cat "$SCRIPT_DIR/.env" | grep -v '^#' | xargs)
fi

DB_HOST=${DB_HOST:-localhost}
DB_PORT=${DB_PORT:-5432}
DB_NAME=${DB_NAME:-web3_wallet}
DB_USER=${DB_USER:-quang}
DB_PASSWORD=${DB_PASSWORD:-}

# Build connection string
if [ -z "$DB_PASSWORD" ]; then
    PGPASSWORD="" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -v ON_ERROR_STOP=1 << EOF
        -- Create migrations tracking table if not exists
        CREATE TABLE IF NOT EXISTS schema_migrations (
            id SERIAL PRIMARY KEY,
            name VARCHAR(255) UNIQUE NOT NULL,
            applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
EOF
else
    PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -v ON_ERROR_STOP=1 << EOF
        -- Create migrations tracking table if not exists
        CREATE TABLE IF NOT EXISTS schema_migrations (
            id SERIAL PRIMARY KEY,
            name VARCHAR(255) UNIQUE NOT NULL,
            applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
EOF
fi

echo "📊 Checking for pending migrations..."
echo ""

# Run each migration file
for migration_file in "$MIGRATIONS_DIR"/*.sql; do
    if [ -f "$migration_file" ]; then
        migration_name=$(basename "$migration_file")

        # Check if migration already applied
        if [ -z "$DB_PASSWORD" ]; then
            IS_APPLIED=$(PGPASSWORD="" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -tc "SELECT COUNT(*) FROM schema_migrations WHERE name = '$migration_name';" 2>/dev/null || echo "0")
        else
            IS_APPLIED=$(PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -tc "SELECT COUNT(*) FROM schema_migrations WHERE name = '$migration_name';" 2>/dev/null || echo "0")
        fi

        if [ "$IS_APPLIED" -eq 0 ]; then
            echo "⏳ Applying migration: $migration_name"

            if [ -z "$DB_PASSWORD" ]; then
                PGPASSWORD="" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f "$migration_file" -v ON_ERROR_STOP=1
            else
                PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f "$migration_file" -v ON_ERROR_STOP=1
            fi

            # Record migration
            if [ -z "$DB_PASSWORD" ]; then
                PGPASSWORD="" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "INSERT INTO schema_migrations (name) VALUES ('$migration_name');"
            else
                PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "INSERT INTO schema_migrations (name) VALUES ('$migration_name');"
            fi

            echo "✅ $migration_name applied"
        else
            echo "⏭️  Already applied: $migration_name"
        fi
    fi
done

echo ""
echo "✅ All migrations completed successfully!"
