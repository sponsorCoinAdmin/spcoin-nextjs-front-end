import { Address } from "wagmi";

enum  EXCHANGE_STATE {
  PRICE, QUOTE, PENDING
}

enum  DISPLAY_STATE {
  OFF, SPONSOR_SELL_ON, SPONSOR_SELL_OFF, SPONSOR_BUY, RECIPIENT, CONFIG
}

// ToDo Convert the following to an enum
const TOKEN_LIST = 'TOKEN_LIST';
const AGENT_WALLETS ='AGENT_WALLETS';
const RECIPIENT_WALLETS ='RECIPIENT_WALLETS';

const FEED = {
    TOKEN_LIST,
    AGENT_WALLETS,
    RECIPIENT_WALLETS
}
// End ToDo

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

type TradeData = {
  chainId: number;
  networkName: string;
  sellAmount:string;
  buyAmount:string;
  tradeDirection:string
  displayState: DISPLAY_STATE;
  state: EXCHANGE_STATE;
  slippage: string;
}

type ExchangeContext = {
  data: TradeData;
  network: NetworkElement;
  sellTokenElement: TokenElement;
  buyTokenElement: TokenElement;
  recipientWallet: WalletElement;
  agentWallet: WalletElement;
}
/*
type ExchangeTokens = {
  state: EXCHANGE_STATE;
  slippage: string|undefined|null;
  sellToken: TokenElement;
  buyToken: TokenElement;
  recipientWallet: WalletElement;
  agentWallet: WalletElement;
}
*/

type NetworkElement = {
  chainId: number;
  name: string;
  symbol: string;
  img: string;
  url: string;
}

export {
  EXCHANGE_STATE,
  DISPLAY_STATE,
  FEED
}

export type {
  ExchangeContext,
  NetworkElement,
  PriceRequestParams,
  TokenElement,
  TradeData,
  WalletElement
}