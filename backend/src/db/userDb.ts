import { Pool } from 'pg';

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'web3_wallet',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '',
});

export interface User {
  id: number;
  email: string;
  name: string;
  password_hash: string;
  created_at: Date;
}

export interface UserWallet {
  id: number;
  user_id: number;
  wallet_address: string;
  encrypted_private_key: string;
  label?: string;
  added_at: Date;
}

class UserDb {
  async createUser(email: string, name: string, passwordHash: string): Promise<User> {
    try {
      const result = await pool.query(
        `INSERT INTO users (email, name, password_hash)
         VALUES ($1, $2, $3)
         RETURNING *`,
        [email, name, passwordHash]
      );
      return result.rows[0];
    } catch (error) {
      console.error('[UserDb] Error creating user:', error);
      throw error;
    }
  }

  async findUserByEmail(email: string): Promise<User | null> {
    try {
      const result = await pool.query(
        `SELECT * FROM users WHERE email = $1`,
        [email]
      );
      return result.rows[0] || null;
    } catch (error) {
      console.error('[UserDb] Error finding user by email:', error);
      throw error;
    }
  }

  async findUserById(userId: number): Promise<User | null> {
    try {
      const result = await pool.query(
        `SELECT * FROM users WHERE id = $1`,
        [userId]
      );
      return result.rows[0] || null;
    } catch (error) {
      console.error('[UserDb] Error finding user by id:', error);
      throw error;
    }
  }

  async addWallet(userId: number, walletAddress: string, encryptedPrivateKey: string, label?: string): Promise<UserWallet> {
    try {
      const result = await pool.query(
        `INSERT INTO user_wallets (user_id, wallet_address, encrypted_private_key, label)
         VALUES ($1, $2, $3, $4)
         RETURNING *`,
        [userId, walletAddress.toLowerCase(), encryptedPrivateKey, label || null]
      );
      return result.rows[0];
    } catch (error) {
      console.error('[UserDb] Error adding wallet:', error);
      throw error;
    }
  }

  async getUserWallets(userId: number): Promise<UserWallet[]> {
    try {
      const result = await pool.query(
        `SELECT * FROM user_wallets WHERE user_id = $1 ORDER BY added_at DESC`,
        [userId]
      );
      return result.rows;
    } catch (error) {
      console.error('[UserDb] Error getting user wallets:', error);
      throw error;
    }
  }

  async getWalletByAddress(walletAddress: string): Promise<UserWallet | null> {
    try {
      const result = await pool.query(
        `SELECT * FROM user_wallets WHERE wallet_address = $1`,
        [walletAddress.toLowerCase()]
      );
      return result.rows[0] || null;
    } catch (error) {
      console.error('[UserDb] Error getting wallet by address:', error);
      throw error;
    }
  }

  async checkWalletOwnership(userId: number, walletAddress: string): Promise<boolean> {
    try {
      const result = await pool.query(
        `SELECT 1 FROM user_wallets WHERE user_id = $1 AND wallet_address = $2 LIMIT 1`,
        [userId, walletAddress.toLowerCase()]
      );
      return result.rows.length > 0;
    } catch (error) {
      console.error('[UserDb] Error checking wallet ownership:', error);
      throw error;
    }
  }
}

export default new UserDb();
