import { Address } from "viem"

enum  EXCHANGE_STATE { NOT_CONNECTED,
                       MISSING_SELL_AMOUNT,
                       INSUFFICIENT_BALANCE,
                       APPROVE,
                       PENDING,
                       SWAP }

enum  TRADE_TYPE { NEW_SELL_CONTRACT, NEW_BUY_CONTRACT, NEW_RECIPIENT_ACCOUNT }
enum  TRANSACTION_TYPE { SELL_EXACT_OUT, BUY_EXACT_IN }
enum  DISPLAY_STATE { OFF, SPONSOR_SELL_ON, SPONSOR_SELL_OFF, SPONSOR_BUY, RECIPIENT, CONFIG }
enum  FEED_TYPE { TOKEN_LIST, AGENT_WALLETS, RECIPIENT_WALLETS }

interface PriceRequestParams {
  sellToken: Address|string;
  buyToken: Address|string;
  buyAmount: string;
  sellAmount: string;
  connectedAccountAddr?: string;
}

type AccountRecord = {
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
  transactionType:TRANSACTION_TYPE;
  sellAmount:bigint;
  sellBalanceOf:bigint;
  sellFormattedBalance:string;
  buyAmount:bigint;
  buyBalanceOf:bigint;
  buyFormattedBalance:string;
  slippage: string;
}

type ExchangeContext = {
  connectedAccountAddr:any,
  network: NetworkElement;
  recipientAccount: AccountRecord;
  agentAccount: AccountRecord;
  sellTokenContract: TokenContract;
  buyTokenContract: TokenContract;
  tradeData: TradeData;
  displayState: DISPLAY_STATE;
  test : {dumpContextButton:boolean};
}

export {
  EXCHANGE_STATE,
  TRADE_TYPE,
  TRANSACTION_TYPE,
  DISPLAY_STATE,
  FEED_TYPE
}

export type {
  ContractRecs,
  NetworkElement,
  PriceRequestParams,
  TokenContract,
  TradeData,
  ExchangeContext,
  AccountRecord
}
