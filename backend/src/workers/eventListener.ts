import transactionDb from "../db/transactionDb";
import contract from "../blockchain/contract";

class EventListener {
  async startListening() {
    try {
      console.log('[EventListener] ===== Starting Event Listener =====');
      console.log('[EventListener] Waiting for contract events...');

      contract.on("Deposit", async (user: string, amount: any, ...args: any[]) => {
        console.log('[EventListener] ===== DEPOSIT EVENT DETECTED =====');
        console.log('[EventListener] User:', user);
        console.log('[EventListener] Amount (Wei):', amount.toString());
        console.log('[EventListener] Amount (ETH):', amount.toString() / 1e18);

        

        

        try {
          const txHash = "pending-" + Date.now();
          console.log('[EventListener] Saving to database with hash:', txHash);

          const blockNumber = args[0]?.log?.blockNumber || null;

          const result = await transactionDb.insertTransaction(
            txHash,
            user,
            amount.toString(),
            "deposit",
            "confirmed",
            blockNumber
          );

          console.log('[EventListener] ✅ Deposit saved successfully!');
          console.log('[EventListener] Saved data:', result);
        } catch (error) {
          console.error("[EventListener] ❌ Error saving deposit:", error);
        }
      });

      contract.on("Withdraw", async (user: string, amount: any) => {
        console.log('[EventListener] ===== WITHDRAW EVENT DETECTED =====');
        console.log('[EventListener] User:', user);
        console.log('[EventListener] Amount (Wei):', amount.toString());
        console.log('[EventListener] Amount (ETH):', amount.toString() / 1e18);

        try {
          const txHash = "pending-" + Date.now();
          console.log('[EventListener] Saving to database with hash:', txHash);

          const result = await transactionDb.insertTransaction(
            txHash,
            user,
            amount.toString(),
            "withdraw",
            "confirmed",
          );

          console.log('[EventListener] ✅ Withdraw saved successfully!');
          console.log('[EventListener] Saved data:', result);
        } catch (error) {
          console.error("[EventListener] ❌ Error saving withdraw:", error);
        }
      });

      console.log('[EventListener] ===== Event Listener Ready =====');
    } catch (error) {
      console.error("[EventListener] ❌ Error starting listener:", error);
      throw error;
    }
  }
}

export default new EventListener();
