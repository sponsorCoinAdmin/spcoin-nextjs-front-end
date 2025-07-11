// File: lib/context/ScrollSelectPanels/useSharedPanelContext.tsx

'use client';

import { createContext, useContext } from 'react';
import { InputState, CONTAINER_TYPE, FEED_TYPE } from '@/lib/structure';
import { ValidatedAsset } from '@/lib/hooks/inputValidations/types/validationTypes';

export interface FSMContextType {
  inputState: InputState;
  setInputState: (state: InputState) => void;
  validatedAsset?: ValidatedAsset;
  setValidatedAsset: (asset: ValidatedAsset | undefined) => void;
  containerType: CONTAINER_TYPE;
  feedType: FEED_TYPE;
  dumpFSMContext: () => void;
}

export interface FeedContextType {
  validHexInput: string;                                // ✅ immediate input value
  debouncedHexInput: string;                            // ✅ debounced input value
  failedHexInput?: string;                              // ✅ last invalid input (optional)
  isValid: boolean;                                     // ✅ NEW: reactive boolean for last validation result
  handleHexInputChange: (raw: string, isManual?: boolean) => boolean; // ✅ input handler, returns validity
  resetHexInput: () => void;                            // ✅ clears input + error state
  failedHexCount: number;                               // ✅ count of consecutive invalid attempts
  isValidHexString: (raw: string) => boolean;           // ✅ pure validator, no state change
  dumpInputFeedContext: () => void;                     // ✅ debug helper
}

// Combined type with unified dump + optional manager methods
export type SharedPanelContextType = FSMContextType &
  FeedContextType & {
    /** Combined debug dump of both FSM and InputFeed contexts */
    dumpPanelContext: () => void;

    /** Optional manager actions */
    forceReset?: () => void;
    forceClose?: () => void;
  };

// Context setup
export const SharedPanelContext = createContext<SharedPanelContextType | undefined>(undefined);

export const useSharedPanelContext = (): SharedPanelContextType => {
  const ctx = useContext(SharedPanelContext);
  if (!ctx) {
    throw new Error('❌ useSharedPanelContext must be used within a Panel Provider');
  }
  return ctx;
};
