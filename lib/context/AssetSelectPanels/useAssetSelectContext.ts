// File: lib/context/ScrollSelectPanels/useAssetSelectContext.tsx
'use client';

import { createContext, useContext } from 'react';
import type {
  SP_COIN_DISPLAY,
  FEED_TYPE,
  TokenContract,
  WalletAccount,
} from '@/lib/structure';
import type { InputState } from '@/lib/structure/assetSelection';

// If you still use this elsewhere, keep it imported. Not needed for types below now.
// import { ValidatedAsset } from '@/lib/hooks/inputValidations/types/validationTypes';

export interface AssetSelectContextType {
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
  dumpAssetSelectContext: (header?: string) => void;

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

export const AssetSelectContext = createContext<AssetSelectContextType | undefined>(undefined);

export function useAssetSelectContext(): AssetSelectContextType {
  const context = useContext(AssetSelectContext);
  if (!context) {
    throw new Error('useAssetSelectContext must be used within a AssetSelectProvider');
  }
  return context;
}
