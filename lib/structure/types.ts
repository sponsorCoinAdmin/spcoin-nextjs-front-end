import { Address } from "viem"

enum  EXCHANGE_STATE { NOT_CONNECTED,
                       MISSING_SELL_AMOUNT,
                       INSUFFICIENT_BALANCE,
                       APPROVE,
                       PENDING,
                       SWAP }

enum  TRANSACTION_TYPE { SELL_EXACT_OUT, BUY_EXACT_IN }
enum  WRAPPING_TYPE { WRAP_SELL_TOKEN, UNWRAP_SELL_TOKEN, WRAP_BUY_TOKEN, UNWRAP_BUY_TOKEN, NO_WRAP_REQUIRED }
enum  FEED_TYPE { TOKEN_LIST, AGENT_WALLETS, RECIPIENT_WALLETS }
enum  SP_COIN_DISPLAY { SELECT_BUTTON, RECIPIENT_CONTAINER, SPONSOR_RATE_CONFIG }
enum  BUTTON_TYPE { UNDEFINED, CONNECT, ZERO_AMOUNT, INSUFFICIENT_BALANCE, SWAP }
enum  CONTAINER_TYPE { PRICE_SELL_INPUT, PRICE_BUY_INPUT }

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
  buyAmount:bigint;
  slippage: string;
}

type ExchangeContext = {
  network: NetworkElement;
  recipientAccount: AccountRecord|undefined;
  agentAccount: AccountRecord|undefined;
  sellTokenContract: TokenContract|undefined;
  buyTokenContract: TokenContract|undefined;
  tradeData: TradeData;
  spCoinPanels:SP_COIN_DISPLAY;
  test : {dumpContextButton:boolean};
}

type ErrorMessage ={ 
  source:string,
  errCode:number,
  msg:string | undefined
  // msgArr:string[] | undefined
  // msgObj:{} | undefined
}

export {
  BUTTON_TYPE,
  CONTAINER_TYPE,
  EXCHANGE_STATE,
  FEED_TYPE,
  SP_COIN_DISPLAY,
  TRANSACTION_TYPE,
  WRAPPING_TYPE
}

export type {
  AccountRecord,
  ContractRecs,
  ErrorMessage,
  ExchangeContext,
  NetworkElement,
  PriceRequestParams,
  TokenContract,
  TradeData,
}