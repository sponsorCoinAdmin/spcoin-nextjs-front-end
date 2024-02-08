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
  
export type {
  TokenElement,
  PriceRequestParams
};
