# Database Migration Guide

This guide explains how to create and manage database migrations for the Web3 Wallet project.

## Overview

Migrations are SQL files that track database schema changes. Instead of running SQL directly, you create migration files that are versioned and tracked. This ensures consistency across development, testing, and production environments.

## Current Setup

- **Database**: web3_wallet (PostgreSQL)
- **User**: quang
- **Host**: localhost
- **Port**: 5432
- **Migrations Folder**: `backend/migrations/`
- **Tracking Table**: `schema_migrations` (auto-created)

## Configuration

Your `.env` file now includes:
```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=web3_wallet
DB_USER=quang
DB_PASSWORD=
```

## Creating a New Migration

### Method 1: Using the helper script (Recommended)

```bash
cd backend
./create-migration.sh "add_tokens_table"
```

This creates a file like: `migrations/004_add_tokens_table.sql`

### Method 2: Using npm script

```bash
cd backend
npm run migrate "add_tokens_table"
```

### Method 3: Manual creation

Create a file in `backend/migrations/` with the format:
```
NNN_description_here.sql
```

Where NNN is the next sequential number (001, 002, 003, etc.)

## Writing Migration SQL

Edit the created migration file and add your SQL:

```sql
-- Migration: Create transactions table
-- Date: 2024-06-04

CREATE TABLE transactions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    tx_hash VARCHAR(255) UNIQUE NOT NULL,
    from_address VARCHAR(42) NOT NULL,
    to_address VARCHAR(42) NOT NULL,
    amount DECIMAL(20, 8) NOT NULL,
    token_address VARCHAR(42),
    status VARCHAR(50) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_transactions_user_id ON transactions(user_id);
CREATE INDEX idx_transactions_tx_hash ON transactions(tx_hash);
CREATE INDEX idx_transactions_status ON transactions(status);
```

## Applying Migrations

### Run all pending migrations:

```bash
cd backend
./run-migrations.sh
```

Or use npm:

```bash
npm run migrate:run
```

This will:
1. Create `schema_migrations` tracking table if it doesn't exist
2. Check which migrations have already been applied
3. Run only the pending migrations
4. Track applied migrations in the database

## Viewing Applied Migrations

Connect to the database and check:

```bash
psql -U quang -d web3_wallet
```

Then query:

```sql
SELECT * FROM schema_migrations ORDER BY applied_at;
```

## Viewing Current Schema

Check tables:
```bash
\dt
```

Check table structure:
```bash
\d table_name
```

## Best Practices

### 1. **One change per migration**
   - ❌ Bad: Add multiple unrelated tables in one migration
   - ✅ Good: One migration for each logical change

### 2. **Descriptive names**
   - ❌ Bad: `004_update.sql`
   - ✅ Good: `004_add_transaction_status_index.sql`

### 3. **Reversible migrations** (optional but helpful)
   ```sql
   -- Migration: Add payment_method column
   
   -- UP: Add column
   ALTER TABLE users ADD COLUMN payment_method VARCHAR(50);
   
   -- To revert if needed (comment or separate DOWN file):
   -- ALTER TABLE users DROP COLUMN payment_method;
   ```

### 4. **Add indexes for performance**
   ```sql
   CREATE INDEX idx_users_email ON users(email);
   CREATE INDEX idx_transactions_user_id ON transactions(user_id);
   ```

### 5. **Use constraints properly**
   ```sql
   ALTER TABLE transactions 
   ADD CONSTRAINT fk_user_id 
   FOREIGN KEY (user_id) 
   REFERENCES users(id) ON DELETE CASCADE;
   ```

## Example: Creating a Tokens Table

```bash
# 1. Create migration file
./create-migration.sh "create_tokens_table"
```

Edit `migrations/004_create_tokens_table.sql`:

```sql
-- Migration: Create tokens table to store token metadata
-- Date: 2024-06-04

CREATE TABLE tokens (
    id SERIAL PRIMARY KEY,
    address VARCHAR(42) UNIQUE NOT NULL,
    symbol VARCHAR(10) NOT NULL,
    name VARCHAR(100) NOT NULL,
    decimals INTEGER DEFAULT 18,
    chain_id INTEGER NOT NULL,
    logo_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_tokens_address ON tokens(address);
CREATE INDEX idx_tokens_symbol ON tokens(symbol);
```

```bash
# 2. Apply migration
./run-migrations.sh
```

Output:
```
📊 Checking for pending migrations...

⏳ Applying migration: 004_create_tokens_table.sql
CREATE TABLE
CREATE INDEX
CREATE INDEX
✅ 004_create_tokens_table.sql applied

✅ All migrations completed successfully!
```

## Troubleshooting

### Connection refused error

```
psql: error: could not connect to server: No such file or directory
```

**Solution**: Start PostgreSQL service
```bash
# macOS
brew services start postgresql

# Linux
sudo systemctl start postgresql
```

### Database does not exist

```
psql: error: database "web3_wallet" does not exist
```

**Solution**: Create the database
```bash
createdb -U quang web3_wallet
```

### Migration already applied but file changed

Don't modify already-applied migrations. Create a new migration with the fix:

```bash
./create-migration.sh "fix_tokens_table_constraint"
```

### Check what's been applied

```bash
psql -U quang -d web3_wallet
SELECT * FROM schema_migrations;
```

## Integration with Your App

Your migrations automatically run when the backend starts (see `src/services/syncService.ts` or wherever you initialize the database).

To manually ensure migrations are applied before running the app:

```bash
# Run migrations first
npm run migrate:run

# Then start the app
npm run dev
```

## Common Migration Examples

### Add a new column
```sql
ALTER TABLE users ADD COLUMN phone_number VARCHAR(20);
```

### Rename a column
```sql
ALTER TABLE users RENAME COLUMN phone_number TO mobile_number;
```

### Add a unique constraint
```sql
ALTER TABLE users ADD CONSTRAINT unique_email UNIQUE(email);
```

### Create a junction table for many-to-many
```sql
CREATE TABLE user_tokens (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_address VARCHAR(42) NOT NULL,
    balance DECIMAL(20, 8) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, token_address)
);
```

### Add a trigger for updated_at
```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
```

## Next Steps

You're now ready to:
1. Create migration files with descriptive names
2. Write SQL in each migration file
3. Apply migrations with `npm run migrate:run`
4. Track all schema changes in version control
5. Deploy confidently knowing schema is versioned
