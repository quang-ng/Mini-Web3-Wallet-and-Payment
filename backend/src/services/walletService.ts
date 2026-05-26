import {ethers} from 'ethers'
import contract from '../blockchain/contract'
import { provider, signer } from '../blockchain/provider'
import config from '../config';

class WalletService{
    async getBalance(userAddress: string): Promise<string> {
        try{
            console.log('[WalletService] Getting balance for:', userAddress);
            const balance = await contract.getBalance(userAddress);
            console.log('[WalletService] Raw balance:', balance, 'Type:', typeof balance);
            const balanceStr = ethers.formatEther(balance.toString());
            console.log('[WalletService] Formatted balance:', balanceStr);
            return balanceStr
        } catch (error) {
            console.error('[WalletService] Error in getBalance:', error);
            throw new Error(`Failed to get balance ${error}`)
        }
    }

    async getSignerAddress(): Promise<string> {
        try {
            console.log('[WalletService] Getting signer address...');
            const address = await signer.getAddress();
            console.log('[WalletService] Signer address:', address);
            return address;
        } catch (error) {
            console.error('[WalletService] Error in getSignerAddress:', error);
            throw error;
        }
    }

    async getNetworkInfo() {
        try {
            console.log('[WalletService] Getting network info...');
            const network = await provider.getNetwork()
            console.log('[WalletService] Network object:', network);
            const result = {
                name: network.name,
                chainId: network.chainId.toString(),
                url: config.rpcUrl
            }
            console.log('[WalletService] Network info result:', result);
            return result
        } catch (error) {
            console.error('[WalletService] Error in getNetworkInfo:', error);
            throw error;
        }
    }
}

export default new WalletService();