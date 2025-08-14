// File: lib/context/ScrollSelectPanels/useAssetSelectionContext.tsx
'use client';

import { createContext, useContext } from 'react';
import {
  InputState,
  SP_COIN_DISPLAY,
  FEED_TYPE,
  TokenContract,
  WalletAccount,
} from '@/lib/structure';

// If you still use this elsewhere, keep it imported. Not needed for types below now.
// import { ValidatedAsset } from '@/lib/hooks/inputValidations/types/validationTypes';

export interface AssetSelectionContextType {
  // FSM state and setters
  inputState: InputState;
  setInputState: (state: InputState, source?: string) => void; // ✅ source optional

  // Validated asset (token panel)
  validatedAsset?: TokenContract; // ✅ narrowed to match provider
  setValidatedAsset: (asset: TokenContract | undefined) => void; // ✅ narrowed to match provider

  // Manual entry toggle
  manualEntry: boolean;
  setManualEntry: (manual: boolean) => void;

  // Final validated token or wallet
  setValidatedToken: (token?: TokenContract) => void;
  setValidatedWallet: (wallet?: WalletAccount) => void;

  // Dump tools
  dumpFSMContext: (header?: string) => void;
  dumpAssetSelectionContext: (header?: string) => void;

  // Hex input + state
  validHexInput: string;
  debouncedHexInput: string;
  failedHexInput?: string;
  failedHexCount: number;
  isValid: boolean;
  isValidHexString: (input: string) => boolean;
  handleHexInputChange: (raw: string, isManual?: boolean) => boolean;
  resetHexInput: () => void;
  dumpInputFeedContext: (header?: string) => void;

  // Identity and callbacks
  containerType: SP_COIN_DISPLAY;
  feedType: FEED_TYPE;
  closePanelCallback: () => void;
  setTradingTokenCallback: (token: TokenContract) => void;
  instanceId?: string;
}

export const AssetSelectionContext = createContext<AssetSelectionContextType | undefined>(undefined);

export function useAssetSelectionContext(): AssetSelectionContextType {
  const context = useContext(AssetSelectionContext);
  if (!context) {
    throw new Error('useAssetSelectionContext must be used within a AssetSelectionProvider');
  }
  return context;
}
