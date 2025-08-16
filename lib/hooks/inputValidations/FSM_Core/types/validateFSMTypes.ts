// File: lib/hooks/inputValidations/FSM_Core/types/validateFSMTypes.ts

import { Address, PublicClient } from 'viem';
import { FEED_TYPE, SP_COIN_DISPLAY, TokenContract, WalletAccount } from '@/lib/structure';
import { InputState } from '@/lib/structure/assetSelection';

export type AnyAsset = TokenContract | WalletAccount;

/** Core FSM input (non-generic, feed-agnostic) */
export type ValidateFSMInput = {
  /** Current FSM state being processed */
  inputState: InputState;

  /** Debounced user input (hex address, etc.) */
  debouncedHexInput: string;

  /** From input hook */
  isValid: boolean;
  failedHexInput?: string;

  /** Environment / routing */
  containerType: SP_COIN_DISPLAY;
  feedType: FEED_TYPE;                // ✅ broadened: no literal member type
  chainId: number;
  publicClient: PublicClient | any;
  accountAddress: Address;            // runner supplies zeroAddress if absent

  /** Opposite side’s committed address (BUY panel gets SELL’s, SELL panel gets BUY’s) */
  peerAddress?: string;

  /** Whether input was typed (true) vs chosen from list (false) */
  manualEntry?: boolean;

  /** Side-effects (validators may call these) */
  setValidatedAsset?: (asset: AnyAsset | undefined) => void;
  setTradingTokenCallback?: (token: AnyAsset | any) => void;
  closePanelCallback?: (fromUser: boolean) => void;

  /** Data validators may read or populate (asset-only standard) */
  validatedAsset?: Partial<AnyAsset>;
  resolvedAsset?: Partial<AnyAsset>;

  /**
   * Per-step patches returned by validators; the runner merges these
   * into an accumulator and commits once at the end.
   */
  assetPatch?: Partial<AnyAsset>;

  /** Utilities */
  seenBrokenLogos?: Set<string>;

  /** Optional incoming trace (if caller threads it) */
  stateTrace?: InputState[];
};

/** Core FSM output (asset-only standard) */
export type ValidateFSMOutput = {
  nextState: InputState;
  errorMessage?: string;

  /** Minimal changes from this step; runner merges into an accumulator */
  assetPatch?: Partial<AnyAsset>;

  /** Trace helpers (optional) */
  stateTrace?: InputState[];
  humanTraceSummary?: string;
};
