# 🏦 Mini Web3 Wallet & Payment System

> A practical backend-focused Web3 project to learn how Ethereum wallets and payments work by building a complete crypto payment infrastructure.

## 📌 Quick Start (5 minutes)

```bash
# 1. Start local Ethereum node
anvil

# 2. Deploy contracts
cd contracts && forge build && forge script scripts/Deploy.s.sol:Deploy --rpc-url http://127.0.0.1:8545 --broadcast

# 3. Start backend
cd backend && npm install && npm run dev

# 4. Backend runs on http://localhost:3000
```

---

## 📋 Project Overview

This project demonstrates how a complete Web3 payment system works by building:

- **Smart Contracts**: A secure payment vault that handles ETH and tokens
- **Backend Services**: APIs for wallet management, transactions, and balance tracking
- **Database Layer**: PostgreSQL for transaction history and wallet data
- **Event Indexing**: Real-time blockchain event synchronization

**Perfect for**: Backend engineers wanting to understand Ethereum, developers building payment systems, or anyone learning Web3 infrastructure.

---

## 🗺️ Development Roadmap

### Phase 1: Foundations ✅
- [x] Set up local development environment (Anvil, Foundry)
- [x] Write basic smart contract with ETH deposit/withdrawal
- [x] Test contract with Foundry
- [x] Create PostgreSQL database schema

### Phase 2: Backend Core ✅
- [x] Build wallet service (generate, store addresses)
- [x] Implement blockchain service (read balances, send transactions)
- [x] Create REST APIs for wallet operations
- [x] Set up transaction signing with private keys

### Phase 3: Indexing & Events ✅
- [x] Build event listener for contract events
- [x] Create database indexer worker
- [x] Sync blockchain state with PostgreSQL
- [x] Add transaction history API

### Phase 4: Enhancement & Robustness ✅
- [x] Add initial blockchain sync (catch missed events on startup)
- [x] Implement error handling and retry logic (exponential backoff)
- [x] Add request validation and security (address & amount validation)
- [x] Add sync history tracking and metadata persistence

### Phase 5: ERC20 Token Support ⏳
- [x] Add ERC20 token contract (mint, transfer, approve) — SimpleToken.sol created
- [x] Extend payment vault to handle ERC20 deposits/withdrawals — depositToken, withdrawToken, getTokenBalance added
- [x] Test contracts locally on Anvil
- [ ] Index ERC20 Transfer events — In progress (eventListener listening to Transfer events)
- [ ] Update database schema to store token_address in transactions
- [ ] Add token balance API endpoints
- [ ] Support multiple token types

### Phase 6: Multi-User Support & Simple Frontend
- [ ] User registration and authentication (JWT)
- [ ] User-wallet mapping in database
- [ ] Authorization — users access only their own data
- [ ] Scoped transaction history per user
- [ ] Rate limiting per user
- [ ] Frontend: Simple React UI (register/login)
- [ ] Frontend: Dashboard (balance, transaction form)
- [ ] Frontend: Transaction history view

### Phase 7: Testnet Deployment
- [ ] Deploy contracts to Sepolia testnet
- [ ] Configure backend for testnet RPC
- [ ] Set up environment configs for staging vs production
- [ ] End-to-end testing on Sepolia
- [ ] Document deployment process

### Phase 8: Cloud Infrastructure
- [ ] Set up AWS EC2 instance with Node.js
- [ ] Configure RDS PostgreSQL database
- [ ] Set up HTTPS/SSL certificate
- [ ] Environment config for production

### Phase 9: Production Deployment
- [ ] Deploy backend to production EC2 (using Sepolia testnet)
- [ ] Configure production database (RDS)
- [ ] Test with real users

### Phase 10: Advanced (Future)
- [ ] Multi-signature wallet support
- [ ] Redis caching for performance
- [ ] Kafka event streaming
- [ ] Multi-chain support
- [ ] Account abstraction (EIP-4337)

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────┐
│                   Frontend (React)                       │
│              MetaMask Integration                        │
└──────────────────────┬──────────────────────────────────┘
                       │ HTTP/REST
┌──────────────────────▼──────────────────────────────────┐
│                  Express Backend                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │  Wallet API  │  │ Balance API  │  │ History API  │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
└──────────────────────┬──────────────────────────────────┘
                       │ ethers.js
┌──────────────────────▼──────────────────────────────────┐
│              Blockchain Services                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │   Wallet     │  │ Transaction  │  │   Event      │  │
│  │   Service    │  │   Service    │  │  Listener    │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
└──────────────────────┬──────────────────────────────────┘
                       │ JSON-RPC
┌──────────────────────▼──────────────────────────────────┐
│         Ethereum (Anvil / Sepolia Testnet)              │
│                Smart Contract                           │
└──────────────────────────────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────┐
│              PostgreSQL Database                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │  Wallets     │  │ Transactions │  │  Token Data  │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
└──────────────────────────────────────────────────────────┘
```

---

## 📦 Tech Stack

| Layer | Technology |
|-------|-----------|
| **Blockchain** | Ethereum, Sepolia Testnet, Anvil, Foundry |
| **Backend** | Node.js, TypeScript, Express, ethers.js |
| **Database** | PostgreSQL |
| **Frontend** | React, wagmi, viem (optional) |

---

## 📁 Project Structure

```
mini-web3-wallet/
├── contracts/                 # Smart contracts (Solidity)
│   ├── src/                  # Contract source code
│   ├── script/               # Deployment scripts
│   ├── test/                 # Contract tests
│   └── foundry.toml
│
├── backend/                  # Backend service (Node.js/Express)
│   ├── src/
│   │   ├── api/              # REST endpoints
│   │   ├── blockchain/       # Ethereum interaction
│   │   ├── services/         # Business logic
│   │   ├── workers/          # Event indexing
│   │   ├── db/               # Database queries
│   │   ├── config/           # Configuration
│   │   └── index.ts
│   ├── package.json
│   ├── tsconfig.json
│   └── .env
│
└── frontend/                 # Frontend (React + web3)
```

---

## 🎯 Core Concepts

This project teaches you:

- **Wallets**: How to generate, store, and use Ethereum addresses
- **Keys**: Public/private key cryptography and key management
- **Transactions**: Creating, signing, and broadcasting transactions
- **Gas**: Understanding gas costs and nonce management
- **Smart Contracts**: Writing and interacting with Solidity contracts
- **ERC20**: Token standards and token transfers
- **Event Indexing**: Listening to and syncing blockchain events
- **State Management**: Tracking balances and transaction history
- **Backend Integration**: Building Web3-enabled APIs

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- Foundry/Forge ([Install](https://book.getfoundry.sh/getting-started/installation))
- PostgreSQL 13+
- Git

### Installation

```bash
# 1. Clone the repository
git clone <repo-url>
cd mini-web3-wallet

# 2. Set up contracts
cd contracts
forge install
forge build

# 3. Set up backend
cd ../backend
npm install

# 4. Create PostgreSQL database
createdb web3_wallet

# 5. Configure environment
cp .env.example .env
# Edit .env with your settings
```

### Running Locally

**Terminal 1: Start Ethereum Node**
```bash
anvil
```

**Terminal 2: Deploy Contract**
```bash
cd contracts
forge script scripts/Deploy.s.sol:Deploy --rpc-url http://127.0.0.1:8545 --broadcast
```

**Terminal 3: Start Backend**
```bash
cd backend
npm run dev
```

The API will be available at `http://localhost:3000`

---

## 🔌 API Endpoints

### Wallet Management
- `POST /api/wallets` — Create a new wallet
- `GET /api/wallets` — List all wallets

### Balances
- `GET /api/balances/:address` — Get ETH balance for an address
- `GET /api/balances/:address/tokens` — Get ERC20 token balances

### Transactions
- `POST /api/transactions/deposit` — Deposit ETH to contract
- `POST /api/transactions/withdraw` — Withdraw ETH from contract
- `GET /api/transactions` — Get transaction history
- `GET /api/transactions/:txHash` — Get specific transaction

---

## 💾 Database Schema

**wallets**
```sql
CREATE TABLE wallets (
  id SERIAL PRIMARY KEY,
  address TEXT NOT NULL UNIQUE,
  public_key TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

**transactions**
```sql
CREATE TABLE transactions (
  id SERIAL PRIMARY KEY,
  tx_hash TEXT NOT NULL UNIQUE,
  from_address TEXT,
  to_address TEXT,
  amount NUMERIC,
  token_address TEXT,
  status TEXT,
  block_number INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

## 🔐 Environment Variables

```env
# Server
PORT=3000
NODE_ENV=development

# Blockchain
RPC_URL=http://127.0.0.1:8545
CONTRACT_ADDRESS=0x...
PRIVATE_KEY=0x...

# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/web3_wallet

# Logging
LOG_LEVEL=debug
```

---

## 📚 Learning Goals

After completing this project, you'll understand:

✅ How Ethereum transactions are created and signed  
✅ How wallets manage keys and addresses  
✅ How smart contracts store and manage state  
✅ How ERC20 token standards work  
✅ How to interact with blockchain from backend  
✅ How event indexing and blockchain synchronization works  
✅ How to build secure payment systems on Web3  

---

## 📖 Recommended Resources

### Reading
- [Mastering Ethereum](https://github.com/ethereumbook/ethereumbook) — Deep dive into Ethereum
- [Ethereum Documentation](https://ethereum.org/developers) — Official Ethereum dev guide
- [Foundry Book](https://book.getfoundry.sh) — Smart contract testing framework
- [ethers.js Documentation](https://docs.ethers.org) — JavaScript Ethereum library

### Tools
- [Remix IDE](https://remix.ethereum.org) — Browser-based contract editor
- [Sepolia Faucet](https://www.sepoliaether.com) — Get testnet ETH
- [Etherscan Sepolia](https://sepolia.etherscan.io) — Block explorer

---

## 🐛 Common Issues

**"Cannot connect to RPC"**
```bash
# Make sure Anvil is running
anvil
```

**"Contract not deployed"**
```bash
# Deploy the contract
cd contracts && forge script scripts/Deploy.s.sol:Deploy --rpc-url http://127.0.0.1:8545 --broadcast
```

**"Database connection error"**
```bash
# Ensure PostgreSQL is running and database exists
createdb web3_wallet
```

---

## 📝 License

MIT

---

## 🤝 Contributing

Contributions are welcome! Feel free to open issues or submit PRs.

---

**Happy Building! 🚀**