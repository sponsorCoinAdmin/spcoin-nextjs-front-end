// File: lib/hooks/inputValidations/FSM_Core/types/validateFSMTypes.ts

import { Address, PublicClient } from 'viem';
import {
  FEED_TYPE,
  SP_COIN_DISPLAY,
  TokenContract,
  WalletAccount,
} from '@/lib/structure';
import { InputState } from '@/lib/structure/assetSelection';

/** Map each FEED_TYPE to its asset shape */
export type AssetForFeed<F extends FEED_TYPE> =
  F extends FEED_TYPE.TOKEN_LIST
    ? TokenContract
    : F extends FEED_TYPE.AGENT_ACCOUNTS | FEED_TYPE.RECIPIENT_ACCOUNTS
      ? WalletAccount
      : never;

export type AnyAsset = TokenContract | WalletAccount;

/** Core FSM input (feed-aware via the generic F) */
export type ValidateFSMInput<F extends FEED_TYPE = FEED_TYPE.TOKEN_LIST> = {
  /** Current FSM state being processed */
  inputState: InputState;

  /** Debounced user input (hex address, etc.) */
  debouncedHexInput: string;

  /** From input hook */
  isValid: boolean;
  failedHexInput?: string;

  /** Environment / routing */
  containerType: SP_COIN_DISPLAY;
  feedType: F;
  chainId: number;
  publicClient: PublicClient | any;
  accountAddress: Address; // runner supplies zeroAddress if absent

  /** Opposite side’s committed address (BUY panel gets SELL’s, SELL panel gets BUY’s) */
  peerAddress?: string;
  manualEntry?: boolean;

  /** Side-effect callbacks (executed by FSM validators) */
  setValidatedAsset?: (asset: AnyAsset | undefined) => void;
  setTradingTokenCallback?: (token: TokenContract | any) => void;
  closePanelCallback?: (fromUser: boolean) => void;

  /** Data validators may read or populate (feed-shaped) */
  validatedAsset?: Partial<AssetForFeed<F>>;
  resolvedAsset?: Partial<AssetForFeed<F>>;

  /**
   * Patches returned by validators (runner merges into an accumulator
   * and commits once at the end).
   */
  assetPatch?: Partial<AssetForFeed<F>>;

  /** Utilities */
  seenBrokenLogos?: Set<string>;

  /** Optional incoming trace (if caller threads it) */
  stateTrace?: InputState[];
};

/** Core FSM output (feed-aware via the generic F) */
export type ValidateFSMOutput<F extends FEED_TYPE = FEED_TYPE.TOKEN_LIST> = {
  nextState: InputState;
  errorMessage?: string;

  /** The minimal changes from this step; runner merges into an accumulator */
  assetPatch?: Partial<AssetForFeed<F>>;

  /** Trace helpers (optional) */
  stateTrace?: InputState[];
  humanTraceSummary?: string;
};
