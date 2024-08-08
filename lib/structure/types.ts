import { Address } from "viem"

enum  EXCHANGE_STATE { NOT_CONNECTED,
                       MISSING_SELL_AMOUNT,
                       INSUFFICIENT_BALANCE,
                       APPROVE,
                       PENDING,
                       SWAP }

enum  DISPLAY_STATE { OFF, SPONSOR_SELL_ON, SPONSOR_SELL_OFF, SPONSOR_BUY, RECIPIENT, CONFIG }
enum  FEED_TYPE { TOKEN_LIST, AGENT_WALLETS, RECIPIENT_WALLETS }

interface PriceRequestParams {
  sellToken: Address|string;
  buyToken: Address|string;
  buyAmount?: string;
  sellAmount?: string;
  connectedWalletAddr?: string;
}

type WalletAccount = {
  address: Address|string;
  name: string;
  symbol: string;
  img: string;
  url: string;
}

type ContractRecs = {
  nameRec:any,
  symbolRec:any,
  decimalRec:any,
  totalSupplyRec:any
}

type TokenContract = {
  chainId : number | undefined,
  address : any,
  name :string | undefined,
  symbol :string | undefined,
  decimals : number | undefined,
  totalSupply : any,
  img: string | undefined;
}

type NetworkElement = {
  chainId: number;
  name: string;
  symbol: string;
  img: string;
  url: string;
}

type TradeData = {

  network: NetworkElement;

  recipientAccount: WalletAccount;
  agentAccount: WalletAccount;

  sellTokenContract: TokenContract;
  buyTokenContract: TokenContract;

  connectedWalletAddr:any,
  sellAmount:string;
  sellBalanceOf:bigint;
  sellFormattedBalance:string;
  buyAmount:string;
  buyBalanceOf:bigint;
  buyFormattedBalance:string;
  tradeDirection:string
  displayState: DISPLAY_STATE;
  slippage: string;
}

export {
  EXCHANGE_STATE,
  DISPLAY_STATE,
  FEED_TYPE
}

export type {
  ContractRecs,
  NetworkElement,
  PriceRequestParams,
  TokenContract,
  TradeData,
  WalletAccount
}
