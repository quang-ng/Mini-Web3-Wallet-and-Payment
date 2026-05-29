import { Router, Response } from 'express';
import { AuthRequest, authMiddleware } from '../auth/middleware';
import { decryptPrivateKey } from '../auth/encryption';
import userDb from '../db/userDb';
import transactionDb from '../db/transactionDb';
import { ethers } from 'ethers';
import config from '../config';

const router = Router();

router.post('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { wallet_address, to_address, amount, token_address } = req.body;
    const user_id = req.user?.user_id;

    if (!user_id) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!wallet_address || !to_address || !amount) {
      return res.status(400).json({ error: 'wallet_address, to_address, and amount required' });
    }

    // Check if user owns this wallet
    const ownsWallet = await userDb.checkWalletOwnership(user_id, wallet_address);
    if (!ownsWallet) {
      return res.status(403).json({ error: 'You do not own this wallet' });
    }

    // Get encrypted private key
    const userWallet = await userDb.getWalletByAddress(wallet_address);
    if (!userWallet) {
      return res.status(404).json({ error: 'Wallet not found' });
    }

    // Decrypt private key
    const privateKey = decryptPrivateKey(userWallet.encrypted_private_key);

    // Create signer and send transaction
    const provider = new ethers.JsonRpcProvider(config.rpcUrl);
    const signer = new ethers.Wallet(privateKey, provider);

    let tx;
    let amountInWei;
    if (token_address) {
      // ERC20 token transfer
      const tokenAbi = ['function transfer(address to, uint256 amount) returns (bool)'];
      const tokenContract = new ethers.Contract(token_address, tokenAbi, signer);
      amountInWei = ethers.parseUnits(amount, 18)

      tx = await tokenContract.transfer(to_address.toLowerCase(), amountInWei);
    } else {
      // ETH transfer
      amountInWei = ethers.parseEther(amount)
      tx = await signer.sendTransaction({
        to: to_address.toLowerCase(),
        value: ethers.parseEther(amount),
      });
    }

    // Wait for confirmation
    const receipt = await tx.wait();

    // Record in database
    await transactionDb.insertTransaction(
      tx.hash,
      wallet_address.toLowerCase(),
      amountInWei.toString(),
      'transfer',
      'confirmed',
      receipt?.blockNumber,
      token_address ? token_address.toLowerCase() : undefined,
      to_address.toLowerCase(),
      user_id
    );

    res.json({
      success: true,
      tx_hash: tx.hash,
      status: 'confirmed',
      block_number: receipt?.blockNumber,
    });
  } catch (error) {
    console.error('[Transfer] Error:', error);
    res.status(500).json({ error: 'Transfer failed' });
  }
});

export default router;
