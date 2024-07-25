import { Address } from "viem"

enum  EXCHANGE_STATE { NOT_CONNECTED,
                       MISSING_SELL_AMOUNT,
                       INSUFFICIENT_BALANCE,
                       APPROVE,
                       PENDING,
                       SWAP }

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
  chainId : number | undefined,
  address : any,
  name :string | undefined,
  symbol :string | undefined,
  decimals : any,
  totalSupply : any,
  img: string | undefined;
}

/*
type TokenContract = {
  chainId : number | undefined,
  address : Address | undefined,
  name :string | undefined,
  symbol :string | undefined,
  decimals : any,
  totalSupply : any
  img: string | undefined;
}

type TokenContract = {
  chainId: number;
  address: Address|string;
  name: string;
  symbol: string;
  decimals: number;
  img: string;
}

*/

type ContractRecs = {
    nameRec:any,
    symbolRec:any,
    decimalRec:any,
    totalSupplyRec:any
  }
  
type WalletElement = {
  address: Address|string;
  name: string;
  symbol: string;
  img: string;
  url: string;
}

type TradeData = {
  chain:any
  sellAmount:string;
  sellBalanceOf:string;
  buyAmount:string;
  buyBalanceOf:string;
  tradeDirection:string
  displayState: DISPLAY_STATE;
  slippage: string;
}

type ExchangeContext = {
  tradeData: TradeData;
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
  ContractRecs,
  ExchangeContext,
  NetworkElement,
  PriceRequestParams,
  TokenContract,
  TradeData,
  WalletElement
}