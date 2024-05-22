import { Address } from "viem";

enum  EXCHANGE_STATE { PRICE, QUOTE, APPROVE, PENDING }

enum  DISPLAY_STATE {
  OFF, SPONSOR_SELL_ON, SPONSOR_SELL_OFF, SPONSOR_BUY, RECIPIENT, CONFIG
}

enum  FEED_TYPE { TOKEN_LIST, AGENT_WALLETS, RECIPIENT_WALLETS }

interface PriceRequestParams {
  sellToken: Address|string;
  buyToken: Address|string;
  buyAmount?: string;
  sellAmount?: string;
  connectedWalletAddr?: string;
}

type TokenContract = {
  chainId: number;
  address: Address|string;
  name: string;
  symbol: string;
  decimals: number;
  img: string;
}

type TokenContract2 = {
  chainId: number;
  address: Address|string;
  name: string;
  symbol: string;
  decimals: number;
  img: string;
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
  sellTokenContract: TokenContract;
  buyTokenContract: TokenContract;
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
  DISPLAY_STATE,
  FEED_TYPE
}

export type {
  ExchangeContext,
  NetworkElement,
  PriceRequestParams,
  TokenContract,
  TradeData,
  WalletElement
}