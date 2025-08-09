// File: lib/hooks/inputValidations/FSM_Core/validateFSMTypes.ts

import { Address } from 'viem';
import {
  InputState,
  SP_COIN_DISPLAY,
  FEED_TYPE,
  TokenContract,
  WalletAccount,
} from '@/lib/structure';

/**
 * Input parameters passed into the FSM validation core function.
 */
export interface ValidateFSMInput {
  inputState: InputState;
  debouncedHexInput: string;

  /** From useHexInput: whether the current input is hex-valid */
  isValid: boolean;

  /** From useHexInput: most recent invalid input fragment (if any) */
  failedHexInput?: string;

  seenBrokenLogos: Set<string>;
  containerType: SP_COIN_DISPLAY;
  feedType: FEED_TYPE;
  sellAddress?: string;
  buyAddress?: string;
  chainId: number;
  publicClient: any;
  accountAddress: Address;
  validatedToken?: TokenContract;
  validatedWallet?: WalletAccount;

  /** 👣 Optional trace of previous FSM states */
  stateTrace?: InputState[];

  /** 🧑‍💻 True if the user typed the input manually */
  manualEntry: boolean;
}

/**
 * Output returned by the FSM core validation processor.
 */
export interface ValidateFSMOutput {
  nextState: InputState;
  validatedToken?: TokenContract;
  validatedWallet?: WalletAccount;
  errorMessage?: string;

  /** 👣 Debug trace of visited states */
  stateTrace?: InputState[];

  /** 🧭 Human-readable summary of states */
  humanTraceSummary?: string;
}
