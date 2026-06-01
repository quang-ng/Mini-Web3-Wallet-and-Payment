import {ethers} from 'ethers';
import { signer } from './provider';
import PAYMENT_VAULT_ABI from './abi';
import config from '../config';
import SIMPLE_TOKEN_ABI from './tokenAbi';


const paymentVaultcontract = new ethers.Contract(
    config.paymentVaultContractAddress,
    PAYMENT_VAULT_ABI,
    signer
)

const simpleTokenContract = new ethers.Contract(
    config.simpleTokenAddress,
    SIMPLE_TOKEN_ABI,
    signer
)

export default paymentVaultcontract;
export {simpleTokenContract as tokenContract}