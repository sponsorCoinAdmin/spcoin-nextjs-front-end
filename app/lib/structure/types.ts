import { Address } from "wagmi";

interface PriceRequestParams {
    sellToken: Address|string;
    buyToken: Address|string;
    buyAmount?: string;
    sellAmount?: string;
    connectedWalletAddr?: string;
  }
  
  type TokenElement = {
    chainId: number;
    address: Address|string;
    symbol: string;
    name: string;
    img: string;
    decimals: number;
  }
    
  type WalletElement = {
    address: Address|string;
    name: string;
    symbol: string;
    img: string;
    url: string;
  }
    
  export type {
    TokenElement,
    WalletElement,
    PriceRequestParams
};
