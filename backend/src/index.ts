import dotenv from "dotenv";
import express, { Express, Request, Response } from "express";
import cors from "cors";
import eventListener from "./workers/eventListener";
import authRouter from "./routes/auth"
import vaultRouter from "./routes/vault"
import walletRouter from "./routes/wallets"
import transactionRouter from "./routes/transactions"



dotenv.config();

import config from "./config";
import syncService from "./services/syncService";

const app: Express = express();

const PORT = config.port;

// Middleware
app.use(cors({
  origin: ['http://localhost:3001', 'http://localhost:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use("/api/auth", authRouter);
app.use("/api/vault", vaultRouter);
app.use("/api/wallet", walletRouter);
app.use("/api/transactions", transactionRouter);
// app.use("/api/auth-wallets", authWalletsRouter)
// app.use("/api/auth-transfer", authTransferRouter);

// app.use("/api/wallet", walletRouter);
// app.use("/api/transaction", transactionRouter);
// app.use("/api/transactions", transactionRouter);
// app.use("/api/balances", tokenBalanceRouter);

// app.use("/api/transfer", transferRouter);
// app.use("/api/wallets", authWalletsRouter)

// Basic test route
app.get("/health", (req: Request, res: Response) => {
  res.json({ message: "Server is running!!!" });
});

// Start server
app.listen(PORT, async () => {
  console.log(`Server running on http://localhost:${PORT}`);

  // run inital sync
  try {
    await syncService.performInitialSync();
  } catch (error) {
    console.error(`Failed to async error: ${error}`);
  }

  await eventListener.startListening();
});