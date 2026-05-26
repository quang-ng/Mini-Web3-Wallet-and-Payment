# Phase 3: Database & Event Indexing ✅

**Date Completed:** May 26, 2026  
**Status:** Ready for Phase 4 (Enhancement)

---

## What You Built

### PostgreSQL Database
- Created `web3_wallet` database
- `wallets` table - stores wallet addresses and metadata
- `transactions` table - stores all deposits/withdrawals with:
  - `tx_hash` - transaction identifier
  - `from_address` - user's wallet address
  - `amount` - deposit/withdraw amount (in Wei)
  - `type` - 'deposit' or 'withdraw'
  - `status` - transaction status
  - `block_number` - Ethereum block number
  - `created_at` - timestamp

### Event Listener System
Real-time blockchain event capture:
- Listens for `Deposit` events from PaymentVault contract
- Listens for `Withdraw` events from PaymentVault contract
- Automatically extracts block number, user, amount
- Saves events to PostgreSQL instantly
- Runs continuously in background while server is active

### Database Service (`src/db/transactionDb.ts`)
Transaction management layer:
- `insertTransaction()` - save transaction to database
- `getTransactionsByAddress()` - query user's transaction history
- `getAllTransactions()` - get all transactions ever recorded
- Uses connection pooling for efficiency

### API Endpoints (New in Phase 3)

**Transaction History:**
- `GET /api/transaction/history/:address` - Get all transactions for a user
  ```bash
  curl http://localhost:3000/api/transaction/history/0xf39Fd6e...
  ```
  Response:
  ```json
  {
    "address": "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
    "count": 5,
    "transactions": [
      {
        "id": 1,
        "tx_hash": "pending-1779774580719",
        "from_address": "0xf39Fd6e...",
        "amount": "5000000000000000000",
        "type": "deposit",
        "status": "confirmed",
        "block_number": 13,
        "created_at": "2026-05-26T..."
      }
    ]
  }
  ```

- `GET /api/transaction/all` - Get all transactions
  ```bash
  curl http://localhost:3000/api/transaction/all
  ```

---

## Architecture

```
┌─────────────────────────────────────┐
│   Smart Contract (PaymentVault)     │
│   - Deposit events                  │
│   - Withdraw events                 │
└────────────┬────────────────────────┘
             │
             ↓
┌─────────────────────────────────────┐
│   Event Listener (24/7 running)     │
│   - Catches Deposit events          │
│   - Catches Withdraw events         │
│   - Extracts block number, user, $  │
└────────────┬────────────────────────┘
             │
             ↓
┌─────────────────────────────────────┐
│   Database Service                  │
│   - Validates data                  │
│   - Inserts into PostgreSQL         │
└────────────┬────────────────────────┘
             │
             ↓
┌─────────────────────────────────────┐
│   PostgreSQL Database               │
│   - wallets table                   │
│   - transactions table              │
└────────────┬────────────────────────┘
             │
             ↓
┌─────────────────────────────────────┐
│   REST API (Query Historical Data)  │
│   - GET /api/transaction/history    │
│   - GET /api/transaction/all        │
└─────────────────────────────────────┘
```

---

## How It Works (User Flow)

**Scenario: User deposits 5 ETH**

```
1. User calls: POST /api/transaction/deposit with amount: "5"
   
2. Backend calls contract.deposit() with value 5 ETH
   
3. Smart contract receives ETH
   
4. Smart contract emits Deposit event:
   event Deposit(user: 0xf39Fd6e..., amount: 5000000000000000000)
   
5. Event Listener catches the event instantly:
   - User address: 0xf39Fd6e...
   - Amount: 5000000000000000000 Wei (5 ETH)
   - Block number: 13
   
6. Event Listener calls transactionDb.insertTransaction()
   
7. PostgreSQL saves:
   {
     tx_hash: "pending-1779774580719",
     from_address: "0xf39Fd6e...",
     amount: "5000000000000000000",
     type: "deposit",
     status: "confirmed",
     block_number: 13
   }
   
8. User later calls: GET /api/transaction/history/0xf39Fd6e...
   
9. Backend queries PostgreSQL
   
10. Returns all past deposits/withdrawals instantly ✅
```

---

## Technologies Used

| Component | Technology |
|-----------|-----------|
| **Database** | PostgreSQL 17 |
| **Node.js Driver** | pg library |
| **Event Listening** | ethers.js contract.on() |
| **Server** | Express.js |
| **Language** | TypeScript |

---

## Files Created/Modified

```
backend/
├── src/
│   ├── db/
│   │   └── transactionDb.ts          # Database queries (30 lines)
│   ├── workers/
│   │   └── eventListener.ts          # Event listener (60+ lines)
│   ├── routes/
│   │   └── transaction.ts            # Updated with history routes
│   └── index.ts                      # Updated to start event listener
│
├── package.json                      # Added: pg @types/pg
├── .env                              # Added: DB_USER, DB_PASSWORD
└── node_modules/pg                   # PostgreSQL client

Database:
└── web3_wallet/
    ├── wallets table                 # (empty, ready for Phase 4)
    └── transactions table            # (populated by event listener)

Documentation:
└── PHASE3_COMPLETE.md                # This file
```

---

## Key Learnings

### 1. Event-Driven Architecture
- Real-time event listening
- Asynchronous event processing
- Decoupled components

### 2. Blockchain Indexing
- Events as data source of truth
- Block number tracking
- Event extraction and storage

### 3. Database Integration
- Connection pooling for efficiency
- Transaction isolation
- Query optimization with indexes

### 4. Data Flow
- From smart contract events → database
- Real-time synchronization
- Query historical data

### 5. Production Concepts
- Event listeners must run continuously
- Proper error handling in async code
- Database connection management

---

## Testing Your Work

### 1. Verify Event Listener is Running
```bash
npm run dev
# Should see: [EventListener] Event listeners active!
```

### 2. Make a Deposit
```bash
curl -X POST http://localhost:3000/api/transaction/deposit \
  -H "Content-Type: application/json" \
  -d '{"amount": "2"}'
```

### 3. Check Database (DBeaver)
- Open DBeaver
- Connect to web3_wallet
- Open transactions table
- You should see the new row with block_number filled in!

### 4. Query Transaction History
```bash
curl http://localhost:3000/api/transaction/history/0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
```

### 5. Make Multiple Transactions
```bash
# Deposit
curl -X POST http://localhost:3000/api/transaction/deposit \
  -d '{"amount": "1"}' -H "Content-Type: application/json"

# Withdraw
curl -X POST http://localhost:3000/api/transaction/withdraw \
  -d '{"amount": "0.5"}' -H "Content-Type: application/json"

# Check history
curl http://localhost:3000/api/transaction/history/0xf39Fd6e...
```

---

## Known Limitations (For Phase 4)

⚠️ **Not yet implemented:**
- ❌ Initial sync if server was down during events
- ❌ Pagination for large transaction lists
- ❌ Transaction retry logic
- ❌ Security validation
- ❌ Real transaction hashes (using timestamps)

**These will be added in Phase 4: Enhancement**

---

## Architecture Decisions

**Why PostgreSQL?**
- Fast queries for historical data
- Easy to filter and sort
- Standard in production systems
- Complement to immutable blockchain

**Why Event Listener?**
- Real-time indexing
- Efficient (only processes relevant events)
- Decoupled from API requests
- Can run 24/7 in background

**Why Separate Service?**
- Single responsibility (database operations)
- Easy to test
- Easy to modify queries
- Code reuse

---

## Next Steps: Phase 4 (Enhancement)

Phase 4 will add:

### Security & Validation
- Request validation
- User authentication
- Rate limiting

### Production Features
- Initial blockchain sync on startup
- Transaction retry logic
- Better error handling
- Pagination for large datasets

### Additional Features
- ERC20 token support
- Real transaction hashes
- Transaction status tracking
- Comprehensive API documentation

---

## Learning Checkpoint

You've now mastered:
- ✅ Smart contract development (Phase 1)
- ✅ Backend API design (Phase 2)
- ✅ **Blockchain event indexing (Phase 3)**
- ✅ Database integration
- ✅ Real-time data synchronization

**You're now ~65% ready for a Web3 backend role!**

Path to mastery:
- Phase 4: Enhancement → 80%
- Phase 5: Advanced features → 95%
- Ship to production → 100%

---

## Resources

- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [ethers.js Events](https://docs.ethers.org/v6/api/contract/contract/#events)
- [Event-Driven Architecture](https://en.wikipedia.org/wiki/Event-driven_architecture)
- [Blockchain Indexing Guide](https://thegraph.com/docs/en/)

---

**Congratulations on Phase 3!** 🎉

You've built a professional blockchain indexing system that:
- Captures events in real-time
- Stores data persistently
- Provides fast historical queries
- Runs automatically in background

**This is the foundation of production Web3 systems!** 🚀
