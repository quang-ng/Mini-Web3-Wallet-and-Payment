# Phase 2: Backend Core ✅

**Date Completed:** May 26, 2026  
**Status:** Ready for Phase 3 (Database & Events)

---

## What You Built

### Express Backend with TypeScript
- REST API server running on port 3000
- ethers.js blockchain integration
- TypeScript for type safety and better developer experience
- Environment-based configuration (config.ts)

### API Endpoints

**Wallet Operations:**
- `GET /api/wallet/info` - Get signer address, balance, and network info
- `GET /api/wallet/balance/:address` - Get balance for any Ethereum address

**Transactions:**
- `POST /api/transaction/deposit` - Deposit ETH to PaymentVault contract
- `POST /api/transaction/withdraw` - Withdraw ETH from PaymentVault contract

### Backend Services

**WalletService** (`src/services/walletService.ts`)
- `getBalance(address)` - Reads user balance from contract
- `getSignerAddress()` - Gets the default signer account
- `getNetworkInfo()` - Returns blockchain network details

**TransactionService** (`src/services/transactionService.ts`)
- `deposit(amount)` - Sends ETH to contract (converts ETH → Wei)
- `withdraw(amount)` - Withdraws ETH from contract

**Blockchain Setup** (`src/blockchain/`)
- `provider.ts` - Connects to Anvil via RPC, creates signer wallet
- `contract.ts` - Creates contract instance for function calls
- `abi.ts` - PaymentVault contract interface

### Configuration
- `src/config.ts` - Centralized environment variable management
- `.env` - Private key, RPC URL, contract address

---

## Key Concepts Learned

1. **Backend as a Wrapper**
   - Backend = API layer between frontend and blockchain
   - Frontend calls REST endpoints
   - Backend handles ethers.js interaction with contracts

2. **ethers.js Library**
   - JsonRpcProvider for connecting to blockchain
   - Wallet for signing transactions
   - Contract instance for calling smart contract functions
   - parseEther/formatEther for Wei ↔ ETH conversion

3. **Transaction Flow**
   - User calls API endpoint
   - Backend calls contract function
   - Transaction signed by signer account
   - Waits for blockchain confirmation
   - Returns transaction hash and status

4. **Architecture**
   - Services handle business logic
   - Routes handle HTTP requests/responses
   - Blockchain module isolates Web3 interactions
   - Config centralizes environment variables

---

## Files Created

```
backend/
├── src/
│   ├── index.ts                          # Express server entry point
│   ├── config.ts                         # Environment config & validation
│   ├── blockchain/
│   │   ├── provider.ts                   # RPC provider & signer
│   │   ├── contract.ts                   # Contract instance
│   │   └── abi.ts                        # PaymentVault ABI
│   ├── services/
│   │   ├── walletService.ts              # Balance & wallet logic
│   │   └── transactionService.ts         # Deposit/withdraw logic
│   └── routes/
│       ├── wallet.ts                     # Wallet endpoints
│       └── transaction.ts                # Transaction endpoints
├── package.json                          # Dependencies
├── tsconfig.json                         # TypeScript config
├── .env                                  # Environment variables
└── node_modules/                         # Installed packages

PHASE2_COMPLETE.md                       # This file
```

---

## Testing Your Work

**Start the backend:**
```bash
cd backend
npm run dev
```

**Test wallet endpoints:**
```bash
curl http://localhost:3000/api/wallet/info
curl http://localhost:3000/api/wallet/balance/0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
```

**Test deposit:**
```bash
curl -X POST http://localhost:3000/api/transaction/deposit \
  -H "Content-Type: application/json" \
  -d '{"amount": "1"}'
```

**Check balance changed:**
```bash
curl http://localhost:3000/api/wallet/info
```

**Test withdraw:**
```bash
curl -X POST http://localhost:3000/api/transaction/withdraw \
  -H "Content-Type: application/json" \
  -d '{"amount": "0.5"}'
```

---

## Architecture Overview

```
Frontend (Future - React)
    ↓ HTTP REST
Backend (Express + ethers.js)
    ├── /api/wallet/info
    ├── /api/wallet/balance/:address
    ├── /api/transaction/deposit
    └── /api/transaction/withdraw
    ↓ JSON-RPC
Ethereum (Anvil Local Node)
    ↓
PaymentVault Smart Contract
    ↓
User Balances (contract state)
```

---

## Skills Gained

✅ Express.js & REST API design  
✅ TypeScript for backend  
✅ ethers.js blockchain library  
✅ Smart contract interaction from backend  
✅ Transaction signing & sending  
✅ Wei/ETH conversion  
✅ Environment configuration management  
✅ Service-oriented architecture  

---

## What's Next: Phase 3

Phase 3 will add:
- **PostgreSQL Database** - Store wallet and transaction data
- **Event Listener** - Watch for contract events (Deposit/Withdraw)
- **Indexer Worker** - Sync blockchain events to database
- **Transaction History API** - Query past transactions from database

This transforms your backend from a simple wrapper to a **production-grade system** that tracks state over time!

---

## Resources Used

- [ethers.js Documentation](https://docs.ethers.org/)
- [Express.js Guide](https://expressjs.com/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Anvil Documentation](https://book.getfoundry.sh/anvil/)

---

**You're now ~50% ready for a Web3 backend job!**

Next phase: Database + event indexing → 70% ready  
Full stack: + Frontend development → 90% ready

**Great work!** 🚀
