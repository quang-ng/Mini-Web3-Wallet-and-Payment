import { Pool } from "pg";
import config from "../config";
import logger from "../utils/logger";

// Connection pool
const pool = new Pool({
  host: "localhost",
  port: 5432,
  database: "web3_wallet",
  user: config.dbUser,
  password: config.dbPassword || "",
});


class TransactionDb {
  // Insert a new transaction
  async insertTransaction(
    txHash: string,
    fromAddress: string,
    amount: string,
    type: "deposit" | "withdraw" | "transfer",
    status: string,
    blockNumber?: number,
    token_address?: string,
    to_address?: string,
    user_id?: number
  ) {
    try {
      logger.debug("TransactionDb", "Inserting transaction", { txHash, type, amount, user_id });
      const result = await pool.query(
        `INSERT INTO transactions (tx_hash, from_address, amount, type, status, block_number, token_address, to_address, user_id)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         RETURNING *`,
        [
          txHash,
          fromAddress,
          amount,
          type,
          status,
          blockNumber,
          token_address,
          to_address,
          user_id
        ],
      );
      logger.info("TransactionDb", "Transaction inserted successfully", { txHash, transactionId: result.rows[0].id, type, user_id });
      return result.rows[0];
    } catch (error) {
      logger.error("TransactionDb", "Error inserting transaction:", error);
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
        "SELECT 1 FROM transactions WHERE tx_hash = $1 LIMIT 1",
        [txHash],
      );
      return result.rows.length > 0;
    } catch (error) {
      console.error("[TransactionDb] Error checking transaction:", error);
      throw error;
    }
  }

  // Record sync attempt in history
  async recordSyncHistory(
    lastBlockSynced: number,
    recordsSynced: number,
    durationMs: number,
    status: "success" | "partial" | "failed",
    errorMessage?: string,
  ): Promise<void> {
    try {
      await pool.query(
        `INSERT INTO sync_history (last_block_synced, records_synced, duration_ms, status, error_message)
         VALUES ($1, $2, $3, $4, $5)`,
        [
          lastBlockSynced,
          recordsSynced,
          durationMs,
          status,
          errorMessage || null,
        ],
      );

      // Keep only last 100 records
      await pool.query(
        `DELETE FROM sync_history WHERE id NOT IN (
          SELECT id FROM sync_history ORDER BY synced_at DESC LIMIT 100
        )`,
      );

      console.log("[TransactionDb] ✅ Sync history recorded");
    } catch (error) {
      console.error("[TransactionDb] Error recording sync history:", error);
      throw error;
    }
  }

  async getTokenBalance(
    address: string,
    tokenAddress: string,
  ): Promise<string> {
    try {
      const result = await pool.query(
        `SELECT COALESCE(SUM(amount::numeric), 0) as balance 
       FROM transactions 
       WHERE to_address = $1 AND token_address = $2 AND type = 'transfer'`,
        [address, tokenAddress],
      );
      return result.rows[0].balance;
    } catch (error) {
      console.error("[TransactionDb] Error getting token balance:", error);
      throw error;
    }
  }
  async getTokenTransactions(address: string, tokenAddress?: string) {
    try {
      let query = `
      SELECT * FROM transactions
      WHERE type = 'transfer'
      AND (from_address = $1 OR to_address = $1)
    `;
      const params = [address.toLowerCase()];

      if (tokenAddress) {
        query += ` AND token_address = $2`;
        params.push(tokenAddress.toLowerCase());
      }

      query += ` ORDER BY created_at DESC`;

      const result = await pool.query(query, params);
      return result.rows;
    } catch (error) {
      console.error("[TransactionDb] Error getting token transactions:", error);
      throw error;
    }
  }

  async getTransactionsByUserId(userId: number, limit: number = 50, offset: number = 0) {
    try {
      console.log(`[TransactionDb] Fetching transactions for user ${userId}`);

      const countResult = await pool.query(
        `SELECT COUNT(*) as total FROM transactions WHERE user_id = $1`,
        [userId]
      );
      const total = parseInt(countResult.rows[0].total, 10);

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
}

export default new TransactionDb();
