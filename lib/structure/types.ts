import { Account, Address } from "viem"

enum  EXCHANGE_STATE { NOT_CONNECTED,
                       MISSING_SELL_AMOUNT,
                       INSUFFICIENT_BALANCE,
                       APPROVE,
                       PENDING,
                       SWAP }

enum  TRANSACTION_TYPE { SELL_EXACT_OUT, BUY_EXACT_IN}
enum  SWAP_TYPE { SWAP, WRAP, UNWRAP,  WRAP_TO_NETWORK_TOKEN_SWAP, SWAP_TO_NETWORK_TOKEN_UNWRAP, UNDEFINED}
enum  FEED_TYPE { TOKEN_LIST, AGENT_WALLETS, RECIPIENT_WALLETS }
enum  SP_COIN_DISPLAY { SELECT_BUTTON, RECIPIENT_CONTAINER, SPONSOR_RATE_CONFIG }
enum  BUTTON_TYPE { API_TRANSACTION_ERROR, UNDEFINED, CONNECT, ZERO_AMOUNT, INSUFFICIENT_BALANCE, IS_LOADING_PRICE, SWAP }
enum  CONTAINER_TYPE { INPUT_SELL_PRICE, INPUT_BUY_PRICE }
enum  STATUS { SUCCESS, ERROR }

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
  slippage: number;
}

type ExchangeContext = {
  activeWalletAccount: `0x${string}`|Account|undefined;
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
  status:STATUS,
  source:string,
  errCode:number,
  msg:any
  // msgArr:string[] | undefined
  // msgObj:{} | undefined
}

export {
  BUTTON_TYPE,
  CONTAINER_TYPE,
  EXCHANGE_STATE,
  FEED_TYPE,
  SP_COIN_DISPLAY,
  STATUS,
  SWAP_TYPE,
  TRANSACTION_TYPE
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