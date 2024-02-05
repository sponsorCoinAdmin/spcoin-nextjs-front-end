import {  TokenElement } from '../../../structure/types'
 
 const defaultSellToken: TokenElement = { 
  chainId: 1,
  symbol: "WBTC",
  img: "/resources/images/tokens/0x2260fac5e5542a773aa44fbcfedf7c193bc2c599.png",
  name: "Wrapped Bitcoin",
  address: "0x2260fac5e5542a773aa44fbcfedf7c193bc2c599",
  decimals: 8
 };

 const defaultBuyToken: TokenElement = { 
  chainId: 1,
  symbol: "USDT",
  img: "/resources/images/tokens/0xdac17f958d2ee523a2206206994597c13d831ec7.png",
  name: "Tether USD",
  address: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
  decimals: 6
};

const defaultRecipient = { 
  "symbol": "SpCoin",
  "img": "/resources/images/tokens/0xToDo_SpCoin.png",
  "name": "Sponsor Coin",
  "address": "0xToDo_SpCoin.png"
};

const defaultAgent = { 
  symbol: "Wilma",
  img: "/resources/images/agents/WilmaFlintstone.png",
  name: "Wilma Flintstone",
  address: "Wilma Flintstone's Wallet Address"
};

const defaultNetworkSettings = {
  defaultSellToken : defaultSellToken,
  defaultBuyToken  : defaultBuyToken,
  defaultRecipient : defaultRecipient,
  defaultAgent     : defaultAgent
}

export { defaultNetworkSettings };
