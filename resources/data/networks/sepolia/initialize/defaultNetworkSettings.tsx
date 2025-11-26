// File: @/resources/data/networks/sepolia/initialize/defaultNetworkSettings.tsx

import type { TokenContract } from '@/lib/structure';
import { CHAIN_ID } from '@/lib/structure';
import type { Address } from 'viem';
import { getTokenLogoURL } from '@/lib/context/helpers/assetHelpers';

const defaultSellToken: TokenContract = {
  chainId: CHAIN_ID.SEPOLIA,
  address: '0x536bcbe548cef2ce493932fefcec059dda4d5579',
  name: 'Wrapped Bitcoin',
  symbol: 'WBTC',
  decimals: 8,
  balance: 0n,
  totalSupply: 0n,
  // ✅ Centralized token logo path (uses uppercase filesystem convention internally)
  logoURL: getTokenLogoURL({
    chainId: CHAIN_ID.SEPOLIA,
    address: '0x536bcbe548cef2ce493932fefcec059dda4d5579' as Address,
  }),
  amount: 0n,
};

const defaultBuyToken: TokenContract = {
  chainId: CHAIN_ID.SEPOLIA,
  address: '0xadd8ad605fe57064903a3defc3b4ed676992bba6',
  name: 'Tether USD',
  symbol: 'USDT',
  decimals: 6,
  balance: 0n,
  totalSupply: 0n,
  // ✅ Centralized token logo path
  logoURL: getTokenLogoURL({
    chainId: CHAIN_ID.SEPOLIA,
    address: '0xadd8ad605fe57064903a3defc3b4ed676992bba6' as Address,
  }),
  amount: 0n,
};

const defaultRecipient = {
  address: 'SaveTheTiger4 Wallet Address',
  name: 'Support The Tiger',
  symbol: 'Tiger',
  url: 'ToDo N/A',
  logoURL: '/assets/recipients/SaveTheTiger4.png',
};

const defaultAgent = {
  address: "Moe's Wallet Address",
  symbol: 'Stuge 3',
  name: 'Moe Howard',
  url: 'ToDo N/A',
  logoURL: '/assets/agents/MoeHoward.png',
};

const defaultNetworkSettings = {
  defaultSellToken,
  defaultBuyToken,
  defaultRecipient,
  defaultAgent,
};

export { defaultNetworkSettings };
