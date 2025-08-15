// File: lib/hooks/inputValidations/FSM_Core/types/validateFSMTypes.ts

import {
  SP_COIN_DISPLAY,
  FEED_TYPE,
  TokenContract,
  WalletAccount,
} from '@/lib/structure';
import type { Address, PublicClient } from 'viem';
import { InputState } from '@/lib/structure/assetSelection';

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
  feedType: FEED_TYPE;
  chainId: number;
  publicClient: PublicClient | any;
  accountAddress: Address; // runner supplies zeroAddress if absent

  /** Opposite side’s committed address (BUY panel gets SELL’s, SELL panel gets BUY’s) */
  peerAddress?: string;
  manualEntry?: boolean;   // 👈 ensure this exists
  /** Side-effect callbacks (executed by FSM tests) */
  setValidatedAsset?: (asset: WalletAccount | TokenContract | undefined) => void;
  setTradingTokenCallback?: (token: TokenContract | any) => void;
  closePanelCallback?: (fromUser: boolean) => void;

  /** Data that tests may read or populate */
  validatedToken?: TokenContract | any;
  validatedWallet?: WalletAccount | any;
  validatedAsset?: WalletAccount | TokenContract | any;
  resolvedAsset?: any;
  resolvedToken?: any;

  /** Utilities */
  seenBrokenLogos?: Set<string>;

  /** Optional incoming trace (if caller threads it) */
  stateTrace?: InputState[];
};

export type ValidateFSMOutput = {
  /** Next state to enter */
  nextState: InputState;

  /** Optional error message for logging/UI */
  errorMessage?: string;

  /** Optional data produced by tests */
  validatedToken?: TokenContract | any;
  validatedAsset?: WalletAccount | TokenContract | any;

  /** Optional outgoing trace/human summary (if core chooses to supply) */
  stateTrace?: InputState[];
  humanTraceSummary?: string;
};
