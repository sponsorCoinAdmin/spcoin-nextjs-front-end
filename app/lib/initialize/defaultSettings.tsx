import { defaultNetworkSettings as defaultEthereumSettings } from './ethereum/defaultSettings'
import { defaultNetworkSettings as defaultPolygonSettings } from './polygon/defaultSettings'
import { defaultNetworkSettings as defaultSepoliaSettings } from './sepolia/defaultSettings'

//////////////////////////////////////////////////////////////////


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
  
  export { defaultSellToken, defaultBuyToken, defaultRecipient, defaultAgent };
  export type { TokenElement, PriceRequestParams };
  


//////////////////////////////////////////////////////////////////




const getDefaultNetworkSettings = (network:string|number) => {
    switch(network)
    {
        case 1:
        case "ethereum": return defaultEthereumSettings;
        case 137:
        case "polygon": return defaultPolygonSettings;
        case 11155111:
        case "sepolia": return defaultSepoliaSettings;
        default: return defaultEthereumSettings
    }
}

const defaultSettings = defaultEthereumSettings;

export { 
    getDefaultNetworkSettings,  
    defaultEthereumSettings,
    defaultPolygonSettings,
    defaultSepoliaSettings
 };
