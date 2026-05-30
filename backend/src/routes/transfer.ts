import { Router, Response } from 'express';
import { AuthRequest, authMiddleware } from '../auth/middleware';
import { decryptPrivateKey } from '../auth/encryption';
import userDb from '../db/userDb';
import transactionDb from '../db/transactionDb';
import { ethers } from 'ethers';
import config from '../config';
import { transferLimiter } from '../middleware/rateLimiter';
import logger from '../utils/logger';

const router = Router();

router.post('/', transferLimiter, authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { wallet_address, to_address, amount, token_address } = req.body;
    const user_id = req.user?.user_id;

    logger.debug('Transfer', 'Transfer request received', { user_id, wallet_address, to_address, amount, token_address });

    if (!user_id) {
      logger.warn('Transfer', 'Unauthorized transfer attempt - no user_id');
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!wallet_address || !to_address || !amount) {
      logger.warn('Transfer', 'Validation failed - missing required fields', { wallet_address, to_address, amount });
      return res.status(400).json({ error: 'wallet_address, to_address, and amount required' });
    }

    // Check if user owns this wallet
    logger.debug('Transfer', 'Checking wallet ownership', { user_id, wallet_address });
    const ownsWallet = await userDb.checkWalletOwnership(user_id, wallet_address);
    if (!ownsWallet) {
      logger.warn('Transfer', 'User does not own wallet', { user_id, wallet_address });
      return res.status(403).json({ error: 'You do not own this wallet' });
    }

    // Get encrypted private key
    logger.debug('Transfer', 'Retrieving wallet from database', { wallet_address });
    const userWallet = await userDb.getWalletByAddress(wallet_address);
    if (!userWallet) {
      logger.warn('Transfer', 'Wallet not found', { wallet_address });
      return res.status(404).json({ error: 'Wallet not found' });
    }

    // Decrypt private key
    logger.debug('Transfer', 'Decrypting private key', { wallet_address });
    const privateKey = decryptPrivateKey(userWallet.encrypted_private_key);

    // Create signer and send transaction
    logger.debug('Transfer', 'Creating signer and connecting to RPC', { wallet_address });
    const provider = new ethers.JsonRpcProvider(config.rpcUrl);
    const signer = new ethers.Wallet(privateKey, provider);

    let tx;
    let amountInWei;
    if (token_address) {
      // ERC20 token transfer
      logger.info('Transfer', 'Sending ERC20 token transfer', { wallet_address, to_address, amount, token_address });
      const tokenAbi = ['function transfer(address to, uint256 amount) returns (bool)'];
      const tokenContract = new ethers.Contract(token_address, tokenAbi, signer);
      amountInWei = ethers.parseUnits(amount, 18)

      tx = await tokenContract.transfer(to_address.toLowerCase(), amountInWei);
    } else {
      // ETH transfer
      logger.info('Transfer', 'Sending ETH transfer', { wallet_address, to_address, amount });
      amountInWei = ethers.parseEther(amount)
      tx = await signer.sendTransaction({
        to: to_address.toLowerCase(),
        value: ethers.parseEther(amount),
      });
    }

    logger.debug('Transfer', 'Transaction sent, waiting for confirmation', { txHash: tx.hash });
    // Wait for confirmation
    const receipt = await tx.wait();
    logger.debug('Transfer', 'Transaction confirmed', { txHash: tx.hash, blockNumber: receipt?.blockNumber });

    // Record in database
    logger.debug('Transfer', 'Recording transaction in database', { txHash: tx.hash, user_id });
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

    logger.info('Transfer', 'Transfer completed successfully', { txHash: tx.hash, user_id });
    res.json({
      success: true,
      tx_hash: tx.hash,
      status: 'confirmed',
      block_number: receipt?.blockNumber,
    });
  } catch (error) {
    logger.error('Transfer', 'Transfer failed:', error);
    res.status(500).json({ error: 'Transfer failed' });
  }
});

export default router;
