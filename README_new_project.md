# 🔗 Mini Etherscan: Blockchain Explorer & Indexing Platform

**A hands-on project to understand how blockchain explorers actually work — building a real ETL pipeline for Ethereum data.**

---

## 📚 Table of Contents

1. [Quick Overview](#quick-overview)
2. [Learning Goals](#learning-goals)
3. [System Architecture](#system-architecture)
4. [Core Concepts Explained](#core-concepts-explained)
5. [Setup Guide (MacBook + Docker)](#setup-guide-macbook--docker)
6. [Phase-by-Phase Implementation](#phase-by-phase-implementation)
7. [Testing & Validation](#testing--validation)
8. [Scaling Strategy](#scaling-strategy)

---

## Quick Overview

**What you're building:**
- A system that continuously indexes Ethereum blockchain data
- Decodes smart contract events (ERC20 transfers, etc.)
- Stores everything in PostgreSQL for fast queries
- Exposes REST API (FastAPI) + optional web UI (Next.js)

**Why this matters:**
- Understand how Alchemy, The Graph, and Etherscan work behind the scenes
- Learn production-grade ETL pipelines, not just smart contracts
- Build something that scales from 1,000 blocks → 1,000,000+ blocks

**Timeline:**
- Phase 1 (Ingestion): 3–4 days
- Phase 2 (Event Decoding): 2–3 days
- Phase 3 (API): 2–3 days
- Phase 4 (Polish + UI): 1–2 days
- **Total MVP: ~10 days**

---

## Learning Goals

By the end of this project, you'll understand:

### 🔗 Blockchain Concepts
- Blocks, transactions, logs, and receipts — how they relate
- ABI encoding/decoding for smart contract events
- RPC model and why direct querying is slow

### 🏭 ETL Pipeline Design
- **E** (Extract): Fetch data from RPC endpoints with retries
- **T** (Transform): Decode raw events into business objects
- **L** (Load): Write to database with idempotency guarantees

### 📊 Data Engineering
- Schema design for time-series blockchain data
- Checkpoint/cursor pattern for resumable ingestion
- Handling blockchain reorgs (rollbacks)

### ⚙️ Backend Systems
- Batch processing and rate limiting
- Exponential backoff for failing requests
- Database indexing for query performance

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│   Ethereum Mainnet (via Infura/Alchemy RPC)               │
│                                                             │
└────────────────────────────┬────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│   Python Indexer Service (web3.py)                        │
│                                                             │
│   ┌───────────────────────────────────────────────────┐   │
│   │ Block Ingestion Engine                            │   │
│   │ • Fetch blocks sequentially                       │   │
│   │ • Batch requests (reduce RPC calls)              │   │
│   │ • Retry with exponential backoff                 │   │
│   └───────────────────────────────────────────────────┘   │
│                          │                                 │
│   ┌───────────────────────────────────────────────────┐   │
│   │ Transaction & Log Parser                          │   │
│   │ • Extract receipts                                │   │
│   │ • Filter contract logs                            │   │
│   │ • Decode ERC20 Transfer events                    │   │
│   └───────────────────────────────────────────────────┘   │
│                          │                                 │
│   ┌───────────────────────────────────────────────────┐   │
│   │ Indexer State Manager                             │   │
│   │ • Track last_processed_block                      │   │
│   │ • Enable resume on failure                        │   │
│   └───────────────────────────────────────────────────┘   │
│                                                             │
└────────────────────────────┬────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│   PostgreSQL Database                                     │
│                                                             │
│   Tables:                                                 │
│   • blocks (number, hash, timestamp)                     │
│   • transactions (from, to, value, gas_used)             │
│   • logs (raw contract logs)                             │
│   • token_transfers (from, to, value, token_address)     │
│   • indexer_state (last_processed_block)                 │
│                                                             │
└────────────────────────────┬────────────────────────────────┘
                             │
                ┌────────────┴────────────┐
                ▼                         ▼
        ┌──────────────┐         ┌──────────────┐
        │ FastAPI      │         │  Next.js UI  │
        │ REST API     │         │  (Optional)  │
        └──────────────┘         └──────────────┘
                │
        GET /wallet/{address}
        GET /tx/{hash}
        GET /token/{address}/transfers
```

---

## Core Concepts Explained

### 1️⃣ ETL Pipeline (Extract → Transform → Load)

**Extract (Indexer pulls from blockchain):**
```
1. Read indexer_state.last_processed_block = 18500000
2. Request blocks 18500001, 18500002, ... from RPC
3. For each block, get transactions + receipts
```

**Transform (Decode raw data):**
```
Raw log:
{
  "topics": ["0xddf252ad..."],  // Transfer signature
  "data": "0x0000000000...1000"  // 1000 tokens
}

Decoded output:
{
  "event": "Transfer",
  "from": "0xabc123...",
  "to": "0xdef456...",
  "value": 1000,
  "token_address": "0xusdc..."
}
```

**Load (Store in DB):**
```
INSERT INTO token_transfers (tx_hash, from_address, to_address, value)
VALUES ('0x...', '0xabc...', '0xdef...', 1000)
ON CONFLICT (tx_hash) DO NOTHING;  -- Idempotent
```

### 2️⃣ Checkpointing (Resume on Failure)

Problem: Indexing 100k blocks takes hours. If the process crashes, you lose all progress.

Solution: Save checkpoint after each batch.
```
Process batch 1 → Save last_processed_block = 18500100
Process batch 2 → Save last_processed_block = 18500200
Crash happens
Restart → Read checkpoint → Start from 18500201
```

### 3️⃣ Rate Limiting & Backoff

RPC endpoints have limits:
- Infura free: 300 requests/minute
- Alchemy free: similar limits

Solution:
```python
# Exponential backoff: wait 1s, 2s, 4s, 8s...
for attempt in range(5):
    try:
        result = web3.eth.get_block(block_number)
        return result
    except requests.exceptions.Timeout:
        wait_time = 2 ** attempt
        time.sleep(wait_time)
```

### 4️⃣ Idempotency (Safe to Retry)

When you insert data, use unique constraints:
```sql
INSERT INTO token_transfers (tx_hash, from_address, to_address, value)
VALUES ('0xabc', '0x111', '0x222', 1000)
ON CONFLICT (tx_hash) DO NOTHING;  -- Duplicate? Skip it.
```

This allows safe retries without duplicates.

### 5️⃣ Blockchain Reorgs (Advanced, skip for MVP)

Blockchain can "rewrite" recent blocks if miners fork.

Example:
```
Chain A: Block 19000000 → 19000001 → 19000002
Chain B: Block 19000000 → 19000001' (different block)  ← Network chooses this

Data indexed from Chain A is now invalid.
Solution: Don't index blocks < current_block - 12
          (12 blocks = ~3 minutes of finality on Ethereum)
```

---

## Setup Guide (MacBook + Docker)

### Prerequisites
- Python 3.10+
- Docker & Docker Compose
- PostgreSQL client (`brew install postgresql`)
- Node.js 18+ (for Next.js UI later)

### Step 1: Create Project Structure

```bash
cd ~/Documents/projects/web3

# Create indexer project
mkdir mini-etherscan
cd mini-etherscan

# Create subdirectories
mkdir -p indexer backend ui tests

# Create Python virtual environment
python3 -m venv venv
source venv/bin/activate
```

### Step 2: Install Dependencies

```bash
# Core indexing + API
pip install web3[pynacl]==6.11.0
pip install fastapi uvicorn
pip install psycopg2-binary python-dotenv
pip install pytest pytest-asyncio

# Optional (advanced features)
pip install redis  # Caching later
pip install sqlalchemy  # ORM (optional)
```

### Step 3: Set Up PostgreSQL with Docker

Create `docker-compose.yml`:

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_USER: indexer_user
      POSTGRES_PASSWORD: indexer_pass
      POSTGRES_DB: ethereum_indexer
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U indexer_user"]
      interval: 10s
      timeout: 5s
      retries: 5

volumes:
  postgres_data:
```

Start PostgreSQL:
```bash
docker-compose up -d
```

Verify connection:
```bash
psql -h localhost -U indexer_user -d ethereum_indexer -c "SELECT 1;"
```

### Step 4: Create Environment File

Create `.env`:
```
# RPC
ETHEREUM_RPC_URL=https://sepolia.infura.io/v3/YOUR_INFURA_KEY
# Or use free testnet: https://eth-sepolia.g.alchemy.com/v2/YOUR_ALCHEMY_KEY

# Database
DB_HOST=localhost
DB_PORT=5432
DB_USER=indexer_user
DB_PASSWORD=indexer_pass
DB_NAME=ethereum_indexer

# Indexing
START_BLOCK=4500000  # Start from block 4.5M on Sepolia
BATCH_SIZE=100  # Fetch 100 blocks at a time
```

**Get a free RPC key:**
- Infura: https://infura.io (free tier)
- Alchemy: https://alchemy.com (free tier)
- Sepolia testnet is faster to index than mainnet

---

## Phase-by-Phase Implementation

### Phase 1: Block Ingestion Engine (Days 1–4)

**Goal:** Fetch blocks sequentially, store in DB, save checkpoint.

#### 1.1: Database Schema

Create `indexer/schema.sql`:

```sql
-- Blocks
CREATE TABLE blocks (
    number BIGINT PRIMARY KEY,
    hash VARCHAR(66) NOT NULL UNIQUE,
    parent_hash VARCHAR(66),
    timestamp BIGINT NOT NULL,
    miner VARCHAR(42),
    gas_used BIGINT,
    gas_limit BIGINT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_timestamp (timestamp)
);

-- Transactions
CREATE TABLE transactions (
    hash VARCHAR(66) PRIMARY KEY,
    block_number BIGINT NOT NULL REFERENCES blocks(number),
    from_address VARCHAR(42) NOT NULL,
    to_address VARCHAR(42),
    value NUMERIC(40, 0),
    gas_price NUMERIC(40, 0),
    gas_used BIGINT,
    input_data TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_from (from_address),
    INDEX idx_to (to_address),
    INDEX idx_block (block_number)
);

-- Raw Logs (contract events)
CREATE TABLE logs (
    id SERIAL PRIMARY KEY,
    tx_hash VARCHAR(66) NOT NULL REFERENCES transactions(hash),
    block_number BIGINT NOT NULL,
    contract_address VARCHAR(42) NOT NULL,
    topic0 VARCHAR(66),  -- First topic (event signature)
    topic1 VARCHAR(66),
    topic2 VARCHAR(66),
    topic3 VARCHAR(66),
    data TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_contract (contract_address),
    INDEX idx_topic0 (topic0)
);

-- Indexer State (checkpointing)
CREATE TABLE indexer_state (
    id INT PRIMARY KEY DEFAULT 1,
    last_processed_block BIGINT NOT NULL DEFAULT 0,
    last_update TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CHECK (id = 1)  -- Only one row
);

INSERT INTO indexer_state (id, last_processed_block) VALUES (1, 0)
ON CONFLICT DO NOTHING;
```

Apply schema:
```bash
psql -h localhost -U indexer_user -d ethereum_indexer -f indexer/schema.sql
```

#### 1.2: Indexer Service

Create `indexer/main.py`:

```python
import asyncio
import os
import logging
from web3 import Web3
import psycopg2
from psycopg2.extras import execute_batch
import time
from dotenv import load_dotenv

load_dotenv()

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Configuration
RPC_URL = os.getenv('ETHEREUM_RPC_URL')
DB_HOST = os.getenv('DB_HOST')
DB_USER = os.getenv('DB_USER')
DB_PASSWORD = os.getenv('DB_PASSWORD')
DB_NAME = os.getenv('DB_NAME')
START_BLOCK = int(os.getenv('START_BLOCK', 0))
BATCH_SIZE = int(os.getenv('BATCH_SIZE', 100))

class BlockIndexer:
    def __init__(self):
        self.w3 = Web3(Web3.HTTPProvider(RPC_URL))
        self.conn = psycopg2.connect(
            host=DB_HOST,
            user=DB_USER,
            password=DB_PASSWORD,
            database=DB_NAME
        )
        assert self.w3.is_connected(), "Failed to connect to Ethereum RPC"
        logger.info(f"✅ Connected to RPC: {RPC_URL}")

    def get_checkpoint(self):
        """Read last processed block from database"""
        cursor = self.conn.cursor()
        cursor.execute("SELECT last_processed_block FROM indexer_state WHERE id = 1")
        result = cursor.fetchone()
        cursor.close()
        return result[0] if result else 0

    def save_checkpoint(self, block_number):
        """Update checkpoint after successful batch"""
        cursor = self.conn.cursor()
        cursor.execute(
            "UPDATE indexer_state SET last_processed_block = %s WHERE id = 1",
            (block_number,)
        )
        self.conn.commit()
        cursor.close()
        logger.info(f"📍 Checkpoint saved: block {block_number}")

    def fetch_block_with_retry(self, block_number, max_retries=5):
        """Fetch block with exponential backoff"""
        for attempt in range(max_retries):
            try:
                block = self.w3.eth.get_block(block_number)
                return block
            except Exception as e:
                if attempt < max_retries - 1:
                    wait_time = 2 ** attempt  # 1s, 2s, 4s, 8s...
                    logger.warning(
                        f"⚠️ RPC error for block {block_number}, "
                        f"retry {attempt + 1}/{max_retries} after {wait_time}s: {e}"
                    )
                    time.sleep(wait_time)
                else:
                    logger.error(f"❌ Failed to fetch block {block_number} after {max_retries} retries")
                    raise

    def store_blocks(self, blocks_data):
        """Insert blocks and transactions into database"""
        cursor = self.conn.cursor()

        # Insert blocks
        block_rows = [
            (
                block['number'],
                block['hash'].hex(),
                block['parentHash'].hex(),
                block['timestamp'],
                block.get('miner', ''),
                block.get('gasUsed', 0),
                block.get('gasLimit', 0)
            )
            for block in blocks_data
        ]

        execute_batch(
            cursor,
            """
            INSERT INTO blocks (number, hash, parent_hash, timestamp, miner, gas_used, gas_limit)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
            ON CONFLICT (number) DO NOTHING
            """,
            block_rows
        )

        # Insert transactions
        tx_rows = []
        for block in blocks_data:
            for tx in block['transactions']:
                tx_rows.append((
                    tx['hash'].hex(),
                    block['number'],
                    tx['from'],
                    tx.get('to', ''),
                    int(tx.get('value', 0)),
                    int(tx.get('gasPrice', 0)),
                    tx.get('gas', 0),
                    tx.get('input', '')
                ))

        execute_batch(
            cursor,
            """
            INSERT INTO transactions (hash, block_number, from_address, to_address, value, gas_price, gas_used, input_data)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            ON CONFLICT (hash) DO NOTHING
            """,
            tx_rows
        )

        self.conn.commit()
        cursor.close()
        logger.info(f"💾 Stored {len(blocks_data)} blocks with transactions")

    def index_batch(self, start_block, end_block):
        """Fetch and store a batch of blocks"""
        blocks = []
        for block_num in range(start_block, end_block + 1):
            block = self.fetch_block_with_retry(block_num)
            blocks.append(block)

        self.store_blocks(blocks)
        return end_block

    async def run(self):
        """Main indexing loop"""
        checkpoint = self.get_checkpoint()
        current_block = max(checkpoint + 1, START_BLOCK)
        latest_block = self.w3.eth.block_number

        logger.info(f"🚀 Starting indexing from block {current_block}")
        logger.info(f"📊 Latest block on chain: {latest_block}")

        try:
            while current_block <= latest_block:
                batch_end = min(current_block + BATCH_SIZE - 1, latest_block)
                logger.info(f"📦 Processing blocks {current_block} → {batch_end}")

                last_processed = self.index_batch(current_block, batch_end)
                self.save_checkpoint(last_processed)

                current_block = batch_end + 1
                await asyncio.sleep(0.1)  # Small delay to respect RPC rate limits

            logger.info("✅ Indexing complete!")

        except Exception as e:
            logger.error(f"❌ Indexing failed: {e}")
            raise
        finally:
            self.conn.close()

async def main():
    indexer = BlockIndexer()
    await indexer.run()

if __name__ == "__main__":
    asyncio.run(main())
```

**Run Phase 1:**
```bash
cd indexer
python main.py
```

Expected output:
```
✅ Connected to RPC: https://eth-sepolia...
🚀 Starting indexing from block 4500000
📊 Latest block on chain: 4500099
📦 Processing blocks 4500000 → 4500099
💾 Stored 100 blocks with transactions
📍 Checkpoint saved: block 4500099
✅ Indexing complete!
```

---

### Phase 2: Event Decoding (Days 5–7)

**Goal:** Decode ERC20 Transfer events into structured data.

#### 2.1: Add Token Transfers Table

```sql
-- Add to schema.sql
CREATE TABLE token_transfers (
    id SERIAL PRIMARY KEY,
    tx_hash VARCHAR(66) NOT NULL REFERENCES transactions(hash),
    block_number BIGINT NOT NULL,
    token_address VARCHAR(42) NOT NULL,
    from_address VARCHAR(42) NOT NULL,
    to_address VARCHAR(42) NOT NULL,
    value NUMERIC(40, 0) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(tx_hash, from_address, to_address, value),  -- Idempotency
    INDEX idx_token (token_address),
    INDEX idx_from (from_address),
    INDEX idx_to (to_address)
);
```

#### 2.2: Event Decoder

Create `indexer/decoder.py`:

```python
from web3 import Web3

# ERC20 Transfer event signature
# event Transfer(address indexed from, address indexed to, uint256 value)
TRANSFER_TOPIC = Web3.keccak(text="Transfer(address,address,uint256)").hex()

def decode_erc20_transfer(log):
    """Decode ERC20 Transfer event log"""
    if log['topics'][0].hex() != TRANSFER_TOPIC:
        return None

    # Topics:
    # [0] = event signature
    # [1] = from address (indexed)
    # [2] = to address (indexed)
    from_address = Web3.to_checksum_address('0x' + log['topics'][1].hex()[-40:])
    to_address = Web3.to_checksum_address('0x' + log['topics'][2].hex()[-40:])

    # Data field contains the amount (uint256)
    value = int(log['data'].hex(), 16)

    return {
        'from': from_address,
        'to': to_address,
        'value': value,
        'token': Web3.to_checksum_address(log['address'])
    }

def process_logs(logs_from_block):
    """Extract ERC20 transfers from raw logs"""
    transfers = []
    for log in logs_from_block:
        transfer = decode_erc20_transfer(log)
        if transfer:
            transfers.append(transfer)
    return transfers
```

#### 2.3: Store Transfers

Add to `main.py`:

```python
def store_token_transfers(self, transfers):
    """Store decoded ERC20 transfers"""
    cursor = self.conn.cursor()

    tx_rows = [
        (
            transfer['tx_hash'],
            transfer['block_number'],
            transfer['token'],
            transfer['from'],
            transfer['to'],
            transfer['value']
        )
        for transfer in transfers
    ]

    execute_batch(
        cursor,
        """
        INSERT INTO token_transfers (tx_hash, block_number, token_address, from_address, to_address, value)
        VALUES (%s, %s, %s, %s, %s, %s)
        ON CONFLICT (tx_hash, from_address, to_address, value) DO NOTHING
        """,
        tx_rows
    )

    self.conn.commit()
    cursor.close()
    logger.info(f"🔄 Stored {len(transfers)} token transfers")
```

---

### Phase 3: REST API (Days 8–10)

**Goal:** Expose blockchain data via FastAPI.

Create `backend/api.py`:

```python
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import psycopg2
from psycopg2.extras import RealDictCursor
import os
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(title="Mini Etherscan API", version="1.0.0")

# CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def get_db():
    conn = psycopg2.connect(
        host=os.getenv('DB_HOST'),
        user=os.getenv('DB_USER'),
        password=os.getenv('DB_PASSWORD'),
        database=os.getenv('DB_NAME'),
        cursor_factory=RealDictCursor
    )
    return conn

@app.get("/health")
def health_check():
    return {"status": "ok"}

@app.get("/block/{block_number}")
def get_block(block_number: int):
    """Get block by number with transaction count"""
    conn = get_db()
    cursor = conn.cursor()

    cursor.execute(
        "SELECT * FROM blocks WHERE number = %s",
        (block_number,)
    )
    block = cursor.fetchone()

    if not block:
        raise HTTPException(status_code=404, detail="Block not found")

    cursor.execute(
        "SELECT COUNT(*) as tx_count FROM transactions WHERE block_number = %s",
        (block_number,)
    )
    tx_count = cursor.fetchone()['tx_count']

    conn.close()
    return {**dict(block), "transaction_count": tx_count}

@app.get("/wallet/{address}/transactions")
def get_wallet_transactions(address: str, limit: int = 100):
    """Get all transactions for a wallet"""
    address = address.lower()
    conn = get_db()
    cursor = conn.cursor()

    cursor.execute(
        """
        SELECT * FROM transactions 
        WHERE LOWER(from_address) = %s OR LOWER(to_address) = %s
        ORDER BY block_number DESC
        LIMIT %s
        """,
        (address, address, limit)
    )
    transactions = cursor.fetchall()
    conn.close()
    return [dict(tx) for tx in transactions]

@app.get("/wallet/{address}/tokens")
def get_wallet_tokens(address: str):
    """Get token balances for a wallet"""
    address = address.lower()
    conn = get_db()
    cursor = conn.cursor()

    cursor.execute(
        """
        SELECT token_address, 
               SUM(CASE WHEN LOWER(to_address) = %s THEN value ELSE 0 END) -
               SUM(CASE WHEN LOWER(from_address) = %s THEN value ELSE 0 END) as balance
        FROM token_transfers
        GROUP BY token_address
        HAVING SUM(CASE WHEN LOWER(to_address) = %s THEN value ELSE 0 END) -
               SUM(CASE WHEN LOWER(from_address) = %s THEN value ELSE 0 END) > 0
        """,
        (address, address, address, address)
    )
    balances = cursor.fetchall()
    conn.close()
    return [dict(b) for b in balances]

@app.get("/token/{token_address}/transfers")
def get_token_transfers(token_address: str, limit: int = 100):
    """Get transfers for a token"""
    token_address = token_address.lower()
    conn = get_db()
    cursor = conn.cursor()

    cursor.execute(
        """
        SELECT * FROM token_transfers 
        WHERE LOWER(token_address) = %s
        ORDER BY block_number DESC
        LIMIT %s
        """,
        (token_address, limit)
    )
    transfers = cursor.fetchall()
    conn.close()
    return [dict(t) for t in transfers]

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
```

**Run API:**
```bash
cd backend
python api.py
```

Test endpoints:
```bash
curl http://localhost:8000/health
curl http://localhost:8000/block/4500000
curl http://localhost:8000/wallet/0x1234.../transactions
```

---

### Phase 4: Optional Next.js UI (Days 11–12)

Create simple explorer pages:

```bash
cd ui
npx create-next-app@latest . --typescript --tailwind
```

Build:
- Home: Search bar for blocks/txs/addresses
- Block page: Show transactions
- Address page: Show balance + transfers
- API calls to FastAPI backend

---

## Testing & Validation

### Test 1: Data Integrity

```bash
psql -h localhost -U indexer_user -d ethereum_indexer -c "
  SELECT 
    (SELECT COUNT(*) FROM blocks) as block_count,
    (SELECT COUNT(*) FROM transactions) as tx_count,
    (SELECT COUNT(*) FROM token_transfers) as transfer_count;
"
```

Expected for 1000 blocks: ~15k transactions, ~500 transfers

### Test 2: API Responses

```bash
# Get a real block from your indexed data
psql -h localhost -U indexer_user -d ethereum_indexer -c "
  SELECT number FROM blocks LIMIT 1;
"

# Then query API
curl http://localhost:8000/block/4500050
```

### Test 3: Performance Baseline

Run indexing with timing:
```python
import time
start = time.time()
# Index 1000 blocks
elapsed = time.time() - start
print(f"Indexed 1000 blocks in {elapsed:.2f}s")
print(f"Rate: {1000 / elapsed:.0f} blocks/sec")
```

Expected: 50–200 blocks/sec depending on RPC and hardware.

---

## Scaling Strategy

### From 1K blocks → 100K blocks

1. **Increase BATCH_SIZE** to 500
2. **Add database indexes:**
   ```sql
   CREATE INDEX idx_blocks_timestamp ON blocks(timestamp);
   CREATE INDEX idx_tx_block_number ON transactions(block_number);
   ```
3. **Monitor RPC rate limits** — may need to add delays

### From 100K blocks → 1M blocks

1. **Run indexer 24/7** (deploy to cloud VM)
2. **Add Redis caching** for popular queries
3. **Implement async batch fetching** (concurrent RPC calls)
4. **Consider partitioning** large tables by date

### Future: Multi-chain

```python
# Index both Ethereum Sepolia + Polygon Mumbai
INDEXER_CONFIG = {
    'sepolia': {'RPC': '...', 'START': 4500000},
    'polygon': {'RPC': '...', 'START': 40000000},
}

# Run parallel indexers per chain
```

---

## Commands Quick Reference

```bash
# Start database
docker-compose up -d

# Run indexer
cd indexer && python main.py

# Start API
cd backend && python api.py

# Check database
psql -h localhost -U indexer_user -d ethereum_indexer

# View logs
tail -f indexer/indexing.log

# Reset (if needed)
docker-compose down -v  # WARNING: Deletes all data
```

---

## Troubleshooting

### "Connection refused" to RPC
- Check `.env` has valid RPC URL
- Test: `curl -X POST https://eth-sepolia.g.alchemy.com/v2/YOUR_KEY`

### Database connection fails
- Verify Docker container is running: `docker ps`
- Check credentials in `.env` match `docker-compose.yml`

### Slow indexing
- Increase `BATCH_SIZE` to 200+
- Check RPC rate limits (add delays)
- Verify database indexes exist

### Duplicate entries in DB
- This shouldn't happen (using `ON CONFLICT DO NOTHING`)
- If it does, restart with fresh database

---

## Learning Resources

- **Web3.py docs**: https://web3py.readthedocs.io
- **PostgreSQL indexing**: https://www.postgresql.org/docs/current/indexes.html
- **FastAPI**: https://fastapi.tiangolo.com
- **Ethereum logs**: https://ethereum.org/en/developers/docs/apis/json-rpc/#eth_getlogs

---

## What's Next After MVP?

1. **Add token metadata** (name, symbol, decimals)
2. **Implement GraphQL** API (like The Graph)
3. **Deploy to AWS/GCP** with auto-scaling workers
4. **Build analytics dashboard** (top tokens, volume, etc.)
5. **Add real-time WebSocket** updates for new blocks

---

**Good luck! This is a portfolio-level project. 🚀**
