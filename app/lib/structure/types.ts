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
  
export type {
  TokenElement,
  PriceRequestParams
};
