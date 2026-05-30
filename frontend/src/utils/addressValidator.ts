import { ethers } from 'ethers';

export interface AddressValidation {
  isValid: boolean;
  error?: string;
}

export function validateAddress(address: string): AddressValidation {
  if (!address) {
    return { isValid: false, error: 'Address is required' };
  }

  if (address.length !== 42) {
    return { isValid: false, error: 'Address must be 42 characters' };
  }

  if (!address.startsWith('0x')) {
    return { isValid: false, error: 'Address must start with 0x' };
  }

  try {
    const checksum = ethers.getAddress(address);
    return { isValid: true };
  } catch (error) {
    return { isValid: false, error: 'Invalid Ethereum address format' };
  }
}

export function shortenAddress(address: string): string {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}
