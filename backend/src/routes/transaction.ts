import express, { Request, Response } from "express";
import transactionService from "../services/transactionService";
import transactionDb from "../db/transactionDb";
import { validateAmount, validateAddress, ValidationError } from "../utils/validator";

const router = express.Router();

router.post("/deposit", async (req: Request, res: Response) => {
  try {
    const { amount } = req.body;

    if (!amount) {
      return res.status(400).json({ error: "Amount is required" });
    }

    // Validate amount
    console.log("FFFF333: ", amount)
    const validAmount = validateAmount(amount);
    console.log("FFFF: ", validAmount)

    const result = await transactionService.deposit(validAmount);
    res.json(result);
  } catch (error) {
    console.log("EEEE:", error)
    if (error instanceof ValidationError) {
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: String(error) });
  }
});

router.post("/withdraw", async (req: Request, res: Response) => {
  try {
    const { amount } = req.body;

    if (!amount) {
      return res.status(400).json({ error: "Amount is required" });
    }

    // Validate amount
    const validAmount = validateAmount(amount);

    const result = await transactionService.withdraw(validAmount);
    res.json(result);
  } catch (error) {
    if (error instanceof ValidationError) {
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: String(error) });
  }
});

router.get("/history/:address", async (req: Request, res: Response) => {
  try {
    const rawAddress = req.params.address as string;

    // Validate and normalize address
    const address = validateAddress(rawAddress);

    const transacations = await transactionDb.getTransactionsByAddress(address);
    res.json({
      address,
      count: transacations.length,
      transacations,
    });
  } catch (err) {
    if (err instanceof ValidationError) {
      return res.status(400).json({ error: err.message });
    }
    res.status(500).json({ error: String(err) });
  }
});

router.get("/all", async (req: Request, res: Response) => {
  try {
    const transacations = await transactionDb.getAllTransactions();
    res.json({
      count: transacations.length,
      transacations,
    });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

export default router;
