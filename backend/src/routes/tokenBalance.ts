import express, { Request, Response } from "express";
import transactionDb from "../db/transactionDb";
import { tokenContract } from "../blockchain/contract";
import config from "../config";

const router = express.Router();

router.get("/:address/tokens", async (req: Request, res: Response) => {
  const address = req.params.address as string;
  const { fromBlockchain } = req.query;

  try {
    if (fromBlockchain == "true") {
      const balance = await tokenContract.balanceOf(address);
      return res.json({
        address,
        token: config.simpleTokenAddress,
        balance: balance.toString(),
        source: "blockchain",
      });
    } else {
      const balance = await transactionDb.getTokenBalance(
        address.toLowerCase(),
        config.simpleTokenAddress,
      );
      return res.json({
        address,
        token: config.simpleTokenAddress,
        balance: balance.toString(),
        source: "database",
      });
    }
  } catch (error) {
    console.error("[TokenBalance] Error:", error);
    res.status(500).json({ error: String(error) });
  }
});

// GET /api/balances/tokens/history
router.get("/tokens/history", async (req, res) => {
  const { address, token } = req.query;

  if (!address) {
    return res.status(400).json({ error: "address parameter required" });
  }

  try {
    const normalizedAddress = (address as string).toLowerCase();
    const normalizedToken = token ? (token as string).toLowerCase() : undefined;

    const transactions = await transactionDb.getTokenTransactions(
      normalizedAddress,
      normalizedToken,
    );

    res.json({
      address: normalizedAddress,
      token: normalizedToken || "all",
      transactions,
    });
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
});

export default router;
