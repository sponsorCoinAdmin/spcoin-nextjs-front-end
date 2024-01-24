interface PriceRequestParams {
  sellToken: string;
  buyToken: string;
  buyAmount?: string;
  sellAmount?: string;
  connectedWalletAddr?: string;
}

type TokenElement = {
  chainId: number;
  symbol: string;
  img: string;
  name: string;
  address: any;
  decimals: number;
}

const defaultSellToken: TokenElement = { 
  chainId: 137,
  symbol: "WBTC",
  img: "https://github.com/sponsorCoinAdmin/spCoinData/blob/main/resources/images/tokens/0x2260fac5e5542a773aa44fbcfedf7c193bc2c599.png?raw=true",
  name: "Wrapped Bitcoin",
  address: "0x1BFD67037B42Cf73acF2047067bd4F2C47D9BfD6",
  decimals: 8
 };

 const defaultBuyToken: TokenElement = { 
  chainId: 137,
  symbol: "USDT",
  img: "https://github.com/sponsorCoinAdmin/spCoinData/blob/main/resources/images/tokens/0xdac17f958d2ee523a2206206994597c13d831ec7.png?raw=true",
  name: "Tether USD",
  address: "0xc2132D05D31c914a87C6611C10748AEb04B58e8F",
  decimals: 6
};

const defaultAgent = { 
  symbol: "Wilma",
  img: "https://github.com/sponsorCoinAdmin/spCoinData/blob/main/resources/images/agents/WilmaFlintstone.png?raw=true",
  name: "Wilma Flintstone",
  address: "Wilma Flintstone's Wallet Address"
};

const defaultRecipient = { 
  symbol: "Whales",
  img: "https://github.com/sponsorCoinAdmin/spCoinData/blob/main/resources/images/recipients/SaveTheWhales.png?raw=true",
  name: "Save The Whales",
  address: "Save The Whales Wallet Address"
};

export { defaultSellToken, defaultBuyToken, defaultAgent, defaultRecipient };
export type { TokenElement, PriceRequestParams };
