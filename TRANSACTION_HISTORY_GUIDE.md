# Transaction History API - Implementation Guide

## Overview
Create a new API endpoint to fetch transaction history for authenticated users with pagination support.

---

## Step 1: Add Method to TransactionDb

**File:** `backend/src/db/transactionDb.ts`

Add this new method to the `TransactionDb` class (around line 210, before the closing brace):

```typescript
// Get transactions for a user with pagination
async getTransactionsByUserId(userId: number, limit: number = 50, offset: number = 0) {
  try {
    console.log(`[TransactionDb] Fetching transactions for user ${userId}`);
    
    // Get total count
    const countResult = await pool.query(
      `SELECT COUNT(*) as total FROM transactions WHERE user_id = $1`,
      [userId]
    );
    const total = parseInt(countResult.rows[0].total, 10);
    
    // Get paginated results
    const result = await pool.query(
      `SELECT 
        id,
        tx_hash,
        from_address,
        to_address,
        amount,
        token_address,
        type,
        status,
        created_at,
        block_number
       FROM transactions 
       WHERE user_id = $1 
       ORDER BY created_at DESC 
       LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    );
    
    return {
      transactions: result.rows,
      total,
      limit,
      offset,
      hasMore: offset + limit < total
    };
  } catch (error) {
    console.error("[TransactionDb] Error fetching user transactions:", error);
    throw error;
  }
}
```

**What it does:**
- Fetches transactions for a specific user ID
- Supports pagination (limit & offset)
- Returns transaction count and hasMore flag

---

## Step 2: Create Transaction Routes File

**File:** `backend/src/routes/transaction.ts` (Note: this might already exist)

Check if this file exists. If it does, add this endpoint to it. If not, create it.

Add this new endpoint:

```typescript
import express, { Request, Response } from "express";
import transactionDb from "../db/transactionDb";
import { authMiddleware } from "../auth/middleware";

const router = express.Router();

// GET /api/transactions - Get user's transaction history
router.get("/", authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId; // From auth middleware
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 100); // Max 100
    const offset = parseInt(req.query.offset as string) || 0;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const result = await transactionDb.getTransactionsByUserId(userId, limit, offset);

    res.json({
      success: true,
      transactions: result.transactions,
      pagination: {
        total: result.total,
        limit: result.limit,
        offset: result.offset,
        hasMore: result.hasMore
      }
    });
  } catch (error: any) {
    console.error("[Transaction Route] Error:", error);
    res.status(500).json({ message: "Failed to fetch transactions" });
  }
});

export default router;
```

**What it does:**
- Protects route with `authMiddleware` (requires JWT)
- Extracts `userId` from authenticated request
- Accepts query params: `limit` (default 50, max 100) and `offset` (default 0)
- Returns paginated transaction history

---

## Step 3: Register Route in Main App

**File:** `backend/src/index.ts`

Find this section (around line 24-29):
```typescript
app.use("/api/wallet", walletRouter);
app.use("/api/transaction", transactionRouter);
app.use("/api/balances", tokenBalanceRouter);
app.use("/api/auth", authRouter);
app.use("/api/transfer", transferRouter);
app.use("/api/wallets", walletsRouter)
```

Make sure this line is there:
```typescript
app.use("/api/transactions", transactionRouter);
```

**Note:** The endpoint should be `/api/transactions` (plural) for consistency.

---

## Step 4: Update Frontend to Display History

**File:** `frontend/src/pages/TransactionHistory.tsx` (Create new file)

Create this new page:

```typescript
import React, { useState, useEffect } from 'react';
import { transactionAPI } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorAlert from '../components/ErrorAlert';
import styles from './Wallet.module.css';

interface Transaction {
  id: number;
  tx_hash: string;
  from_address: string;
  to_address: string;
  amount: string;
  token_address: string | null;
  type: string;
  status: string;
  created_at: string;
}

const TransactionHistory: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const limit = 20;

  useEffect(() => {
    fetchTransactions();
  }, [offset]);

  const fetchTransactions = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await transactionAPI.history(limit, offset);
      setTransactions(response.data.transactions);
      setHasMore(response.data.pagination.hasMore);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch transactions');
    } finally {
      setLoading(false);
    }
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString();
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h1 className={styles.title}>Transaction History</h1>

        {error && <ErrorAlert message={error} onDismiss={() => setError('')} />}

        {loading && <LoadingSpinner message="Loading transactions..." />}

        {!loading && transactions.length === 0 && (
          <p style={{ textAlign: 'center', color: '#999' }}>No transactions yet</p>
        )}

        {!loading && transactions.length > 0 && (
          <>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #ddd' }}>
                    <th style={{ textAlign: 'left', padding: '0.5rem' }}>Date</th>
                    <th style={{ textAlign: 'left', padding: '0.5rem' }}>From</th>
                    <th style={{ textAlign: 'left', padding: '0.5rem' }}>To</th>
                    <th style={{ textAlign: 'right', padding: '0.5rem' }}>Amount</th>
                    <th style={{ textAlign: 'center', padding: '0.5rem' }}>Status</th>
                    <th style={{ textAlign: 'left', padding: '0.5rem' }}>TX Hash</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((tx) => (
                    <tr key={tx.id} style={{ borderBottom: '1px solid #eee' }}>
                      <td style={{ padding: '0.5rem' }}>{formatDate(tx.created_at)}</td>
                      <td style={{ padding: '0.5rem', fontFamily: 'monospace', fontSize: '0.85rem' }}>
                        {formatAddress(tx.from_address)}
                      </td>
                      <td style={{ padding: '0.5rem', fontFamily: 'monospace', fontSize: '0.85rem' }}>
                        {formatAddress(tx.to_address)}
                      </td>
                      <td style={{ padding: '0.5rem', textAlign: 'right' }}>
                        {tx.amount} {tx.token_address ? 'tokens' : 'ETH'}
                      </td>
                      <td style={{ padding: '0.5rem', textAlign: 'center' }}>
                        <span style={{
                          padding: '0.25rem 0.5rem',
                          borderRadius: '4px',
                          fontSize: '0.8rem',
                          backgroundColor: tx.status === 'success' ? '#d4edda' : '#fff3cd',
                          color: tx.status === 'success' ? '#155724' : '#856404'
                        }}>
                          {tx.status}
                        </span>
                      </td>
                      <td style={{ padding: '0.5rem' }}>
                        <a href={`https://etherscan.io/tx/${tx.tx_hash}`} target="_blank" rel="noopener noreferrer"
                          style={{ color: '#667eea', textDecoration: 'none', fontSize: '0.85rem' }}>
                          View →
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'space-between' }}>
              <button 
                onClick={() => setOffset(Math.max(0, offset - limit))}
                disabled={offset === 0}
                style={{ padding: '0.5rem 1rem', cursor: offset === 0 ? 'not-allowed' : 'pointer' }}
              >
                ← Previous
              </button>
              <span>Page {Math.floor(offset / limit) + 1}</span>
              <button 
                onClick={() => setOffset(offset + limit)}
                disabled={!hasMore}
                style={{ padding: '0.5rem 1rem', cursor: !hasMore ? 'not-allowed' : 'pointer' }}
              >
                Next →
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default TransactionHistory;
```

---

## Step 5: Add Route to Frontend App

**File:** `frontend/src/App.tsx`

Import the component:
```typescript
import TransactionHistory from './pages/TransactionHistory';
```

Add this route in the Routes section:
```typescript
<Route
  path="/transactions"
  element={
    <ProtectedRoute>
      <TransactionHistory />
    </ProtectedRoute>
  }
/>
```

---

## Step 6: Add Navigation Link

**File:** `frontend/src/components/Header.tsx`

Add this link in the authenticated navigation (around line 16):
```typescript
<Link to="/transactions" className={styles.link}>
  History
</Link>
```

---

## Testing Checklist

- [ ] Backend compiles without errors
- [ ] GET `/api/transactions` returns 401 without JWT token
- [ ] GET `/api/transactions` with valid JWT returns user's transactions
- [ ] Pagination works with `?limit=10&offset=0`
- [ ] Frontend loads Transaction History page
- [ ] Transaction table displays with date, addresses, amounts
- [ ] Pagination buttons work
- [ ] Etherscan links open in new tab

---

## API Response Format

```json
{
  "success": true,
  "transactions": [
    {
      "id": 1,
      "tx_hash": "0x...",
      "from_address": "0x...",
      "to_address": "0x...",
      "amount": "1000000000000000000",
      "token_address": null,
      "type": "transfer",
      "status": "success",
      "created_at": "2026-05-29T12:00:00Z",
      "block_number": 12345
    }
  ],
  "pagination": {
    "total": 50,
    "limit": 20,
    "offset": 0,
    "hasMore": true
  }
}
```

---

## Notes
- Make sure `user_id` is being saved in the transactions table when transfers happen
- The `authMiddleware` extracts `userId` from the JWT token
- Limit is capped at 100 to prevent huge queries
- Transactions are ordered newest first (`created_at DESC`)
