import {  BASE, TokenContract } from '@/lib/structure/types'
 
 const defaultSellToken: TokenContract = {
   chainId: BASE,
   "symbol": "BRETT",
   "name": "Bret Meme Coin",
   "address": "0x532f27101965dd16442e59d40670faf5ebb142e4",
   totalSupply: null,
   balance: 0n,
   "decimals": 6,
   amount: 0n
 };

const defaultBuyToken: TokenContract = {
  chainId: BASE,
  symbol: "SpCoin",
  name: "Sponsor Coin",
  address: "0xC2816250c07aE56c1583E5f2b0E67F7D7F42D562",
  totalSupply: null,
  balance: 0n,
  decimals: 18,
  amount: 0n
};

const defaultRecipient = { 
  "symbol": "Trees",
  "logoURL": "/assets/recipients/SaveTheTrees.png",
  "name": "Save The Trees",
  "address": "Save The Trees Wallet Address",
  "url": "ToDo N/A"
};

const defaultAgent = { 
  "symbol": "Tweety",
  "logoURL": "/assets/agents/TweetyBird.png",
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
