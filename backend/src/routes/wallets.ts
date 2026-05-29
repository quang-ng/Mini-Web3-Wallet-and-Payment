import { Router, Response } from 'express';
import { AuthRequest, authMiddleware } from '../auth/middleware';
import { encryptPrivateKey } from '../auth/encryption';
import userDb from '../db/userDb';
import { ethers } from 'ethers';

const router = Router();

router.post('/import', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { private_key, label } = req.body;
    const user_id = req.user?.user_id;

    if (!user_id) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!private_key) {
      return res.status(400).json({ error: 'Private key required' });
    }

    // Derive wallet address from private key
    let walletAddress: string;
    try {
      const wallet = new ethers.Wallet(private_key);
      walletAddress = wallet.address.toLowerCase();
    } catch (error) {
      return res.status(400).json({ error: 'Invalid private key' });
    }

    // Encrypt private key before storing
    const encryptedKey = encryptPrivateKey(private_key);

    // Store in database
    const userWallet = await userDb.addWallet(user_id, walletAddress, encryptedKey, label);

    res.json({
      success: true,
      wallet: {
        id: userWallet.id,
        wallet_address: userWallet.wallet_address,
        label: userWallet.label,
      },
    });
  } catch (error) {
    console.error('[Wallet] Import error:', error);
    res.status(500).json({ error: 'Failed to import wallet' });
  }
});

router.get('/list', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const user_id = req.user?.user_id;

    if (!user_id) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const wallets = await userDb.getUserWallets(user_id);

    res.json({
      success: true,
      wallets: wallets.map((w) => ({
        id: w.id,
        wallet_address: w.wallet_address,
        label: w.label,
        added_at: w.added_at,
      })),
    });
  } catch (error) {
    console.error('[Wallet] List error:', error);
    res.status(500).json({ error: 'Failed to list wallets' });
  }
});

export default router;
