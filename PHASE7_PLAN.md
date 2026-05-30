# Phase 7: Frontend Integration & Advanced Features 🚀

**Status:** IN PROGRESS  
**Start Date:** May 29, 2026  
**Estimated Duration:** 3-4 sessions

---

## Overview

Phase 7 builds a complete React frontend for the wallet application and implements advanced backend features like email verification, transaction history, and improved security measures.

---

## Phase 7 Tasks

### Part A: Frontend UI Components (Priority 1)

#### 1. Authentication Pages
```
Frontend Tasks:
  └─ Create /src/pages/Register.tsx
     - Email, name, password inputs
     - Password strength indicator
     - Form validation (email format, password strength)
     - Submit to POST /api/auth/register
     - Error handling & success message
     - Link to login page

  └─ Create /src/pages/Login.tsx
     - Email & password inputs
     - Form validation
     - Submit to POST /api/auth/login
     - Store JWT token in localStorage
     - Redirect to dashboard on success
     - Link to register page

  └─ Create /src/pages/Dashboard.tsx
     - Welcome message with user name
     - Navigation to wallet management
     - Navigation to transaction history
     - Logout button
```

#### 2. Wallet Management Pages
```
Frontend Tasks:
  └─ Create /src/pages/WalletImport.tsx
     - Private key input field
     - Label input field
     - Form validation (private key format)
     - Submit to POST /api/wallets/import
     - Success/error messages
     - Auto-validate private key format

  └─ Create /src/pages/WalletList.tsx
     - Fetch wallets from GET /api/wallets/list
     - Display wallet address (masked/truncated)
     - Display label
     - Copy to clipboard button
     - Balance display (fetch from provider)
     - Delete wallet button (optional for Phase 7)
     - Select wallet for transfer
```

#### 3. Transfer Page
```
Frontend Tasks:
  └─ Create /src/pages/Transfer.tsx
     - Wallet selector (dropdown of user's wallets)
     - Recipient address input
     - Amount input
     - Token type selector (ETH or ERC20)
     - If ERC20:
       - Token contract address input
       - Fetch and display token balance
     - Gas price estimator
     - Review transaction before sending
     - Submit to POST /api/transfer
     - Display transaction hash on success
     - Show loading state during confirmation
```

#### 4. Protected Route Components
```
Frontend Tasks:
  └─ Create /src/components/ProtectedRoute.tsx
     - Check for JWT token in localStorage
     - Redirect to login if not authenticated
     - Pass user context to protected pages

  └─ Create /src/context/AuthContext.tsx
     - Store user data (email, user_id)
     - Store JWT token
     - Logout function (clear localStorage)
     - Helper to check if user is authenticated
```

#### 5. Common Components
```
Frontend Tasks:
  └─ Create /src/components/Header.tsx
     - Logo
     - User menu (show email, logout)
     - Navigation links

  └─ Create /src/components/LoadingSpinner.tsx
     - Display during API calls

  └─ Create /src/components/ErrorAlert.tsx
     - Display error messages with dismiss

  └─ Create /src/components/SuccessAlert.tsx
     - Display success messages
```

---

### Part B: Backend Improvements (Priority 2)

#### 1. Email Verification
```
Backend Tasks:
  □ Create email verification system:
    - Generate verification token on registration
    - Send verification email via nodemailer
    - Add verified_at column to users table
    - Create GET /api/auth/verify?token=... endpoint
    - Prevent login until email is verified
```

#### 2. Transaction History API
```
Backend Tasks:
  □ Create GET /api/transactions endpoint:
    - Fetch all transactions for authenticated user
    - Filter by wallet address (optional)
    - Pagination (limit 50 per page)
    - Return: tx_hash, from, to, amount, token_address, timestamp, status
```

#### 3. Rate Limiting
```
Backend Tasks:
  □ Add rate limiting:
    - Install express-rate-limit
    - Limit registration: 5 per 15 minutes per IP
    - Limit login: 10 per 15 minutes per IP
    - Limit transfer: 20 per hour per user
    - Return 429 status on limit exceeded
```

#### 4. Improved Input Validation
```
Backend Tasks:
  □ Add input validation:
    - Validate Ethereum addresses (use ethers.isAddress)
    - Validate private key format
    - Validate amounts (non-negative, max safe number)
    - Validate token decimals
    - Return descriptive error messages (400 Bad Request)
```

#### 5. Error Handling & Logging
```
Backend Tasks:
  □ Improve error handling:
    - Create error handler middleware
    - Log all errors to console/file
    - Return consistent error responses
    - Hide sensitive info in error messages
    - Add request ID for debugging

  □ Add logging:
    - Log successful transactions
    - Log authentication attempts
    - Log wallet imports
    - Timestamp all logs
```

#### 6. Token Decimal Detection
```
Backend Tasks:
  □ Detect ERC20 decimals:
    - Add minimal ERC20 ABI for decimals() call
    - Fetch decimals from token contract
    - Use instead of assuming 18 decimals
    - Cache result in memory/database
```

---

### Part C: Frontend Advanced Features (Priority 3)

#### 1. Transaction History Display
```
Frontend Tasks:
  □ Create /src/pages/TransactionHistory.tsx
    - Fetch from GET /api/transactions
    - Display table with columns:
      - Date/Time
      - From Address
      - To Address
      - Amount
      - Token Type
      - Status
      - TX Hash (with link to explorer)
    - Pagination controls
    - Filter options (date range, status)
```

#### 2. Balance Display
```
Frontend Tasks:
  □ Add balance display:
    - Show ETH balance in wallet list
    - Show ERC20 token balance in transfer page
    - Fetch from ethers.provider.getBalance()
    - Fetch ERC20 balance via contract.balanceOf()
    - Format with appropriate decimals
    - Auto-refresh every 30 seconds
```

#### 3. Address Validation
```
Frontend Tasks:
  □ Add address validation:
    - Use ethers.isAddress() to validate addresses
    - Show error if invalid format
    - Prevent form submission with invalid address
    - Warn if address checksum is incorrect
```

#### 4. Token Explorer Integration
```
Frontend Tasks:
  □ Add blockchain explorer links:
    - Link to Etherscan for transaction hashes
    - Link to Etherscan for token contracts
    - Link to Etherscan for wallet addresses
    - Make links open in new tab
```

---

## Implementation Guide

### Frontend Setup

1. **Update App.tsx** with routing:
```typescript
// Add routes:
// "/" -> Redirect to /dashboard if authenticated, else /login
// "/register" -> Register page
// "/login" -> Login page
// "/dashboard" -> Protected: Dashboard
// "/wallets/import" -> Protected: WalletImport
// "/wallets/list" -> Protected: WalletList
// "/transfer" -> Protected: Transfer
// "/transactions" -> Protected: TransactionHistory
```

2. **Install dependencies:**
```bash
npm install ethers axios react-router-dom
```

3. **Create directory structure:**
```
src/
  ├── pages/
  │   ├── Register.tsx
  │   ├── Login.tsx
  │   ├── Dashboard.tsx
  │   ├── WalletImport.tsx
  │   ├── WalletList.tsx
  │   ├── Transfer.tsx
  │   └── TransactionHistory.tsx
  ├── components/
  │   ├── Header.tsx
  │   ├── ProtectedRoute.tsx
  │   ├── LoadingSpinner.tsx
  │   ├── ErrorAlert.tsx
  │   └── SuccessAlert.tsx
  ├── context/
  │   └── AuthContext.tsx
  ├── services/
  │   └── api.ts (axios instance with auth headers)
  └── App.tsx (routing setup)
```

### Backend Setup

1. **Install dependencies:**
```bash
npm install nodemailer express-rate-limit
```

2. **Database migrations:**
```bash
# Create verified_at column in users table
# (you'll run this manually in your migration file)
```

---

## Checkpoint Tests

After completing each section, test:

### Part A Checkpoint (Frontend UI)
- [ ] Registration form submits and creates user
- [ ] Login with registered account returns token
- [ ] Wallets page shows imported wallets
- [ ] Transfer form submits transaction
- [ ] Protected routes redirect unauthenticated users

### Part B Checkpoint (Backend)
- [ ] Email verification link received and works
- [ ] Transaction history endpoint returns recent transactions
- [ ] Rate limiting blocks excessive requests
- [ ] Invalid inputs return helpful error messages
- [ ] ERC20 decimal detection works for various tokens

### Part C Checkpoint (Advanced)
- [ ] Transaction history displays with pagination
- [ ] Balances update automatically
- [ ] Address validation prevents invalid submissions
- [ ] Explorer links work correctly

---

## Environment Variables (Updated)

```bash
# Frontend (.env)
REACT_APP_API_URL=http://localhost:3000/api

# Backend (.env additions)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASSWORD=your_app_password
SMTP_FROM=noreply@wallet.app

# Keep existing:
DB_USER=postgres
DB_PASSWORD=your_password
JWT_SECRET=your_secret_key_here
ENCRYPTION_KEY=your_32_char_hex_key_here
RPC_URL=http://localhost:8545
PORT=3000
```

---

## Priority Matrix

**Do First (Essential):**
1. Authentication pages (Register, Login)
2. Dashboard page
3. Protect routes middleware
4. Auth context

**Then (Core Feature):**
5. Wallet import & list pages
6. Transfer page
7. API service layer

**Then (Polish):**
8. Error handling & validation
9. Loading states
10. Success messages

**Later (Nice to Have):**
11. Email verification
12. Transaction history
13. Rate limiting
14. Balance displays
15. Address explorer links

---

## Notes

- Start with **Part A** (frontend) as it unblocks user interaction
- Keep API calls clean with a dedicated `services/api.ts` file
- Store JWT token in localStorage (consider more secure storage later)
- All API calls should include `Authorization: Bearer <token>` header
- Test each page immediately after creating it

---

**Next Step:** Start with the Register and Login pages! 🎯
