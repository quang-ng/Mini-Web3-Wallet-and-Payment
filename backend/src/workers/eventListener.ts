import transactionDb from "../db/transactionDb";
import paymentVaultcontract, { tokenContract } from "../blockchain/contract";
import config from "../config";

class EventListener {
  async startListening() {
    try {
      console.log("[EventListener] ===== Starting Event Listener =====");
      console.log("[EventListener] Waiting for contract events...");

      paymentVaultcontract.on(
        "Deposit",
        async (user: string, amount: any, ...args: any[]) => {
          console.log("[EventListener] ===== DEPOSIT EVENT DETECTED =====");
          console.log("[EventListener] User:", user);
          console.log("[EventListener] Amount (Wei):", amount.toString());

          const eventLog = args[args.length - 1];
          const txHash = eventLog.log.transactionHash;
          const blockNumber = eventLog.log.blockNumber;

          console.log("[EventListener] TX Hash:", txHash);
          console.log("[EventListener] blockNumber:", blockNumber);

          try {
            // Check for duplicates
            const exists = await transactionDb.transactionExists(txHash);
            if (exists) {
              console.log(
                "[EventListener] ⏭️  Deposit already in database, skipping",
              );
              return;
            }

            await transactionDb.insertTransaction(
              txHash,
              user,
              amount.toString(),
              "deposit",
              "confirmed",
              blockNumber,
            );

            await transactionDb.updateLastSyncedBlock(blockNumber, 1);

            console.log("[EventListener] ✅ Deposit saved successfully!");
          } catch (error) {
            console.error("[EventListener] ❌ Error saving deposit:", error);
          }
        },
      );

      paymentVaultcontract.on(
        "Withdraw",
        async (user: string, amount: any, ...args: any[]) => {
          console.log("[EventListener] ===== WITHDRAW EVENT DETECTED =====");
          console.log("[EventListener] User:", user);
          console.log("[EventListener] Amount (Wei):", amount.toString());
          console.log(
            "[EventListener] Amount (ETH):",
            amount.toString() / 1e18,
          );

          const eventLog = args[args.length - 1];
          const txHash = eventLog.log.transactionHash;
          const blockNumber = eventLog.log.blockNumber;

          console.log("[EventListener] TX Hash:", txHash);
          console.log("[EventListener] blockNumber:", blockNumber);

          try {
            // Check for duplicates
            const exists = await transactionDb.transactionExists(txHash);
            if (exists) {
              console.log(
                "[EventListener] ⏭️  Withdraw already in database, skipping",
              );
              return;
            }

            await transactionDb.insertTransaction(
              txHash,
              user,
              amount.toString(),
              "withdraw",
              "confirmed",
              blockNumber,
            );

            await transactionDb.updateLastSyncedBlock(blockNumber, 1);

            console.log("[EventListener] ✅ Withdraw saved successfully!");
          } catch (error) {
            console.error("[EventListener] ❌ Error saving withdraw:", error);
          }
        },
      );

      tokenContract.on(
        "Transfer",
        async (from: string, to: string, value: any, ...args: any[]) => {
          const eventLog = args[args.length - 1];
          const txHash = eventLog.log.transactionHash;
          const blockNumber = eventLog.log.blockNumber;

          try {
            const exists = await transactionDb.transactionExists(txHash);

            if (exists) {
              return;
            }

            await transactionDb.insertTransaction(
              txHash,
              from,
              value.toString(),
              "transfer",
              "confirmed",
              blockNumber,
              config.simpleTokenAddress,
              to.toLowerCase()
            );

            await transactionDb.updateLastSyncedBlock(blockNumber, 1);
            console.log("[EventListener] ✅ Transfer saved successfully!");
          } catch (error) {
            console.error(
              "[EventListener] Error to processing transfer ",
              error,
            );
          }
        },
      );

      console.log("[EventListener] ===== Event Listener Ready =====");
    } catch (error) {
      console.error("[EventListener] ❌ Error starting listener:", error);
      throw error;
    }
  }
}

export default new EventListener();
