import {  POLYGON, TokenContract } from '@/lib/structure'
 
 const defaultSellToken: TokenContract = {
   chainId: POLYGON,
   "symbol": "USDC",
   "logoURL": "assets/blockchains/0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48.png",
   "name": "USD Coin Staked",
   "address": "0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359",
   totalSupply: null,
   balance: 0n,
   "decimals": 6,
   amount: 0n
 };

const defaultBuyToken: TokenContract = {
  chainId: POLYGON,
  symbol: "SpCoin",
  logoURL: "assets/blockchains/0xToDo_SpCoin.png",
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
