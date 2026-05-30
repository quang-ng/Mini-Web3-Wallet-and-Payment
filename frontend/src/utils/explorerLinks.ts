const ETHERSCAN_BASE = 'https://etherscan.io';

export const explorerLinks = {
  tx: (hash: string) => `${ETHERSCAN_BASE}/tx/${hash}`,
  address: (address: string) => `${ETHERSCAN_BASE}/address/${address}`,
  token: (tokenAddress: string) => `${ETHERSCAN_BASE}/token/${tokenAddress}`,
  block: (blockNumber: number) => `${ETHERSCAN_BASE}/block/${blockNumber}`,
};
