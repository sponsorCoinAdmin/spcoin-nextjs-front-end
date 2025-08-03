// File: lib/context/ScrollSelectPanels/useSharedPanelContext.tsx

'use client';

import { createContext, useContext } from 'react';
import {
  InputState,
  SP_COIN_DISPLAY,
  FEED_TYPE,
  TokenContract,
  WalletAccount,
} from '@/lib/structure';

import { ValidatedAsset } from '@/lib/hooks/inputValidations/types/validationTypes';

export interface SharedPanelContextType {
  // FSM state and setters
  inputState: InputState;
  setInputState: (state: InputState, source: string) => void;
  validatedAsset?: ValidatedAsset;
  setValidatedAsset: (asset: ValidatedAsset | undefined) => void;

  // Manual entry toggle
  manualEntry: boolean;
  setManualEntry: (manual: boolean) => void;

  // Final validated token or wallet
  setValidatedToken: (token?: TokenContract) => void;
  setValidatedWallet: (wallet?: WalletAccount) => void;

  // Dump tools
  dumpFSMContext: (header?: string) => void;
  dumpSharedPanelContext: (header?: string) => void;

  // Hex input + state
  validHexInput: string;
  debouncedHexInput: string;
  failedHexInput?: string;
  failedHexCount: number;
  isValid: boolean;
  isValidHexString: (input: string) => boolean; // ✅ fixed: now correctly typed as a function
  handleHexInputChange: (raw: string, isManual?: boolean) => boolean;
  resetHexInput: () => void;
  dumpInputFeedContext: (header?: string) => void;

  // Identity and callbacks
  containerType: SP_COIN_DISPLAY;
  feedType: FEED_TYPE;
  closeCallback: () => void;
  setTradingTokenCallback: (token: TokenContract) => void;
  instanceId?: string;
}

export const SharedPanelContext = createContext<SharedPanelContextType | undefined>(undefined);

export function useSharedPanelContext(): SharedPanelContextType {
  const context = useContext(SharedPanelContext);
  if (!context) {
    throw new Error('useSharedPanelContext must be used within a SharedPanelProvider');
  }
  return context;
}
