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
  containerType: SP_COIN_DISPLAY;
  sellAddress?: string;
  buyAddress?: string;
  chainId: number;
  publicClient: any;
  accountAddress?: Address;
  seenBrokenLogos: Set<string>;
  feedType: FEED_TYPE;
  validatedAsset?: TokenContract | WalletAccount;
}

/**
 * Output returned by the FSM core validation processor.
 */
export interface ValidateFSMOutput {
  nextState: InputState;
  validatedAsset?: TokenContract | WalletAccount;
  updatedBalance?: bigint;
  errorMessage?: string;
}
