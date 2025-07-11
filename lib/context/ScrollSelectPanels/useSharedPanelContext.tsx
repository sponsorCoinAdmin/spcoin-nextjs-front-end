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
  validHexInput: string;
  failedHexInput?: string;
  isValidHexInput: (raw: string) => boolean;
  debouncedHexInput: string;
  resetHexInput: () => void;  // ✅ added here
  dumpInputFeedContext: () => void;
}

// Combined type with unified dump
export type SharedPanelContextType = FSMContextType &
  FeedContextType & {
    /** Combined debug dump of both FSM and InputFeed contexts */
    dumpPanelContext: () => void;
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
