// File: lib/structure/types.ts

import { Address } from 'viem';
import { UseReadContractReturnType } from 'wagmi';
import { STATUS, TRADE_DIRECTION, API_TRADING_PROVIDER, SP_COIN_DISPLAY } from './enums';

export interface WalletAccount {
  name: string;
  symbol: string;
  type: string;
  website: string;
  description: string;
  status: string;
  address: Address;
  logoURL?: string;
  balance: bigint;
}

export interface AccountAddress {
  address: string;
}

export type ErrorMessage = {
  errCode: number;
  msg: string;
  source: string;
  status: STATUS;
};

export type ContractRecs = {
  nameRec: UseReadContractReturnType;
  symbolRec: UseReadContractReturnType;
  decimalRec: UseReadContractReturnType;
  totalSupplyRec: UseReadContractReturnType;
};

export type Accounts = {
  connectedAccount?: WalletAccount;
  sponsorAccount?: WalletAccount;
  recipientAccount?: WalletAccount;
  agentAccount?: WalletAccount;
  sponsorAccounts?: WalletAccount[];
  recipientAccounts?: WalletAccount[];
  agentAccounts?: WalletAccount[];
};

export type Settings = {
  apiTradingProvider: API_TRADING_PROVIDER;
  spCoinDisplay: SP_COIN_DISPLAY;
  assetSelectScrollDisplay: SP_COIN_DISPLAY;
  errorDisplay: SP_COIN_DISPLAY;
};

export type NetworkElement = {
  connected: boolean;
  chainId: number;
  logoURL: string;
  name: string;
  symbol: string;
  url: string;
};

export type Slippage = {
  bps: number;
  percentage: number;
  percentageString: string;
};

export type TokenContract = {
  address: Address;
  name?: string;
  symbol?: string;
  decimals?: number;
  totalSupply?: bigint;
  balance: bigint;
  amount?: bigint;
  chainId?: number;
  logoURL?: string;
};

export type TradeData = {
  buyTokenContract?: TokenContract;
  sellTokenContract?: TokenContract;
  rateRatio: number;
  slippage: Slippage;
  tradeDirection: TRADE_DIRECTION;
};

export type ExchangeContext = {
  accounts: Accounts;
  network: NetworkElement;
  settings: Settings;
  tradeData: TradeData;
  errorMessage: ErrorMessage | undefined;
  apiErrorMessage: ErrorMessage | undefined;
};

export interface PriceRequestParams {
  chainId: number;
  buyAmount?: string;
  buyToken: Address | string;
  connectedAccountAddr?: string;
  sellAmount?: string;
  sellToken: Address | string;
  slippageBps?: number;
}

export const ERROR_CODES = {
  CHAIN_SWITCH: 1001,
  PRICE_FETCH_ERROR: 2001,
  INVALID_TOKENS: 3001,
};
