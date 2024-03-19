import { Address } from "wagmi";

enum  EXCHANGE_STATE {
  PRICE, QUOTE, PENDING
}

enum  DISPLAY_STATE {
  OFF, SPONSOR, RECIPIENT, CONFIG
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

  type ExchangeContext = {
    state: EXCHANGE_STATE;
    displayState: DISPLAY_STATE;
    slippage: string;
    sellToken: TokenElement;
    buyToken: TokenElement;
    recipientWallet: WalletElement;
    agentWallet: WalletElement;
  }
    
  export {
    EXCHANGE_STATE,
    DISPLAY_STATE
  }

  export type {
    TokenElement,
    WalletElement,
    PriceRequestParams,
    ExchangeContext
};
