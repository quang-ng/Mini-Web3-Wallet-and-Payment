import { Router, Response } from "express";
import { AuthRequest, authMiddleware } from "../auth/middleware";
import { encryptPrivateKey } from "../auth/encryption";
import userDb from "../db/userDb";
import { ethers } from "ethers";
import paymentVaultcontract from "../blockchain/contract";
import config from "../config";

const router = Router();

console.log("[Wallet] Router initialized");

// Log all requests to this router
router.use((req, res, next) => {
  console.log(`[Wallet] Incoming request: ${req.method} ${req.path}`);
  next();
});

router.post(
  "/create",
  authMiddleware,
  async (req: AuthRequest, res: Response) => {
    try {
      const { label } = req.body;
      const user_id = req.user?.user_id;

      if (!user_id) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      // Generate new wallet
      const newWallet = ethers.Wallet.createRandom();
      const walletAddress = newWallet.address.toLowerCase();
      const privateKey = newWallet.privateKey;

      // Encrypt private key before storing
      const encryptedKey = encryptPrivateKey(privateKey);

      // Store in database
      const userWallet = await userDb.addWallet(
        user_id,
        walletAddress,
        encryptedKey,
        label || "New Wallet",
      );

      await paymentVaultcontract.registerAccount(walletAddress);

      res.json({
        success: true,
        wallet: {
          id: userWallet.id,
          wallet_address: userWallet.wallet_address,
          label: userWallet.label,
        },
      });
    } catch (error) {
      console.error("[Wallet] Create error:", error);
      res.status(500).json({ error: "Failed to create wallet" });
    }
  },
);

router.post(
  "/import",
  authMiddleware,
  async (req: AuthRequest, res: Response) => {
    try {
      const { private_key, label } = req.body;
      const user_id = req.user?.user_id;

      if (!user_id) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      if (!private_key) {
        return res.status(400).json({ error: "Private key required" });
      }

      // Derive wallet address from private key
      let walletAddress: string;
      try {
        const wallet = new ethers.Wallet(private_key);
        walletAddress = wallet.address.toLowerCase();
      } catch (error) {
        return res.status(400).json({ error: "Invalid private key" });
      }

      // Encrypt private key before storing
      const encryptedKey = encryptPrivateKey(private_key);

      // Store in database
      const userWallet = await userDb.addWallet(
        user_id,
        walletAddress,
        encryptedKey,
        label,
      );

      await paymentVaultcontract.registerAccount(walletAddress);

      res.json({
        success: true,
        wallet: {
          id: userWallet.id,
          wallet_address: userWallet.wallet_address,
          label: userWallet.label,
        },
      });
    } catch (error) {
      console.error("[Wallet] Import error:", error);
      res.status(500).json({ error: "Failed to import wallet" });
    }
  },
);

router.get("/list", authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const user_id = req.user?.user_id;
    console.log(`[Wallet] /list endpoint called for user_id: ${user_id}`);

    if (!user_id) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const wallets = await userDb.getUserWallets(user_id);

    const walletsWithBalance = await Promise.all(
      wallets.map(async (w) => {
        console.log(`[Wallet] Processing wallet: ${w.wallet_address}`);
        const ethBalance = await paymentVaultcontract.getBalance(w.wallet_address);
        const simpleTokenBalance = await paymentVaultcontract.getTokenBalance(w.wallet_address, config.simpleTokenAddress)
        const result = {
          id: w.id,
          wallet_address: w.wallet_address,
          label: w.label,
          added_at: w.added_at,
          "ETH": ethBalance.toString(),
          "SIMPLE": simpleTokenBalance.toString(),
        };
        console.log(`[Wallet] Processed wallet result:`, result);
        return result;
      }),
    );

    console.log(
      `[Wallet] Returning ${walletsWithBalance.length} wallets with balance`,
    );
    res.json({
      success: true,
      wallets: walletsWithBalance,
    });
  } catch (error) {
    console.error("[Wallet] List error:", error);
    res.status(500).json({ error: "Failed to list wallets" });
  }
});

export default router;
