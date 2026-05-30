import {ethers} from 'ethers'
import contract from '../blockchain/contract'
import { provider, signer } from '../blockchain/provider'
import config from '../config';
import logger from '../utils/logger';

class WalletService{
    async getBalance(userAddress: string): Promise<string> {
        try{
            logger.debug('WalletService', 'Getting balance for:', { userAddress });
            const balance = await contract.getBalance(userAddress);

            logger.debug('WalletService', 'Raw balance:', { balance, type: typeof balance });
            const balanceStr = ethers.formatEther(balance.toString());

            logger.debug('WalletService', 'Formatted balance:', { balanceStr });
            return balanceStr

        } catch (error) {
            logger.error('WalletService', 'Error in getBalance:', error);
            throw new Error(`Failed to get balance ${error}`)
        }
    }

    async getSignerAddress(): Promise<string> {
        try {
            logger.debug('WalletService', 'Getting signer address...');
            const address = await signer.getAddress();
            logger.debug('WalletService', 'Signer address:', { address });
            return address;
        } catch (error) {
            logger.error('WalletService', 'Error in getSignerAddress:', error);
            throw error;
        }
    }

    async getNetworkInfo() {
        try {
            logger.debug('WalletService', 'Getting network info...');
            const network = await provider.getNetwork()
            logger.debug('WalletService', 'Network object:', { network });
            const result = {
                name: network.name,
                chainId: network.chainId.toString(),
                url: config.rpcUrl
            }
            logger.debug('WalletService', 'Network info result:', { result });
            return result
        } catch (error) {
            logger.error('WalletService', 'Error in getNetworkInfo:', error);
            throw error;
        }
    }
}

export default new WalletService();