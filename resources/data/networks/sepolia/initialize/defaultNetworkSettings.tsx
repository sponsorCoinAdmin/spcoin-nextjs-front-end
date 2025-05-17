import {  SEPOLIA, TokenContract } from '@/lib/structure/types'
 
 const defaultSellToken: TokenContract = {
   chainId: SEPOLIA,
   address: "0x536BcBE548cef2cE493932fEFCeC059Dda4d5579",
   name: "Wrapped Bitcoin",
   symbol: "WBTC",
   decimals: 8,
   balance: 0n,
   totalSupply: null,
   logoURL: "assets/blockchains/0x2260fac5e5542a773aa44fbcfedf7c193bc2c599.png",
   amount: 0n
 };

const defaultBuyToken: TokenContract = {
  chainId: SEPOLIA,
  address: "0xAdd8Ad605fE57064903a3DeFC3b4ed676992bba6",
  name: "Tether USD",
  symbol: "USDT",
  decimals: 6,
  balance: 0n,
  totalSupply: null,
  logoURL: "assets/blockchains/0xdac17f958d2ee523a2206206994597c13d831ec7.png",
  amount: 0n
};

const defaultRecipient = { 
  "address": "SaveTheTiger4 Wallet Address",
  "name": "Support The Tiger",
  "symbol": "Tiger",
  "url": "ToDo N/A",
  "logoURL": "/assets/recipients/SaveTheTiger4.png"
};

const defaultAgent = {
  "address": "Moe's Wallet Address",
  "symbol": "Stuge 3",
  "name": "Moe Howard",
  "url": "ToDo N/A",
  "logoURL": "/assets/agents/MoeHoward.png"
};

const defaultNetworkSettings = {
  defaultSellToken : defaultSellToken,
  defaultBuyToken  : defaultBuyToken,
  defaultRecipient : defaultRecipient,
  defaultAgent     : defaultAgent
}

export { defaultNetworkSettings };
