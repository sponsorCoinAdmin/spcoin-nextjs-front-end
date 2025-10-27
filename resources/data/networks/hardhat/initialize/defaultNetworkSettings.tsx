import type { TokenContract } from '@/lib/structure';
import { CHAIN_ID } from '@/lib/structure'
 
const defaultSellToken: TokenContract = {
  chainId: CHAIN_ID.HARDHAT,
  address: "0x2260fac5e5542a773aa44fbcfedf7c193bc2c599",
  name: "TONCOIN",
  symbol: "TON",
  decimals: 9,
  balance: 0n,
  totalSupply: 0n,
  // lowercased the 0x… segment
  logoURL: "assets/blockchains/0x582d872a1b094fc48f5de31d3b73f2d9be47def1.png",
  amount: 0n
};

const defaultBuyToken: TokenContract = {
  chainId: CHAIN_ID.HARDHAT,
  address: "0xdac17f958d2ee523a2206206994597c13d831ec7",
  name: "Tether USD",
  symbol: "USDT",
  decimals: 6,
  balance: 0n,
  totalSupply: 0n,
  // already lowercased
  logoURL: "assets/blockchains/0xdac17f958d2ee523a2206206994597c13d831ec7.png",
  amount: 0n
};

const defaultRecipient = { 
  symbol: "SpCoin",
  address: "0xtodo_spcoin.png", // lowercased earlier per your request
  name: "Sponsor Coin",
  url: "ToDo add URL here",
  // lowercased the 0x… segment
  logoURL: "assets/blockchains/0xtodo_spcoin.png"
};

const defaultAgent = { 
  symbol: "Wilma",
  address: "wilma flintstone's wallet address",
  name: "Wilma Flintstone",
  url: "ToDo add URL here",
  logoURL: "/assets/agents/WilmaFlintstone.png"
};

const defaultNetworkSettings = {
  defaultSellToken,
  defaultBuyToken,
  defaultRecipient,
  defaultAgent
}

export { defaultNetworkSettings };
