// File: @/resources/data/networks/hardhat/initialize/defaultNetworkSettings.tsx

import type { TokenContract } from '@/lib/structure';
import { CHAIN_ID } from '@/lib/structure';
import type { Address } from 'viem';
import { getTokenLogoURL } from '@/lib/context/helpers/assetHelpers';

const defaultSellToken: TokenContract = {
  chainId: CHAIN_ID.HARDHAT,
  address: '0x2260fac5e5542a773aa44fbcfedf7c193bc2c599',
  name: 'TONCOIN',
  symbol: 'TON',
  decimals: 9,
  balance: 0n,
  totalSupply: 0n,
  // ✅ Centralized token logo path (uppercased folder internally)
  logoURL: getTokenLogoURL({
    chainId: CHAIN_ID.HARDHAT,
    address: '0x2260fac5e5542a773aa44fbcfedf7c193bc2c599' as Address,
  }),
  amount: 0n,
};

const defaultBuyToken: TokenContract = {
  chainId: CHAIN_ID.HARDHAT,
  address: '0xdac17f958d2ee523a2206206994597c13d831ec7',
  name: 'Tether USD',
  symbol: 'USDT',
  decimals: 6,
  balance: 0n,
  totalSupply: 0n,
  // ✅ Centralized token logo path (uppercased folder internally)
  logoURL: getTokenLogoURL({
    chainId: CHAIN_ID.HARDHAT,
    address: '0xdac17f958d2ee523a2206206994597c13d831ec7' as Address,
  }),
  amount: 0n,
};

const defaultRecipient = {
  symbol: 'SpCoin',
  address: '0xtodo_spcoin.png', // as in your existing config
  name: 'Sponsor Coin',
  url: 'ToDo add URL here',
  // Leaving this as a static asset path; it’s not derived from an EVM address
  logoURL: 'assets/blockchains/0xtodo_spcoin.png',
};

const defaultAgent = {
  symbol: 'Wilma',
  address: "wilma flintstone's wallet address",
  name: 'Wilma Flintstone',
  url: 'ToDo add URL here',
  logoURL: '/assets/agents/WilmaFlintstone.png',
};

const defaultNetworkSettings = {
  defaultSellToken,
  defaultBuyToken,
  defaultRecipient,
  defaultAgent,
};

export { defaultNetworkSettings };
