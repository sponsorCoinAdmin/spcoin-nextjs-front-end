import { Account, Address } from "viem";

export const publicWalletPath: string = "assets/accounts";

// Token Address Input Select States
export enum InputState {
  EMPTY_INPUT,
  INVALID_ADDRESS_INPUT,
  DUPLICATE_INPUT,
  IS_LOADING,
  CONTRACT_NOT_FOUND_ON_BLOCKCHAIN,
  CONTRACT_NOT_FOUND_LOCALLY,
  VALID_INPUT_PENDING,
  VALID_INPUT,
  CLOSE_INPUT,
}

export const getInputStateString = (state: InputState): string => {
  switch (state) {
    case InputState.EMPTY_INPUT:
      return 'EMPTY_INPUT';
    case InputState.VALID_INPUT:
      return 'VALID_INPUT';
    case InputState.VALID_INPUT_PENDING:
      return 'VALID_INPUT_PENDING';
    case InputState.INVALID_ADDRESS_INPUT:
      return 'INVALID_ADDRESS_INPUT';
    case InputState.CONTRACT_NOT_FOUND_ON_BLOCKCHAIN:
      return 'CONTRACT_NOT_FOUND_ON_BLOCKCHAIN';
    case InputState.CONTRACT_NOT_FOUND_LOCALLY:
      return 'CONTRACT_NOT_FOUND_LOCALLY';
    case InputState.DUPLICATE_INPUT:
      return 'DUPLICATE_INPUT';
    case InputState.IS_LOADING:
      return 'IS_LOADING';
    case InputState.CLOSE_INPUT:
      return 'CLOSE_INPUT';
    default:
      return 'UNKNOWN_INPUT_STATE';
  }
};

export interface AccountAddress {
  address: string;
}

// Define Wallet type
interface WalletAccount {
  name: string;
  symbol: string;
  type: string;
  website: string;
  description: string;
  status: string;
  address: string;
  logoURL?: string;
}

// Button Types
enum BUTTON_TYPE {
  API_TRANSACTION_ERROR,
  BUY_ERROR_REQUIRED,
  BUY_TOKEN_REQUIRED,
  CONNECT,
  INSUFFICIENT_BALANCE,
  IS_LOADING_PRICE,
  NO_HARDHAT_API,
  SELL_ERROR_REQUIRED,
  SELL_TOKEN_REQUIRED,
  SWAP,
  TOKENS_REQUIRED,
  UNDEFINED,
  ZERO_AMOUNT
}

// Container Types
enum CONTAINER_TYPE {
  SELL_SELECT_CONTAINER,
  BUY_SELECT_CONTAINER,
  ASSET_SELECT_DIALOG,
  UNDEFINED
}

// Exchange States
enum EXCHANGE_STATE {
  APPROVE,
  INSUFFICIENT_BALANCE,
  MISSING_SELL_AMOUNT,
  NOT_CONNECTED,
  PENDING,
  SWAP
}

// Feed Types
enum FEED_TYPE {
  AGENT_ACCOUNTS,
  RECIPIENT_ACCOUNTS,
  TOKEN_LIST
}

// SP Coin Display
enum SP_COIN_DISPLAY {
  OFF,
  SHOW_ADD_SPONSOR_BUTTON,
  SHOW_RECIPIENT_CONTAINER,
  SHOW_SPONSOR_RATE_CONFIG,
  SHOW_MANAGE_SPONSORS_BUTTON
}

const ERROR_CODES = {
  CHAIN_SWITCH: 1001,
  PRICE_FETCH_ERROR: 2001,
  INVALID_TOKENS: 3001
};

// Status Types
enum STATUS {
  ERROR_API_PRICE,
  FAILED,
  MESSAGE_ERROR,
  SUCCESS,
  WARNING_HARDHAT,
  INFO
}

// Swap Types
enum SWAP_TYPE {
  SWAP,
  SWAP_UNWRAP,
  UNDEFINED,
  UNWRAP,
  WRAP,
  WRAP_SWAP
}

// Transaction Types
enum TRADE_DIRECTION {
  SELL_EXACT_OUT,
  BUY_EXACT_IN
}

export enum API_TRADING_PROVIDER {
  API_0X,
  API_1INCH
}

// Network Constants
const ETHEREUM = 1;
const BASE = 8453;
const HARDHAT = 31337;
const POLYGON = 137;
const SEPOLIA = 11155111;

// Network WETH Addresses
const BASE_WETH_ADDRESS: Address = "0x4200000000000000000000000000000000000006";
const ETHEREUM_WETH_ADDRESS: Address = "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2";
const HARDHAT_WETH_ADDRESS: Address = "0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9";
const POLYGON_WETH_ADDRESS: Address = "0x7ceb23fd6bc0add59e62ac25578270cff1b9f619";
const SEPOLIA_WETH_ADDRESS: Address = "0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14";

// Interfaces and Types
interface PriceRequestParams {
  chainId: number;
  buyAmount?: string;
  buyToken: Address | string;
  connectedAccountAddr?: string;
  sellAmount?: string;
  sellToken: Address | string;
  slippageBps?: number;
}

type ContractRecs = {
  decimalRec: any;
  nameRec: any;
  symbolRec: any;
  totalSupplyRec: any;
};

type ErrorMessage = {
  errCode: number;
  msg: any;
  source: string;
  status: STATUS;
};

type Accounts = {
  connectedAccount?: WalletAccount;
  sponsorAccount?: WalletAccount;
  recipientAccount?: WalletAccount;
  agentAccount?: WalletAccount;

  sponsorAccounts?: WalletAccount[];
  recipientAccounts?: WalletAccount[];
  agentAccounts?: WalletAccount[];
}

type Settings = {
  containerType: CONTAINER_TYPE | undefined;
  readonly apiTradingProvider: API_TRADING_PROVIDER;
  readonly spCoinDisplay: SP_COIN_DISPLAY;
};

type ExchangeContext = {
  settings: Settings;
  accounts: Accounts;
  network: NetworkElement;
  tradeData: TradeData;
};

type NetworkElement = {
  [x: string]: any;
  readonly chainId: number;
  readonly logoURL: string;
  readonly name: string;
  readonly symbol: string;
  readonly url: string;
};

type TokenContract = {
  address: Address;
  amount: bigint;
  balance: bigint;
  chainId?: number;
  decimals?: number;
  logoURL?: string;
  name?: string;
  symbol?: string;
  totalSupply: any;
};

type TradeData = {
  buyTokenContract?: TokenContract;
  chainId: number;
  sellTokenContract?: TokenContract;
  signer: any;
  slippageBps: number;
  rateRatio: number;
  slippage: number;
  slippagePercentage: number;
  slippagePercentageString: string;
  swapType: SWAP_TYPE;
  tradeDirection: TRADE_DIRECTION;
};

// Exports
export {
  BUTTON_TYPE,
  CONTAINER_TYPE,
  EXCHANGE_STATE,
  FEED_TYPE,
  SP_COIN_DISPLAY,
  STATUS,
  SWAP_TYPE,
  TRADE_DIRECTION,
  ERROR_CODES,
  BASE,
  ETHEREUM,
  HARDHAT,
  POLYGON,
  SEPOLIA,
  BASE_WETH_ADDRESS,
  ETHEREUM_WETH_ADDRESS,
  HARDHAT_WETH_ADDRESS,
  POLYGON_WETH_ADDRESS,
  SEPOLIA_WETH_ADDRESS
};

export type {
  WalletAccount,
  ContractRecs,
  ErrorMessage,
  ExchangeContext,
  NetworkElement,
  PriceRequestParams,
  TokenContract,
  TradeData
};
