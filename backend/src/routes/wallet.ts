import express, { Request, Response } from "express";

import walletService from "../services/walletService";

const router = express.Router();

router.get("/info", async (req: Request, res: Response) => {
  try {
    console.log('[WalletRoute] GET /info called');
    const address = await walletService.getSignerAddress();
    console.log('[WalletRoute] Got address:', address);
    const balance = await walletService.getBalance(address);
    console.log('[WalletRoute] Got balance:', balance);
    const network = await walletService.getNetworkInfo();
    console.log('[WalletRoute] Got network:', network);

    const response = {
      address: String(address),
      balance: String(balance),
      network,
    };
    console.log('[WalletRoute] Sending response:', response);
    res.json(response);
  } catch (error) {
    console.error('[WalletRoute] Error:', error);
    res.status(500).json({ error: String(error) });
  }
});

router.get("/balance/:address", async (req: Request, res: Response) => {
  try {
    const address = req.params.address as string;
    console.log('[WalletRoute] GET /balance/:address called with:', address);
    const balance = await walletService.getBalance(address);
    console.log('[WalletRoute] Got balance:', balance);
    const response = { address, balance };
    console.log('[WalletRoute] Sending balance response:', response);
    res.json(response);
  } catch (error) {
    console.error('[WalletRoute] Error:', error);
    res.status(500).json({ error: String(error) });
  }
});
export default router;
