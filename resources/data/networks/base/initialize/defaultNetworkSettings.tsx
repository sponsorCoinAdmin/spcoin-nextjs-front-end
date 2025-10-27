import type { TokenContract } from '@/lib/structure';
import { CHAIN_ID } from '@/lib/structure'
 
const defaultSellToken: TokenContract = {
  chainId: CHAIN_ID.BASE,
  symbol: 'BRETT',
  name: 'Bret Meme Coin',
  address: '0x532f27101965dd16442e59d40670faf5ebb142e4',
  totalSupply: 0n,
  balance: 0n,
  decimals: 6,
  amount: 0n,
};

const defaultBuyToken: TokenContract = {
  chainId: CHAIN_ID.BASE,
  symbol: 'SpCoin',
  name: 'Sponsor Coin',
  address: '0xc2816250c07ae56c1583e5f2b0e67f7d7f42d562', // lowercased
  totalSupply: 0n,
  balance: 0n,
  decimals: 18,
  amount: 0n,
};

const defaultRecipient = { 
  symbol: 'Trees',
  logoURL: '/assets/recipients/SaveTheTrees.png',
  name: 'Save The Trees',
  address: 'Save The Trees Wallet Address',
  url: 'ToDo N/A',
};

const defaultAgent = { 
  symbol: 'Tweety',
  logoURL: '/assets/agents/TweetyBird.png',
  name: 'Tweety Bird',
  address: "TweetyBird's Wallet Address",
  url: 'ToDo N/A',
};

const defaultNetworkSettings = {
  defaultSellToken,
  defaultBuyToken,
  defaultRecipient,
  defaultAgent,
};

export { defaultNetworkSettings };
