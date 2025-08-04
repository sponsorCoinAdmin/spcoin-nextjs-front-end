import {  ETHEREUM, TokenContract } from '@/lib/structure'
 
 const defaultSellToken: TokenContract = {
   chainId: ETHEREUM,
   address: "0x2260fac5e5542a773aa44fbcfedf7c193bc2c599",
   name: "TONCOIN",
   symbol: "TON",
   decimals: 9,
   balance: 0n,
   totalSupply: 0n,
   logoURL: "assets/blockchains/0x582d872A1B094FC48F5DE31D3B73F2D9bE47def1.png",
   amount: 0n
 };

 const defaultBuyToken: TokenContract = {
   chainId: ETHEREUM,
   address: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
   name: "Tether USD",
   symbol: "USDT",
   decimals: 6,
   balance: 0n,
   totalSupply: 0n,
   logoURL: "assets/blockchains/0xdac17f958d2ee523a2206206994597c13d831ec7.png",
   amount: 0n
 };

const defaultRecipient = { 
  "symbol": "SpCoin",
  "address": "0xToDo_SpCoin.png",
  "name": "Sponsor Coin",
  "url": "ToDo add URL here",
  "logoURL": "assets/blockchains/0xToDo_SpCoin.png"
};

const defaultAgent = { 
  symbol: "Wilma",
  address: "Wilma Flintstone's Wallet Address",
  name: "Wilma Flintstone",
  "url": "ToDo add URL here",
  logoURL: "/assets/agents/WilmaFlintstone.png"
};

const defaultNetworkSettings = {
  defaultSellToken : defaultSellToken,
  defaultBuyToken  : defaultBuyToken,
  defaultRecipient : defaultRecipient,
  defaultAgent     : defaultAgent
}

export { defaultNetworkSettings };
