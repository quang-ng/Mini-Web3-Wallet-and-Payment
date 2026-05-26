import express, { Request, Response } from "express";
import transactionService from "../services/transactionService";

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

export default router;
