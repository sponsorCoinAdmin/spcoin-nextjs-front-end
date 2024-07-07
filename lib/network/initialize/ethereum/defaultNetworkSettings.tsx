import {  TokenContract } from '../../../structure/types'
 
 const defaultSellToken: TokenContract = { 
  chainId: 1,
  address: "0x2260fac5e5542a773aa44fbcfedf7c193bc2c599",
  name: "Wrapped Bitcoin",
  symbol: "WBTC",
  decimals: 8,
  totalSupply: null,
  img: "/resources/images/tokens/0x2260fac5e5542a773aa44fbcfedf7c193bc2c599.png"
 };

 const defaultBuyToken: TokenContract = { 
  chainId: 1,
  address: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
  name: "Tether USD",
  symbol: "USDT",
  decimals: 6,
  totalSupply: null,
  img: "/resources/images/tokens/0xdac17f958d2ee523a2206206994597c13d831ec7.png"
};

const defaultRecipient = { 
  "symbol": "SpCoin",
  "address": "0xToDo_SpCoin.png",
  "name": "Sponsor Coin",
  "url": "ToDo add URL here",
  "img": "/resources/images/tokens/0xToDo_SpCoin.png"
};

const defaultAgent = { 
  symbol: "Wilma",
  address: "Wilma Flintstone's Wallet Address",
  name: "Wilma Flintstone",
  "url": "ToDo add URL here",
  img: "/resources/images/agents/WilmaFlintstone.png"
};

const defaultNetworkSettings = {
  defaultSellToken : defaultSellToken,
  defaultBuyToken  : defaultBuyToken,
  defaultRecipient : defaultRecipient,
  defaultAgent     : defaultAgent
}

export { defaultNetworkSettings };
