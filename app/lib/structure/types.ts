import { Address } from "wagmi";

interface PriceRequestParams {
    sellToken: string;
    buyToken: string;
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
    address: any;
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
