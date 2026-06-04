#!/bin/bash

# Migration creation helper script
# Usage: ./create-migration.sh "migration description"

set -e

MIGRATIONS_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )/migrations"

if [ -z "$1" ]; then
    echo "❌ Error: Please provide a migration name"
    echo "Usage: ./create-migration.sh 'create_transactions_table'"
    exit 1
fi

# Get the next migration number
LAST_MIGRATION=$(ls -1 "$MIGRATIONS_DIR" | tail -1 | cut -d_ -f1 | sed 's/^0*//')
if [ -z "$LAST_MIGRATION" ]; then
    NEXT_NUMBER=1
else
    NEXT_NUMBER=$((LAST_MIGRATION + 1))
fi

# Pad with zeros for consistent naming (001, 002, 003, etc.)
MIGRATION_NUMBER=$(printf "%03d" $NEXT_NUMBER)
MIGRATION_NAME=$1
MIGRATION_FILE="$MIGRATIONS_DIR/${MIGRATION_NUMBER}_${MIGRATION_NAME}.sql"

# Create the migration file with template
cat > "$MIGRATION_FILE" << 'EOF'
-- Migration: DESCRIPTION_HERE
-- Date: $(date)

-- Write your SQL here
-- Example:
-- CREATE TABLE example_table (
--     id SERIAL PRIMARY KEY,
--     name VARCHAR(255) NOT NULL,
--     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
-- );
EOF

echo "✅ Migration created: $MIGRATION_FILE"
echo ""
echo "📝 Edit the file to add your SQL commands:"
echo "   nano $MIGRATION_FILE"
echo ""
echo "🚀 To apply migrations, run:"
echo "   npm run migrate"
