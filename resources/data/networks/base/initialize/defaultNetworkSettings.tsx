import {  BASE, TokenContract } from '@/lib/structure/types'
 
 const defaultSellToken: TokenContract = { 
  chainId: BASE,
  "symbol": "BRETT",
  "img": "assets/blockchains/0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48.png",
  "name": "Bret Meme Coin",
  "address": "0x532f27101965dd16442e59d40670faf5ebb142e4",
  totalSupply: null,
  balance: 0n,
  "decimals": 6
 };

const defaultBuyToken: TokenContract = { 
  chainId: BASE,
  symbol: "SpCoin",
  img: "assets/blockchains/0xToDo_SpCoin.png",
  name: "Sponsor Coin",
  address: "0xC2816250c07aE56c1583E5f2b0E67F7D7F42D562",
  totalSupply: null,
  balance: 0n,
  decimals: 18
};

const defaultRecipient = { 
  "symbol": "Trees",
  "img": "/assets/recipients/SaveTheTrees.png",
  "name": "Save The Trees",
  "address": "Save The Trees Wallet Address",
  "url": "ToDo N/A"
};

const defaultAgent = { 
  "symbol": "Tweety",
  "img": "/assets/agents/TweetyBird.png",
  "name": "Tweety Bird",
  "address": "TweetyBird's Wallet Address",
  "url": "ToDo N/A"
};

const defaultNetworkSettings = {
  defaultSellToken : defaultSellToken,
  defaultBuyToken  : defaultBuyToken,
  defaultRecipient : defaultRecipient,
  defaultAgent     : defaultAgent
}

export { defaultNetworkSettings };
