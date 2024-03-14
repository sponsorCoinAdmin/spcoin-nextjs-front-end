import { Address } from "wagmi";

enum  EXCHANGE_STATE {
  PRICE, QUOTE, PENDING
}

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

  type ExchangeTokens = {
    state: EXCHANGE_STATE;
    slippage: string|undefined|null;
    sellToken: TokenElement;
    buyToken: TokenElement;
    recipientWallet: WalletElement;
    agentWallet: WalletElement;
  }
    
  export { EXCHANGE_STATE }
  export type {
    TokenElement,
    WalletElement,
    PriceRequestParams,
    ExchangeTokens
};

