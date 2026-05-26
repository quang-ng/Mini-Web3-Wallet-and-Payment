import { ethers } from "ethers";
import contract from "../blockchain/contract";

class TransactionService {
  async deposit(amount: string) {
    try {
      const amountWei = ethers.parseEther(amount);
      const tx = await contract.deposit({ value: amountWei });

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
      const tx = await contract.withdraw(amountWei);
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
