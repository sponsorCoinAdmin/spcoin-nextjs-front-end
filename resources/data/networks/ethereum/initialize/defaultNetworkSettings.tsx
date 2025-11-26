// File: @/resources/data/networks/ethereum/initialize/defaultNetworkSettings.ts

import type { TokenContract } from '@/lib/structure';
import { CHAIN_ID } from '@/lib/structure';
import type { Address } from 'viem';
import { getTokenLogoURL } from '@/lib/context/helpers/assetHelpers';

// ----------------------
// Default Sell Token
// ----------------------
const defaultSellToken: TokenContract = {
  chainId: CHAIN_ID.ETHEREUM,
  address: '0x2260fac5e5542a773aa44fbcfedf7c193bc2c599',
  name: 'TONCOIN',
  symbol: 'TON',
  decimals: 9,
  balance: 0n,
  totalSupply: 0n,

  // ✅ Centralized — auto-uppercased, correct folder, correct structure
  logoURL: getTokenLogoURL({
    chainId: CHAIN_ID.ETHEREUM,
    address: '0x2260fac5e5542a773aa44fbcfedf7c193bc2c599' as Address,
  }),

  amount: 0n,
};

// ----------------------
// Default Buy Token
// ----------------------
const defaultBuyToken: TokenContract = {
  chainId: CHAIN_ID.ETHEREUM,
  address: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
  name: 'Tether USD',
  symbol: 'USDT',
  decimals: 6,
  balance: 0n,
  totalSupply: 0n,

  // ✅ Centralized — auto-uppercased
  logoURL: getTokenLogoURL({
    chainId: CHAIN_ID.ETHEREUM,
    address: '0xdAC17F958D2ee523a2206206994597C13D831ec7' as Address,
  }),

  amount: 0n,
};

// ----------------------
// Recipient (non-token)
// ----------------------
const defaultRecipient = {
  symbol: 'SpCoin',
  address: '0xToDo_SpCoin.png', // ❗ This is NOT a real address; OK as static placeholder
  name: 'Sponsor Coin',
  url: 'ToDo add URL here',
  logoURL: '/assets/blockchains/0xToDo_SpCoin.png', // left unchanged — not a token folder
};

// ----------------------
// Agent (non-token)
// ----------------------
const defaultAgent = {
  symbol: 'Wilma',
  address: "Wilma Flintstone's Wallet Address",
  name: 'Wilma Flintstone',
  url: 'ToDo add URL here',
  logoURL: '/assets/agents/WilmaFlintstone.png',
};

// ----------------------
const defaultNetworkSettings = {
  defaultSellToken,
  defaultBuyToken,
  defaultRecipient,
  defaultAgent,
};

export { defaultNetworkSettings };
