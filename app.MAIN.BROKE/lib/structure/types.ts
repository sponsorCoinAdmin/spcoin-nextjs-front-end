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
    networkName: string;
    state: EXCHANGE_STATE;
    displayState: DISPLAY_STATE;
    slippage: string;
    network: NetworkElement;
    sellToken: TokenElement;
    buyToken: TokenElement;
    recipientWallet: WalletElement;
    agentWallet: WalletElement;
  }

  type NetworkElement = {
    chainId: number;
    name: string;
    symbol: string;
    img: string;
    url: string;
  }
  
  export {
    EXCHANGE_STATE,
    DISPLAY_STATE
  }

const TOKEN_LIST= 'TOKEN_LIST';
const AGENT_WALLETS ='AGENT_WALLETS';
const RECIPIENT_WALLETS ='RECIPIENT_WALLETS';

const FEED = {
    TOKEN_LIST,
    AGENT_WALLETS,
    RECIPIENT_WALLETS
}

export { FEED }

export type {
  ExchangeContext,
  NetworkElement,
  PriceRequestParams,
  TokenElement,
  WalletElement
};
