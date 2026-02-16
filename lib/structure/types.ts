// File: @/lib/structure/types.ts

import type { Address } from 'viem';
import type { UseReadContractReturnType } from 'wagmi';
import type {
  STATUS,
  TRADE_DIRECTION,
  API_TRADING_PROVIDER,
  SP_COIN_DISPLAY, // provider enum
} from '@/lib/structure';
import type { SpCoinPanelTree } from '@/lib/structure/exchangeContext/types/PanelNode';
import { FEED_TYPE } from '@/lib/structure';

/**
 * Represents a generic wallet/account entity that can appear in selectors/panels.
 */
export interface spCoinAccount {
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
  activeAccount?: spCoinAccount;
  sponsorAccount?: spCoinAccount;
  recipientAccount?: spCoinAccount;
  agentAccount?: spCoinAccount;
  sponsorAccounts?: spCoinAccount[];
  recipientAccounts?: spCoinAccount[];
  agentAccounts?: spCoinAccount[];
};

/**
 * ✅ Settings for view/panel management and API provider choice.
 * - `apiTradingProvider` selects the quote/route provider (e.g., 0x, 1inch).
 * - `spCoinPanelTree` is runtime panel tree state.
 *
 * ✅ Persisted NAV stack is now readable in Local Storage:
 *   - id is authoritative
 *   - name is derived (non-authoritative)
 */
export type DISPLAY_STACK_NODE = {
  id: SP_COIN_DISPLAY; // authoritative
  name: string; // derived / non-authoritative
};

export type Settings = {
  /** Which backend to use for trading operations */
  apiTradingProvider: API_TRADING_PROVIDER;

  /** Persisted panel tree */
  spCoinPanelTree: SpCoinPanelTree;

  /**
   * Persisted visible members list (compact storage shape).
   * Presence in this list means visible=true.
   */
  visiblePanelTreeMembers?: Array<{
    panel: SP_COIN_DISPLAY;
    name: string;
  }>;

  /** Persisted stack of navigated panels (authoritative id, derived name) */
  displayStack: DISPLAY_STACK_NODE[];

  /**
   * True if this ExchangeContext was hydrated from Local Storage on boot.
   * False or undefined means "started from defaults" (no LS data).
   */
  hydratedFromLocalStorage?: boolean;

  /** Show/hide testnets in network selector dropdown. */
  showTestNets?: boolean;

  /** Test page UI selection persisted across reloads (mutually exclusive flags). */
  testPage?: {
    TEST_PAGE_EXCHANGE_CONTEXT: boolean;
    TEST_PAGE_FSM_TRACE: boolean;
    TEST_PAGE_ACCOUNT_LISTS: boolean;
    TEST_PAGE_TO_DOS: boolean;
    TEST_PAGE_TOKEN_LISTS: boolean;
    accountFilter?: string;
    tokenFilter?: string;
    tokenListNetwork?: string;
    panelLayout?: string;
  };
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
  previewTokenContract?: TokenContract;
  previewTokenSource?: 'BUY' | 'SELL' | null;
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
  activeAccountAddr?: string;
  sellAmount?: string;
  sellToken: Address | string;
  slippageBps?: number;
}

export const ERROR_CODES = {
  CHAIN_SWITCH: 1001,
  PRICE_FETCH_ERROR: 2001,
  INVALID_TOKENS: 3001,
} as const;


// ✅ Expand union to include SPONSOR + manage feeds
export type AccountFeedType =
  | FEED_TYPE.RECIPIENT_ACCOUNTS
  | FEED_TYPE.AGENT_ACCOUNTS
  | FEED_TYPE.SPONSOR_ACCOUNTS
  | FEED_TYPE.MANAGE_RECIPIENTS
  | FEED_TYPE.MANAGE_AGENTS;

export type TokenFeedType = FEED_TYPE.TOKEN_LIST;

// ✅ Optional debug metadata we can attach without breaking UI
export type FeedDebugMeta = {
  sourceId?: string;        // e.g. "@/resources/data/mockFeeds/accounts/sponsors/accounts.json"
  sourceKind?: string;      // e.g. "bundled-resource" | "manage-json" | "remote-url"
  resolvedUrl?: string;     // if remote later
};

export type FeedData =
  | ({ feedType: TokenFeedType; tokens: TokenContract[] } & { __debug?: FeedDebugMeta })
  | ({ feedType: AccountFeedType; spCoinAccounts: spCoinAccount[] } & { __debug?: FeedDebugMeta });
