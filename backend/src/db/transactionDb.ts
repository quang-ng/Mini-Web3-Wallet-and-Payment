import { Pool } from 'pg';
import config from '../config';

// Connection pool
const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'web3_wallet',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '',
});

class TransactionDb {
  // Insert a new transaction
  async insertTransaction(
    txHash: string,
    fromAddress: string,
    amount: string,
    type: 'deposit' | 'withdraw',
    status: string,
    blockNumber?: number
  ) {
    try {
      console.log('[TransactionDb] Inserting transaction:', txHash);
      const result = await pool.query(
        `INSERT INTO transactions (tx_hash, from_address, amount, type, status, block_number)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING *`,
        [txHash, fromAddress, amount, type, status, blockNumber]
      );
      console.log('[TransactionDb] Transaction inserted:', result.rows[0]);
      return result.rows[0];
    } catch (error) {
      console.error('[TransactionDb] Error inserting:', error);
      throw error;
    }
  }

  // Get all transactions for an address
  async getTransactionsByAddress(address: string) {
    try {
      console.log('[TransactionDb] Getting transactions for:', address);
      const result = await pool.query(
        'SELECT * FROM transactions WHERE from_address = $1 ORDER BY created_at DESC',
        [address]
      );
      console.log('[TransactionDb] Found transactions:', result.rows.length);
      return result.rows;
    } catch (error) {
      console.error('[TransactionDb] Error querying:', error);
      throw error;
    }
  }

  // Get all transactions
  async getAllTransactions() {
    try {
      const result = await pool.query('SELECT * FROM transactions ORDER BY created_at DESC');
      return result.rows;
    } catch (error) {
      console.error('[TransactionDb] Error querying all:', error);
      throw error;
    }
  }
}

export default new TransactionDb();
