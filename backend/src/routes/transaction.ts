import express, { Request, Response } from "express";
import transactionService from "../services/transactionService";
import transactionDb from "../db/transactionDb";

const router = express.Router();

router.post("/deposit", async (req: Request, res: Response) => {
  try {
    const { amount } = req.body;

    if (!amount) {
      return res.status(400).json({ error: "Amount is required" });
    }

    const result = await transactionService.deposit(amount);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
});

router.post("/withdraw", async (req: Request, res: Response) => {
  try {
    const { amount } = req.body;

    if (!amount) {
      return res.status(400).json({ error: "Amount is required" });
    }

    const result = await transactionService.withdraw(amount);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
});

router.get("/history/:address", async (req: Request, res: Response) => {
  try {
    const address = req.params.address as string;
    const transacations = await transactionDb.getTransactionsByAddress(address);
    res.json({
      address,
      count: transacations.length,
      transacations,
    });
  } catch (err) {
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
