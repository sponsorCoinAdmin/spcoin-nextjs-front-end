import { Account, Address } from "viem"

enum  EXCHANGE_STATE { NOT_CONNECTED,
                       MISSING_SELL_AMOUNT,
                       INSUFFICIENT_BALANCE,
                       APPROVE,
                       PENDING,
                       SWAP }

enum  TRANSACTION_TYPE { SELL_EXACT_OUT, BUY_EXACT_IN}
enum  SWAP_TYPE { SWAP, WRAP, UNWRAP,  WRAP_SWAP, SWAP_UNWRAP, UNDEFINED}
enum  FEED_TYPE { TOKEN_LIST, AGENT_WALLETS, RECIPIENT_WALLETS }
enum  SP_COIN_DISPLAY { SELECT_BUTTON, RECIPIENT_CONTAINER, SPONSOR_RATE_CONFIG }
enum  BUTTON_TYPE { API_TRANSACTION_ERROR, UNDEFINED, CONNECT, ZERO_AMOUNT, INSUFFICIENT_BALANCE, IS_LOADING_PRICE,
  TOKENS_REQUIRED, SELL_TOKEN_REQUIRED, BUY_TOKEN_REQUIRED, SELL_ERROR_REQUIRED, BUY_ERROR_REQUIRED, NO_HARDHAT_API,SWAP }
enum  CONTAINER_TYPE { INPUT_SELL_PRICE, INPUT_BUY_PRICE }
enum  STATUS { SUCCESS, ERROR_API_PRICE, WARNING_HARDHAT }

// NETWORKS
const ETHEREUM:number = 1
const POLYGON:number = 137
const HARDHAT:number = 31337
const SEPOLIA:number = 11155111;

// NETWORK WETH ADDRESSES
const ETHEREUM_WETH_ADDRESS:Address = "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2";
const POLYGON_WETH_ADDRESS:Address  = "0x7ceb23fd6bc0add59e62ac25578270cff1b9f619"
const HARDHAT_WETH_ADDRESS:Address  = "0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9"
const SEPOLIA_WETH_ADDRESS:Address  = "0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14"

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
  signer: any,
  chainId:number,
  transactionType: TRANSACTION_TYPE;
  swapType: SWAP_TYPE;
  sellAmount: bigint;
  buyAmount: bigint;
  slippage: number;
  sellTokenContract: TokenContract|undefined;
  buyTokenContract: TokenContract|undefined;
}

type ExchangeContext = {
  activeAccountAddress: `0x${string}`|Account|undefined|Address;
  network: NetworkElement;
  recipientAccount: AccountRecord|undefined;
  agentAccount: AccountRecord|undefined;
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
  TRANSACTION_TYPE,
  // NETWORKS
  ETHEREUM,
  POLYGON,
  HARDHAT,
  SEPOLIA,
  // NETWORK WETH ADDRESSES
  ETHEREUM_WETH_ADDRESS,
  POLYGON_WETH_ADDRESS,
  HARDHAT_WETH_ADDRESS,
  SEPOLIA_WETH_ADDRESS
}

export type {
  AccountRecord,
  ContractRecs,
  ErrorMessage,
  ExchangeContext,
  NetworkElement,
  PriceRequestParams,
  TokenContract,
  TradeData
}

