# Phase 6: User Authentication & Wallet Management ✅

**Status:** COMPLETE  
**Date Completed:** May 29, 2026  
**Duration:** 2 sessions

---

## Overview

Implemented a complete user authentication and custodial wallet management system with backend transaction signing. Users can register, login, import wallets, and transfer both ETH and ERC20 tokens securely.

---

## Architecture

### Database Schema

**Users Table**
```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**User Wallets Table**
```sql
CREATE TABLE user_wallets (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  wallet_address VARCHAR(42) NOT NULL,
  encrypted_private_key TEXT NOT NULL,
  label VARCHAR(255),
  added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Transactions Table (Updated)**
```sql
ALTER TABLE transactions ADD COLUMN user_id INTEGER REFERENCES users(id);
```

---

## Authentication Flow

### 1. User Registration
```bash
POST /api/auth/register
{
  "email": "user@example.com",
  "name": "John Doe",
  "password": "securePassword123!"
}
```

**Process:**
- Validate email & password
- Hash password with bcrypt (10 rounds)
- Create user in database
- Return success message

### 2. User Login
```bash
POST /api/auth/login
{
  "email": "user@example.com",
  "password": "securePassword123!"
}
```

**Process:**
- Find user by email
- Compare password hash
- Generate JWT token (expires in 24h)
- Return token for authenticated requests

### 3. Protected Routes
All protected routes require:
```
Authorization: Bearer <JWT_TOKEN>
```

Middleware verifies token and extracts `user_id` for wallet/transaction operations.

---

## Wallet Management

### Import Wallet
```bash
POST /api/wallets/import
Authorization: Bearer <TOKEN>
{
  "private_key": "0xac0974bec39a17e36ba4a6b4d238ff944bacb476cbed64202d8ac0a8a9ba6b5e",
  "label": "My Ethereum Wallet"
}
```

**Process:**
- Validate private key format
- Derive wallet address from private key
- Encrypt private key with AES-256 (master password from env)
- Store encrypted key in database
- Return wallet address & label

### List Wallets
```bash
GET /api/wallets/list
Authorization: Bearer <TOKEN>
```

**Returns:** All wallets owned by authenticated user

---

## Transaction Signing & Transfer

### Transfer ETH
```bash
POST /api/transfer
Authorization: Bearer <TOKEN>
{
  "wallet_address": "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
  "to_address": "0x70997970C51812e339D9B73b0245ad59E1edd142",
  "amount": "0.1",
  "token_address": null
}
```

### Transfer ERC20 Token
```bash
POST /api/transfer
Authorization: Bearer <TOKEN>
{
  "wallet_address": "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
  "to_address": "0x70997970C51812e339D9B73b0245ad59E1edd142",
  "amount": "10",
  "token_address": "0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9"
}
```

**Backend Signing Process:**
1. Verify user owns the wallet
2. Retrieve encrypted private key from database
3. Decrypt private key using master password
4. Create ethers.Wallet signer with decrypted key
5. Sign & send transaction to blockchain
6. Wait for confirmation
7. Record transaction in database with `user_id`
8. Return tx hash & status

---

## Security Implementation

### Password Security
- **Hashing:** bcrypt with 10 salt rounds
- **Storage:** Only password_hash stored, never plain password
- **Comparison:** Constant-time comparison (bcrypt built-in)

### Private Key Encryption
- **Algorithm:** AES-256-CBC
- **Key Derivation:** Master password from environment variable
- **IV:** Random 16 bytes per encryption
- **Storage:** Encrypted hex string in database

### JWT Tokens
- **Algorithm:** HS256 (HMAC SHA-256)
- **Payload:** `user_id`, `email`
- **Expiration:** 24 hours
- **Secret:** `JWT_SECRET` from environment

### Wallet Ownership Verification
- Every transaction checks `user_wallets` table
- Ensures user can only transfer from their own wallets
- Prevents unauthorized access to other users' funds

---

## Files Created

### Authentication Modules
- `backend/src/auth/password.ts` - Password hashing & verification
- `backend/src/auth/jwt.ts` - JWT token generation & verification
- `backend/src/auth/encryption.ts` - Private key encryption & decryption
- `backend/src/auth/middleware.ts` - Auth middleware for protected routes

### Database
- `backend/src/db/userDb.ts` - User & wallet database operations
- `backend/migrations/001_create_users_table.sql`
- `backend/migrations/002_create_user_wallets_table.sql`
- `backend/migrations/003_add_user_id_to_transactions.sql`

### Routes
- `backend/src/routes/auth.ts` - Register & login endpoints
- `backend/src/routes/wallets.ts` - Wallet import & list endpoints
- `backend/src/routes/transfer.ts` - Transfer ETH & tokens (updated with user_id)

### Configuration
- `backend/package.json` - Added bcrypt, jsonwebtoken, pg

---

## Environment Variables Required

```bash
# Database
DB_USER=postgres
DB_PASSWORD=your_password

# Authentication
JWT_SECRET=your_secret_key_here
ENCRYPTION_KEY=your_32_char_hex_key_here

# Blockchain
RPC_URL=http://localhost:8545

# Server
PORT=3000
```

---

## Testing Results

### Tested Endpoints
- ✅ POST /api/auth/register - User creation
- ✅ POST /api/auth/login - JWT token generation
- ✅ POST /api/wallets/import - Wallet import with encryption
- ✅ GET /api/wallets/list - User wallet listing
- ✅ POST /api/transfer - ETH transfers with backend signing
- ✅ POST /api/transfer - ERC20 token transfers with decimal handling

### Test Flow
1. Register new user
2. Login to get JWT token
3. Import wallet with private key
4. List imported wallets
5. Transfer 0.1 ETH to another address
6. Transfer tokens to another address

---

## Known Limitations & Future Improvements

### Current Limitations
- Single master password for all private keys (consider per-user encryption)
- No email verification for registration
- No MFA support
- No transaction rate limiting
- Assumes 18 decimals for all ERC20 tokens

### Phase 7 Improvements
- [ ] Frontend UI (React forms for register, login, import, transfer)
- [ ] Email verification
- [x] Transaction signing in database
- [ ] Rate limiting on endpoints
- [ ] Input validation improvements
- [ ] Error handling & logging
- [ ] Test suite
- [ ] Token decimal detection via contract ABI
- [ ] Transaction history API
- [ ] Withdrawal limits & security alerts

---

## Technical Decisions

### Why Custodial Model?
- Simplified UX (no MetaMask integration complexity)
- Better for payment flows (instant confirmation)
- Encrypted key storage for security
- Trade-off: Users trust backend with private keys

### Why AES-256?
- Industry standard for sensitive data encryption
- Good balance of security & performance
- Widely supported across libraries

### Why JWT?
- Stateless authentication (scalable)
- No session storage needed
- Standard for REST APIs
- 24-hour expiration balances security & UX

### Why Store Amounts in Wei?
- Consistency with blockchain representation
- Prevents decimal rounding issues
- Easier to audit & verify on-chain

---

## Deployment Checklist

- [ ] Set secure environment variables
- [ ] Run database migrations
- [ ] Test all endpoints with real wallet
- [ ] Set up HTTPS for production
- [ ] Enable rate limiting
- [ ] Set up monitoring/logging
- [ ] Document API for frontend team
- [ ] Security audit for encryption keys

---

## API Documentation Summary

**Base URL:** `http://localhost:3000/api`

| Method | Endpoint | Auth | Purpose |
|--------|----------|------|---------|
| POST | /auth/register | ❌ | Create new user |
| POST | /auth/login | ❌ | Get JWT token |
| POST | /wallets/import | ✅ | Import wallet |
| GET | /wallets/list | ✅ | List user wallets |
| POST | /transfer | ✅ | Send ETH or tokens |

---

**Ready for Phase 7: Frontend Integration & UI** 🚀
