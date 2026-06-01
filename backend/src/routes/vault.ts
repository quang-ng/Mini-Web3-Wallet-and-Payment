import { Router, Response } from "express";
import { AuthRequest, authMiddleware } from "../auth/middleware";
import { decryptPrivateKey } from "../auth/encryption";
import userDb from "../db/userDb";
import transactionDb from "../db/transactionDb";
import { ethers } from "ethers";
import config from "../config";
import PAYMENT_VAULT_ABI from "../blockchain/abi";
import logger from "../utils/logger";
import { provider } from "../blockchain/provider";

const router = Router();

async function validateAndGetWallet(
  user_id: number,
  from_address: string,
  symbol: string,
  res: Response,
) {
  if (symbol !== "ETH" && symbol !== "SIMPLE") {
    res.status(400).json({ error: "Symbol must be ETH or SIMPLE" });
    return null;
  }

  const userWallets = await userDb.getUserWallets(user_id);
  if (!userWallets || userWallets.length === 0) {
    res.status(404).json({ error: "No wallet found for user" });
    return null;
  }

  const userWallet = userWallets.find(
    (w) => w.wallet_address.toLowerCase() === from_address.toLowerCase(),
  );
  if (!userWallet) {
    res.status(404).json({ error: "Wallet not found for user" });
    return null;
  }

  return userWallet;
}

// Deposit ETH or Token into vault
router.post(
  "/deposit",
  authMiddleware,
  async (req: AuthRequest, res: Response) => {
    try {
      const { amount, symbol, wallet_address: from_address } = req.body;
      const user_id = req.user?.user_id;

      logger.debug("Vault", "Deposit request", {
        user_id,
        amount,
        symbol,
        wallet_address: from_address,
      });

      if (!user_id) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      if (!amount || !symbol) {
        return res
          .status(400)
          .json({ error: "Amount and symbol are required" });
      }

      if (!from_address) {
        return res.status(400).json({ error: "wallet_address is required" });
      }

      const userWallet = await validateAndGetWallet(
        user_id,
        from_address,
        symbol,
        res,
      );
      if (!userWallet) {
        return;
      }

      const wallet_address = userWallet.wallet_address;

      // Decrypt private key
      const privateKey = decryptPrivateKey(userWallet.encrypted_private_key);
      const provider = new ethers.JsonRpcProvider(config.rpcUrl);
      const signer = new ethers.Wallet(privateKey, provider);

      // Create vault contract instance
      const vaultContract = new ethers.Contract(
        config.paymentVaultContractAddress,
        PAYMENT_VAULT_ABI,
        signer,
      );

      let tx;
      let amountInWei;

      if (symbol === "ETH") {
        // Deposit ETH
        logger.info("Vault", "Depositing ETH into vault", {
          wallet_address,
          amount,
        });
        amountInWei = ethers.parseEther(amount);

        tx = await vaultContract.deposit({ value: amountInWei });
      } else {
        // Deposit SIMPLE Token
        logger.info("Vault", "Depositing SIMPLE token into vault", {
          wallet_address,
          amount,
        });
        amountInWei = ethers.parseUnits(amount, 18);

        // First, approve the vault to spend tokens
        const tokenContract = new ethers.Contract(
          config.simpleTokenAddress,
          ["function approve(address spender, uint256 amount) returns (bool)"],
          signer,
        );

        logger.debug("Vault", "Approving vault to spend tokens", {
          vault: config.paymentVaultContractAddress,
          amount: amountInWei.toString(),
        });

        // Get current nonce for explicit nonce management
        const nonce = await provider.getTransactionCount(signer.address, "pending");

        const approveTx = await tokenContract.approve(
          config.paymentVaultContractAddress,
          amountInWei,
          { nonce },
        );
        const approveReceipt = await approveTx.wait();

        logger.debug("Vault", "Approval confirmed", {
          txHash: approveTx.hash,
          blockNumber: approveReceipt?.blockNumber,
        });

        tx = await vaultContract.depositToken(
          config.simpleTokenAddress.toLowerCase(),
          amountInWei,
          { nonce: nonce + 1 },
        );
      }

      logger.debug("Vault", "Deposit transaction sent", { txHash: tx.hash });
      const receipt = await tx.wait();
      logger.debug("Vault", "Deposit confirmed", {
        txHash: tx.hash,
        blockNumber: receipt?.blockNumber,
      });

      // Record in database
      await transactionDb.insertTransaction(
        tx.hash,
        wallet_address.toLowerCase(),
        amountInWei.toString(),
        "deposit",
        "confirmed",
        receipt?.blockNumber,
        symbol,
        config.paymentVaultContractAddress.toLocaleLowerCase(),
        user_id,
      );

      logger.info("Vault", "Deposit completed", {
        txHash: tx.hash,
        user_id,
        symbol,
      });
      res.json({
        success: true,
        tx_hash: tx.hash,
        status: "confirmed",
        block_number: receipt?.blockNumber,
        message: `Successfully deposited ${amount} ${symbol} into vault`,
      });
    } catch (error) {
      logger.error("Vault", "Deposit failed", error);
      res.status(500).json({ error: "Deposit failed" });
    }
  },
);

// Transfer ETH or Token within vault
router.post(
  "/transfer",
  authMiddleware,
  async (req: AuthRequest, res: Response) => {
    try {
      const {
        to_address,
        amount,
        symbol,
        wallet_address: from_address,
      } = req.body;
      const user_id = req.user?.user_id;

      logger.debug("Vault", "Transfer request", {
        user_id,
        to_address,
        amount,
        symbol,
        wallet_address: from_address,
      });

      if (!user_id) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      if (!to_address || !amount || !symbol) {
        return res
          .status(400)
          .json({ error: "to_address, amount, and symbol are required" });
      }

      if (!from_address) {
        return res.status(400).json({ error: "wallet_address is required" });
      }

      const userWallet = await validateAndGetWallet(
        user_id,
        from_address,
        symbol,
        res,
      );
      if (!userWallet) {
        return;
      }

      const wallet_address = userWallet.wallet_address;

      // Decrypt private key
      const privateKey = decryptPrivateKey(userWallet.encrypted_private_key);
      const provider = new ethers.JsonRpcProvider(config.rpcUrl);
      const signer = new ethers.Wallet(privateKey, provider);

      // Create vault contract instance
      const vaultContract = new ethers.Contract(
        config.paymentVaultContractAddress,
        PAYMENT_VAULT_ABI,
        signer,
      );

      let tx;
      let amountInWei;

      if (symbol === "ETH") {
        // Transfer ETH within vault
        logger.info("Vault", "Transferring ETH within vault", {
          wallet_address,
          to_address,
          amount,
        });
        amountInWei = ethers.parseEther(amount);

        tx = await vaultContract.transferETH(
          to_address.toLowerCase(),
          amountInWei,
        );
      } else {
        // Transfer SIMPLE Token within vault
        logger.info("Vault", "Transferring SIMPLE token within vault", {
          wallet_address,
          to_address,
          amount,
        });
        amountInWei = ethers.parseUnits(amount, 18);

        tx = await vaultContract.transferToken(
          config.simpleTokenAddress.toLowerCase(),
          to_address.toLowerCase(),
          amountInWei,
        );
      }

      logger.debug("Vault", "Transfer transaction sent", { txHash: tx.hash });
      const receipt = await tx.wait();
      logger.debug("Vault", "Transfer confirmed", {
        txHash: tx.hash,
        blockNumber: receipt?.blockNumber,
      });

      // Record in database
      await transactionDb.insertTransaction(
        tx.hash,
        wallet_address.toLowerCase(),
        amountInWei.toString(),
        "transfer",
        "confirmed",
        receipt?.blockNumber,
        symbol,
        to_address.toLowerCase(),
        user_id,
      );

      logger.info("Vault", "Transfer completed", {
        txHash: tx.hash,
        user_id,
        symbol,
      });
      res.json({
        success: true,
        tx_hash: tx.hash,
        status: "confirmed",
        block_number: receipt?.blockNumber,
        message: `Successfully transferred ${amount} ${symbol} to ${to_address}`,
      });
    } catch (error) {
      logger.error("Vault", "Transfer failed", error);
      res.status(500).json({ error: "Transfer failed" });
    }
  },
);

// Withdraw ETH or Token from vault
router.post(
  "/withdraw",
  authMiddleware,
  async (req: AuthRequest, res: Response) => {
    try {
      const { amount, symbol, wallet_address: from_address } = req.body;
      const user_id = req.user?.user_id;

      logger.debug("Vault", "Withdraw request", {
        user_id,
        amount,
        symbol,
        wallet_address: from_address,
      });

      if (!user_id) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      if (!amount || !symbol) {
        return res
          .status(400)
          .json({ error: "Amount and symbol are required" });
      }

      if (!from_address) {
        return res.status(400).json({ error: "wallet_address is required" });
      }

      const userWallet = await validateAndGetWallet(
        user_id,
        from_address,
        symbol,
        res,
      );
      if (!userWallet) {
        return;
      }

      const wallet_address = userWallet.wallet_address;

      // Decrypt private key
      const privateKey = decryptPrivateKey(userWallet.encrypted_private_key);
      const provider = new ethers.JsonRpcProvider(config.rpcUrl);
      const signer = new ethers.Wallet(privateKey, provider);

      // Create vault contract instance
      const vaultContract = new ethers.Contract(
        config.paymentVaultContractAddress,
        PAYMENT_VAULT_ABI,
        signer,
      );

      let tx;
      let amountInWei;

      if (symbol === "ETH") {
        // Withdraw ETH
        logger.info("Vault", "Withdrawing ETH from vault", {
          wallet_address,
          amount,
        });
        amountInWei = ethers.parseEther(amount);
        tx = await vaultContract.withdraw(amountInWei);
      } else {
        // Withdraw SIMPLE Token
        logger.info("Vault", "Withdrawing SIMPLE token from vault", {
          wallet_address,
          amount,
        });
        amountInWei = ethers.parseUnits(amount, 18);
        tx = await vaultContract.withdrawToken(
          config.simpleTokenAddress.toLowerCase(),
          amountInWei,
        );
      }

      logger.debug("Vault", "Withdraw transaction sent", { txHash: tx.hash });
      const receipt = await tx.wait();
      logger.debug("Vault", "Withdraw confirmed", {
        txHash: tx.hash,
        blockNumber: receipt?.blockNumber,
      });

      // Record in database
      await transactionDb.insertTransaction(
        tx.hash,
        config.paymentVaultContractAddress,
        amountInWei.toString(),
        "withdraw",
        "confirmed",
        receipt?.blockNumber,
        symbol,
        wallet_address.toLowerCase(),
        user_id,
      );

      logger.info("Vault", "Withdrawal completed", {
        txHash: tx.hash,
        user_id,
        symbol,
      });
      res.json({
        success: true,
        tx_hash: tx.hash,
        status: "confirmed",
        block_number: receipt?.blockNumber,
        message: `Successfully withdrew ${amount} ${symbol} from vault`,
      });
    } catch (error) {
      logger.error("Vault", "Withdrawal failed", error);
      res.status(500).json({ error: "Withdrawal failed" });
    }
  },
);

export default router;
