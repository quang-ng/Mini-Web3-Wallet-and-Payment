import {ethers} from 'ethers';
import { signer } from './provider';
import PAYMENT_VAULT_ABI from './abi';
import config from '../config';
import SIMPLE_TOKEN_ABI from './tokenAbi';


const contract = new ethers.Contract(
    config.contractAddress,
    PAYMENT_VAULT_ABI,
    signer
)

const tokenContract = new ethers.Contract(
    config.simpleTokenAddress,
    SIMPLE_TOKEN_ABI,
    signer
)

export default contract;
export {tokenContract}