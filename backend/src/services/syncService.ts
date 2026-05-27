import { ethers } from "ethers";
import contract from "../blockchain/contract";
import { provider } from "../blockchain/provider";
import transactionDb from "../db/transactionDb";

class SyncService {
  private readonly MAX_RETRIES = 3;
  private readonly RETRY_DELAY_MS = 1000;

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private async retryWithBackoff<T>(
    operation: () => Promise<T>,
    operationName: string
  ): Promise<T> {
    let lastError: any;

    for (let attempt = 1; attempt <= this.MAX_RETRIES; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;
        console.warn(
          `[SyncService] ${operationName} failed (attempt ${attempt}/${this.MAX_RETRIES}):`,
          error
        );

        if (attempt < this.MAX_RETRIES) {
          const delayMs = this.RETRY_DELAY_MS * Math.pow(2, attempt - 1);
          console.log(`[SyncService] Retrying in ${delayMs}ms...`);
          await this.sleep(delayMs);
        }
      }
    }

    throw lastError;
  }

  async performInitialSync(): Promise<void> {
    const startTime = Date.now();
    let totalSynced = 0;
    let lastBlockSynced = 0;
    let syncError: string | undefined;

    try {
      console.log("[SyncService] ===== Starting Initial Sync =====");

      const lastSyncedBlock = await this.retryWithBackoff(
        () => transactionDb.getLastSyncedBlock(),
        "Get last synced block"
      );

      const currentBlock = await this.retryWithBackoff(
        () => provider.getBlockNumber(),
        "Get current block"
      );

      lastBlockSynced = currentBlock;

      if (currentBlock <= lastSyncedBlock) {
        console.log("[SyncService] ✅ Already synced, no catch-up needed");
        return;
      }

      const blockGap = currentBlock - lastSyncedBlock;
      console.log(`[SyncService] Syncing ${blockGap} blocks...`);

      // Query Deposit events
      const depositEvents = await this.retryWithBackoff(
        () => contract.queryFilter(
          contract.filters.Deposit(),
          lastSyncedBlock + 1,
          currentBlock
        ),
        "Query Deposit events"
      );
      console.log(`[SyncService] Found ${depositEvents.length} Deposit events`);

      // Insert Deposit events
      for (const event of depositEvents) {
        try {
          const txHash = event.transactionHash;
          const userAddress = '0x' + event.topics[1].slice(-40);
          const amountWei = BigInt(event.data);
          const blockNumber = event.blockNumber;

          // Check for duplicates
          const exists = await transactionDb.transactionExists(txHash);
          if (exists) {
            console.log(`[SyncService] ⏭️  Deposit already synced, skipping:`, txHash);
            continue;
          }

          await transactionDb.insertTransaction(
            txHash,
            userAddress,
            amountWei.toString(),
            "deposit",
            "confirmed",
            blockNumber
          );
          totalSynced++;
          console.log(`[SyncService] ✅ Inserted Deposit from block ${blockNumber}`);
        } catch (error) {
          console.error("[SyncService] ❌ Error inserting deposit:", error);
        }
      }

      // Query Withdraw events
      const withdrawEvents = await this.retryWithBackoff(
        () => contract.queryFilter(
          contract.filters.Withdraw(),
          lastSyncedBlock + 1,
          currentBlock
        ),
        "Query Withdraw events"
      );
      console.log(`[SyncService] Found ${withdrawEvents.length} Withdraw events`);

      // Insert Withdraw events
      for (const event of withdrawEvents) {
        try {
          const txHash = event.transactionHash;
          const userAddress = '0x' + event.topics[1].slice(-40);
          const amountWei = BigInt(event.data);
          const blockNumber = event.blockNumber;

          // Check for duplicates
          const exists = await transactionDb.transactionExists(txHash);
          if (exists) {
            console.log(`[SyncService] ⏭️  Withdraw already synced, skipping:`, txHash);
            continue;
          }

          await transactionDb.insertTransaction(
            txHash,
            userAddress,
            amountWei.toString(),
            "withdraw",
            "confirmed",
            blockNumber
          );
          totalSynced++;
          console.log(`[SyncService] ✅ Inserted Withdraw from block ${blockNumber}`);
        } catch (error) {
          console.error("[SyncService] ❌ Error inserting withdraw:", error);
        }
      }

      // Update metadata with new synced block
      await this.retryWithBackoff(
        () => transactionDb.updateLastSyncedBlock(currentBlock, totalSynced),
        "Update metadata"
      );

      const duration = Date.now() - startTime;
      console.log(`[SyncService] ===== Sync Complete (${duration}ms) =====`);

      // Record success in history
      await transactionDb.recordSyncHistory(
        currentBlock,
        totalSynced,
        duration,
        "success"
      );

    } catch (error) {
      const duration = Date.now() - startTime;
      syncError = error instanceof Error ? error.message : String(error);
      console.error("[SyncService] ❌ Sync failed:", syncError);

      // Record failure in history
      try {
        await transactionDb.recordSyncHistory(
          lastBlockSynced,
          totalSynced,
          duration,
          "failed",
          syncError
        );
      } catch (historyError) {
        console.error("[SyncService] Failed to record sync history:", historyError);
      }

      throw error;
    }
  }
}

export default new SyncService();
