# Mini Web3 Wallet & Payment Backend

A backend-focused Web3 project built with Node.js, TypeScript, Express, and ethers.js.

This project is designed to help backend engineers understand how Ethereum works in practice by building a simplified crypto wallet and payment infrastructure.

---

## Features

### Smart Contract

- ETH deposit
- ETH withdrawal
- ERC20 token support
- Event emission
- Balance tracking

### Backend

- Wallet generation
- Transaction signing
- Transaction broadcasting
- Blockchain event indexing
- ETH balance tracking
- REST APIs

### Frontend (Optional)

- MetaMask integration
- Deposit ETH
- View balances
- Transaction history

---

## Tech Stack

### Blockchain

- Ethereum
- Sepolia Testnet
- Anvil
- Foundry

### Backend

- Node.js
- TypeScript
- Express
- ethers.js
- PostgreSQL

### Frontend

- React
- wagmi
- viem

---

## Project Structure

```text
mini-web3-wallet/
│
├── contracts/
│   ├── src/
│   ├── script/
│   ├── test/
│   └── foundry.toml
│
├── backend/
│   ├── src/
│   │   ├── api/
│   │   ├── blockchain/
│   │   ├── config/
│   │   ├── db/
│   │   ├── services/
│   │   ├── workers/
│   │   └── index.ts
│   │
│   ├── package.json
│   ├── tsconfig.json
│   └── .env
│
├── frontend/
│
└── README.md
