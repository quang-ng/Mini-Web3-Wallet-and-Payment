export interface Token {
  name: string;
  symbol: string;
  address: string;
  decimals: number;
  logo?: string;
}

export const TOKENS: Token[] = [
  {
    name: 'Simple Token',
    symbol: 'SIMPLE',
    address: '0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9',
    decimals: 18,
  },
];

export function getTokenByAddress(address: string): Token | undefined {
  return TOKENS.find(t => t.address.toLowerCase() === address.toLowerCase());
}

export function getTokenBySymbol(symbol: string): Token | undefined {
  return TOKENS.find(t => t.symbol.toUpperCase() === symbol.toUpperCase());
}
