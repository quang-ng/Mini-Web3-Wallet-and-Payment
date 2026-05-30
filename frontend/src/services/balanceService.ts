import { ethers } from 'ethers';

const RPC_URL = 'http://localhost:8545';

export async function getETHBalance(address: string): Promise<string> {
  try {
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const balance = await provider.getBalance(address);
    return ethers.formatEther(balance);
  } catch (error) {
    console.error('[BalanceService] Error fetching ETH balance:', error);
    return '0';
  }
}

export async function getTokenBalance(
  tokenAddress: string,
  walletAddress: string,
  decimals: number = 18
): Promise<string> {
  try {
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const erc20Abi = ['function balanceOf(address account) view returns (uint256)'];
    const contract = new ethers.Contract(tokenAddress, erc20Abi, provider);
    const balance = await contract.balanceOf(walletAddress);
    return ethers.formatUnits(balance, decimals);
  } catch (error) {
    console.error('[BalanceService] Error fetching token balance:', error);
    return '0';
  }
}
