// File: lib/structure/types.ts

import { Address } from 'viem';
import { UseReadContractReturnType } from 'wagmi';
import {
  STATUS,
  TRADE_DIRECTION,
  API_TRADING_PROVIDER, // provider enum
} from '@/lib/structure';
import { SpCoinPanelTree } from '@/lib/structure/exchangeContext/types/PanelNode';

/**
 * Represents a generic wallet/account entity that can appear in selectors/panels.
 */
export interface WalletAccount {
  name: string;
  symbol: string;
  type: string;
  website: string;
  description: string;
  status: STATUS;
  address: Address;
  logoURL?: string;
  balance: bigint;
}

/** Who to claim rewards for */
export enum AccountType {
  SPONSOR = 'SPONSOR',
  RECIPIENT = 'RECIPIENT',
  AGENT = 'AGENT',
  ALL = 'ALL',
}


/**
 * Useful for inputs where the raw string may still be in flight before validation.
 */
export interface AccountAddress {
  address: string | Address;
}

/**
 * Uniform error shape for UI & API errors.
 */
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

/**
 * All known accounts tracked by the app.
 */
export type Accounts = {
  connectedAccount?: WalletAccount;
  sponsorAccount?: WalletAccount;
  recipientAccount?: WalletAccount;
  agentAccount?: WalletAccount;
  sponsorAccounts?: WalletAccount[];
  recipientAccounts?: WalletAccount[];
  agentAccounts?: WalletAccount[];
};

/**
 * ✅ Settings for view/panel management and API provider choice.
 * - `apiTradingProvider` selects the quote/route provider (e.g., 0x, 1inch).
 * - `spCoinPanelTree` persists the full panel tree (new visibility model).
 */
export type Settings = {
  /** Which backend to use for trading operations */
  apiTradingProvider: API_TRADING_PROVIDER;

  /**
   * New visibility model: full panel tree persisted in settings.
   * Always present after hydration (provider seeds it from defaults).
   */
  spCoinPanelTree: SpCoinPanelTree;
};

/** (Legacy alias – kept only if you still import it elsewhere) */
export type DisplaySettings = Settings;

export type NetworkElement = {
  connected: boolean;
  appChainId: number;
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
} as const;
