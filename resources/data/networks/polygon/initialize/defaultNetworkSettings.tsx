// File: @/resources/data/networks/polygon/initialize/defaultNetworkSettings.tsx

import type { TokenContract } from '@/lib/structure';
import { CHAIN_ID } from '@/lib/structure';
import type { Address } from 'viem';
import { getTokenLogoURL } from '@/lib/context/helpers/assetHelpers';

const defaultSellToken: TokenContract = {
  chainId: CHAIN_ID.POLYGON,
  symbol: 'USDC',
  // ✅ Centralized token logo path (uses uppercase filesystem convention internally)
  logoURL: getTokenLogoURL({
    chainId: CHAIN_ID.POLYGON,
    address: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48' as Address,
  }),
  name: 'USD Coin Staked',
  address: '0x3c499c542cef5e3811e1192ce70d8cc03d5c3359', // stays lowercased as an EVM address
  totalSupply: 0n,
  balance: 0n,
  decimals: 6,
  amount: 0n,
};

const defaultBuyToken: TokenContract = {
  chainId: CHAIN_ID.POLYGON,
  symbol: 'SpCoin',
  // ✅ Centralized token logo path for SpCoin as well
  logoURL: getTokenLogoURL({
    chainId: CHAIN_ID.POLYGON,
    address: '0xc2816250c07ae56c1583e5f2b0e67f7d7f42d562' as Address,
  }),
  name: 'Sponsor Coin',
  address: '0xc2816250c07ae56c1583e5f2b0e67f7d7f42d562', // EVM address, case left as-is
  totalSupply: 0n,
  balance: 0n,
  decimals: 18,
  amount: 0n,
};

const defaultRecipient = {
  symbol: 'Trees',
  logoURL: '/assets/recipients/SaveTheTrees.png',
  name: 'Save The Trees',
  address: 'Save The Trees Wallet Address',
  url: 'ToDo N/A',
};

const defaultAgent = {
  symbol: 'Tweety',
  logoURL: '/assets/agents/TweetyBird.png',
  name: 'Tweety Bird',
  address: "TweetyBird's Wallet Address",
  url: 'ToDo N/A',
};

const defaultNetworkSettings = {
  defaultSellToken,
  defaultBuyToken,
  defaultRecipient,
  defaultAgent,
};

export { defaultNetworkSettings };
