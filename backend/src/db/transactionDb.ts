import { Pool } from "pg";
import config from "../config";

// Connection pool
const pool = new Pool({
  host: "localhost",
  port: 5432,
  database: "web3_wallet",
  user: process.env.DB_USER || "postgres",
  password: process.env.DB_PASSWORD || "",
});

class TransactionDb {
  // Insert a new transaction
  async insertTransaction(
    txHash: string,
    fromAddress: string,
    amount: string,
    type: "deposit" | "withdraw",
    status: string,
    blockNumber?: number,
  ) {
    try {
      console.log("[TransactionDb] Inserting transaction:", txHash);
      const result = await pool.query(
        `INSERT INTO transactions (tx_hash, from_address, amount, type, status, block_number)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING *`,
        [txHash, fromAddress, amount, type, status, blockNumber],
      );
      console.log("[TransactionDb] Transaction inserted:", result.rows[0]);
      return result.rows[0];
    } catch (error) {
      console.error("[TransactionDb] Error inserting:", error);
      throw error;
    }
  }

  // Get all transactions for an address
  async getTransactionsByAddress(address: string) {
    try {
      console.log("[TransactionDb] Getting transactions for:", address);
      const result = await pool.query(
        "SELECT * FROM transactions WHERE from_address = $1 ORDER BY created_at DESC",
        [address],
      );
      console.log("[TransactionDb] Found transactions:", result.rows.length);
      return result.rows;
    } catch (error) {
      console.error("[TransactionDb] Error querying:", error);
      throw error;
    }
  }

  // Get all transactions
  async getAllTransactions() {
    try {
      const result = await pool.query(
        "SELECT * FROM transactions ORDER BY created_at DESC",
      );
      return result.rows;
    } catch (error) {
      console.error("[TransactionDb] Error querying all:", error);
      throw error;
    }
  }

  async getLastSyncedBlock(): Promise<number> {
    try {
      console.log("[TransactionDb] Fetching last_synced_block from metadata");
      const result = await pool.query(
        "SELECT value FROM metadata WHERE key = $1",
        ["last_synced_block"],
      );

      if (result.rows.length === 0) {
        console.log("[TransactionDb] No metadata found, returning 0");
        return 0;
      }

      const blockNumber = parseInt(result.rows[0].value, 10);
      console.log("[TransactionDb] Last synced block:", blockNumber);
      return blockNumber;
    } catch (error) {
      console.error("[TransactionDb] Error fetching last_synced_block:", error);
      throw error;
    }
  }

  async updateLastSyncedBlock(
    blockNumber: number,
    recordsSynced: number = 0,
  ): Promise<void> {
    try {
      console.log(
        "[TransactionDb] Updating last_synced_block to:",
        blockNumber,
      );
      await pool.query(
        `UPDATE metadata 
         SET value = $1, data_synced = $2, updated_at = CURRENT_TIMESTAMP 
         WHERE key = $3`,
        [blockNumber, recordsSynced, "last_synced_block"],
      );
      console.log("[TransactionDb] ✅ Updated last_synced_block successfully");
    } catch (error) {
      console.error("[TransactionDb] Error updating last_synced_block:", error);
      throw error;
    }
  }

   async transactionExists(txHash: string): Promise<boolean> {
    try {
      const result = await pool.query(
        'SELECT 1 FROM transactions WHERE tx_hash = $1 LIMIT 1',
        [txHash]
      );
      return result.rows.length > 0;
    } catch (error) {
      console.error('[TransactionDb] Error checking transaction:', error);
      throw error;
    }
  }

  // Record sync attempt in history
  async recordSyncHistory(
    lastBlockSynced: number,
    recordsSynced: number,
    durationMs: number,
    status: 'success' | 'partial' | 'failed',
    errorMessage?: string
  ): Promise<void> {
    try {
      await pool.query(
        `INSERT INTO sync_history (last_block_synced, records_synced, duration_ms, status, error_message)
         VALUES ($1, $2, $3, $4, $5)`,
        [lastBlockSynced, recordsSynced, durationMs, status, errorMessage || null]
      );

      // Keep only last 100 records
      await pool.query(
        `DELETE FROM sync_history WHERE id NOT IN (
          SELECT id FROM sync_history ORDER BY synced_at DESC LIMIT 100
        )`
      );

      console.log('[TransactionDb] ✅ Sync history recorded');
    } catch (error) {
      console.error('[TransactionDb] Error recording sync history:', error);
      throw error;
    }
  }
}

export default new TransactionDb();
