import { ethers } from "ethers";

export class ValidationError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "ValidationError";
    }
}

export function validateAddress(address: string): string {
    try {
        return ethers.getAddress(address);
    } catch (error) {
        throw new ValidationError(`Invalid address: ${address}`);
    }
}

export function validateAmount(amount: string): string {
    const parsed = parseFloat(amount);
    if (isNaN(parsed)) {
        throw new ValidationError(`Amount must be a valid number`);
    }

    if (parsed <= 0) {
        throw new ValidationError(`Amnut must be positive`);
    }

    // Must be within reasonable range (0.001 to 10000 ETH)
    if (parsed < 0.001) {
        throw new ValidationError("Minimum amount is 0.001 ETH");
    }

    if (parsed > 10000) {
        throw new ValidationError("Maximum amount is 10000 ETH");
    }

    try {
        ethers.parseEther(amount);

        return amount;
    } catch (error) {
        console.log("ee: ", error);
        throw new ValidationError(`Invalid amount: ${amount}`);
    }
}
