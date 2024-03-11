interface PriceRequestParams {
    sellToken: string;
    buyToken: string;
    buyAmount?: string;
    sellAmount?: string;
    connectedWalletAddr?: string;
  }
  
  type TokenElement = {
    chainId: number;
    address: any;
    symbol: string;
    name: string;
    img: string;
    decimals: number;
  }
    
  type WalletElement = {
    address: any;
    symbol: string;
    name: string;
    img: string;
    url: string;
  }
    
  export type {
    TokenElement,
    WalletElement,
    PriceRequestParams
};
