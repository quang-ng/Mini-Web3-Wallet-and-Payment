import dotenv from "dotenv";
import express, { Express, Request, Response } from "express";
import walletRouter from './routes/wallet'
import transactionRouter from './routes/transaction'
import eventListener from "./workers/eventListener";


dotenv.config();

import config from "./config";

const app: Express = express();

const PORT = config.port;

// Middleware
app.use(express.json());
app.use('/api/wallet', walletRouter)
app.use('/api/transaction', transactionRouter)

// Basic test route
app.get("/health", (req: Request, res: Response) => {
  res.json({ message: "Server is running!" });
});

// Start server
app.listen(PORT, async () => {
  console.log(`Server running on http://localhost:${PORT}`);

  await eventListener.startListening()
});
