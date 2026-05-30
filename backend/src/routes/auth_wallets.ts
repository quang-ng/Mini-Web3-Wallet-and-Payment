import { Router, Response } from 'express';
import { AuthRequest, authMiddleware } from '../auth/middleware';
import { encryptPrivateKey } from '../auth/encryption';
import userDb from '../db/userDb';
import { ethers } from 'ethers';

console.log('[Wallet] auth_wallets.ts file loaded');

const RPC_URL = 'http://localhost:8545';
const SIMPLE_TOKEN_ADDRESS = process.env.SIMPLE_TOKEN_ADDRESS || '';

console.log('[Wallet] RPC_URL:', RPC_URL);
console.log('[Wallet] SIMPLE_TOKEN_ADDRESS:', SIMPLE_TOKEN_ADDRESS);

async function getETHBalance(address: string): Promise<string> {
  try {
    console.log(`[Wallet] Fetching ETH balance for ${address}`);
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const balance = await provider.getBalance(address);
    const formatted = ethers.formatEther(balance);
    console.log(`[Wallet] ETH balance for ${address}: ${formatted}`);
    return formatted;
  } catch (error) {
    console.error('[Wallet] Error fetching ETH balance:', error);
    return '0';
  }
}

async function getTokenBalance(tokenAddress: string, walletAddress: string, decimals: number = 18): Promise<string> {
  try {
    console.log(`[Wallet] Fetching token balance for ${walletAddress} from ${tokenAddress}`);
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const erc20Abi = ['function balanceOf(address account) view returns (uint256)'];
    const contract = new ethers.Contract(tokenAddress, erc20Abi, provider);
    const balance = await contract.balanceOf(walletAddress);
    const formatted = ethers.formatUnits(balance, decimals);
    console.log(`[Wallet] Token balance for ${walletAddress}: ${formatted}`);
    return formatted;
  } catch (error) {
    console.error('[Wallet] Error fetching token balance:', error);
    return '0';
  }
}

const router = Router();

console.log('[Wallet] Router initialized');

// Log all requests to this router
router.use((req, res, next) => {
  console.log(`[Wallet] Incoming request: ${req.method} ${req.path}`);
  next();
});

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
    console.log(`[Wallet] /list endpoint called for user_id: ${user_id}`);

    if (!user_id) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const wallets = await userDb.getUserWallets(user_id);
    console.log(`[Wallet] Found ${wallets.length} wallets for user ${user_id}`);
    console.log(`[Wallet] SIMPLE_TOKEN_ADDRESS: ${SIMPLE_TOKEN_ADDRESS}`);

    const walletsWithBalance = await Promise.all(
      wallets.map(async (w) => {
        console.log(`[Wallet] Processing wallet: ${w.wallet_address}`);
        const ethBalance = await getETHBalance(w.wallet_address);
        let tokenBalance = '0';
        if (SIMPLE_TOKEN_ADDRESS) {
          tokenBalance = await getTokenBalance(SIMPLE_TOKEN_ADDRESS, w.wallet_address, 18);
        }
        const result = {
          id: w.id,
          wallet_address: w.wallet_address,
          label: w.label,
          added_at: w.added_at,
          balance: ethBalance,
          tokenBalance: tokenBalance,
        };
        console.log(`[Wallet] Processed wallet result:`, result);
        return result;
      })
    );

    console.log(`[Wallet] Returning ${walletsWithBalance.length} wallets with balance`);
    res.json({
      success: true,
      wallets: walletsWithBalance,
    });
  } catch (error) {
    console.error('[Wallet] List error:', error);
    res.status(500).json({ error: 'Failed to list wallets' });
  }
});

export default router;
