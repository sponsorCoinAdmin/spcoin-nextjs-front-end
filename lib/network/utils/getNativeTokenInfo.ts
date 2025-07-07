// File: lib/network/utils/getNativeTokenInfo.ts

import { ETHEREUM, POLYGON, BASE, SEPOLIA, HARDHAT } from "@/lib/structure";

export function getNativeTokenInfo(chainId: number): {
  symbol: string;
  name: string;
  decimals: number;
  totalSupply: bigint;
} {
  switch (chainId) {
    case ETHEREUM:
      return { symbol: 'ETH', name: 'Ethereum', decimals: 18, totalSupply: 0n };
    case POLYGON:
      return { symbol: 'MATIC', name: 'Polygon', decimals: 18, totalSupply: 0n };
    case BASE:
      return { symbol: 'ETH', name: 'Base ETH', decimals: 18, totalSupply: 0n };
    case SEPOLIA:
      return { symbol: 'SEP', name: 'Sepolia ETH', decimals: 18, totalSupply: 0n };
    case HARDHAT:
      return { symbol: 'ETH', name: 'Hardhat ETH', decimals: 18, totalSupply: 0n };
    default:
      return { symbol: 'ETH', name: 'Unknown Native Token', decimals: 18, totalSupply: 0n };
  }
}
