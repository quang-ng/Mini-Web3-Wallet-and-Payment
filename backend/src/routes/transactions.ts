import { Router, Response } from "express";
import { AuthRequest, authMiddleware } from "../auth/middleware";
import transactionDb from "../db/transactionDb";

const router = Router();

router.get("/history", authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const user_id = req.user?.user_id;

    if (!user_id) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const limit = parseInt(req.query.limit as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;

    const result = await transactionDb.getTransactionsByUserId(user_id, limit, offset);

    res.json({
      success: true,
      transactions: result.transactions,
      pagination: {
        total: result.total,
        limit: result.limit,
        offset: result.offset,
        hasMore: result.hasMore,
      },
    });
  } catch (error) {
    console.error("[Transactions] History error:", error);
    res.status(500).json({ error: "Failed to fetch transaction history" });
  }
});

export default router;
