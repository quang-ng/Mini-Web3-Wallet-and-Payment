import { ethers } from "ethers";
import paymentVaultcontract from "../blockchain/contract";

class TransactionService {
  async deposit(amount: string) {
    try {
      const amountWei = ethers.parseEther(amount);
      const tx = await paymentVaultcontract.deposit({ value: amountWei });

      const receipt = await tx.wait();

      return {
        hash: tx.hash,
        amount: amount,
        status: "success",
      };
    } catch (error) {
      throw new Error(`Deposite failed ${error}`);
    }
  }

  async withdraw(amount: string) {
    try {
      const amountWei = ethers.parseEther(amount);
      const tx = await paymentVaultcontract.withdraw(amountWei);
      const receipt = await tx.wait();

      return {
        hash: tx.hash,
        amount: amount,
        status: "success",
      };
    } catch (error) {
      throw new Error(`Deposite failed ${error}`);
    }
  }
}

export default new TransactionService();
