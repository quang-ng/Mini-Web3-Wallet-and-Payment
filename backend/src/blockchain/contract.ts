import {ethers} from 'ethers';
import { signer } from './provider';
import PAYMENT_VAULT_ABI from './abi';
import config from '../config';


const contract = new ethers.Contract(
    config.contractAddress,
    PAYMENT_VAULT_ABI,
    signer
)

export default contract;