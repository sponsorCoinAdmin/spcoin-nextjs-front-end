// File: lib/context/ScrollSelectPanels/useSharedPanelContext.tsx
'use client';

import { createContext, useContext } from 'react';
import { InputState, CONTAINER_TYPE, FEED_TYPE } from '@/lib/structure';
import { ValidatedAsset } from '@/lib/hooks/inputValidations/types/validationTypes';

/**
 * FSM state and control context
 */
export interface FSMContextType {
  inputState: InputState;
  setInputState: (state: InputState) => void;
  validatedAsset?: ValidatedAsset;
  setValidatedAsset: (asset: ValidatedAsset | undefined) => void;
  containerType: CONTAINER_TYPE;
  feedType: FEED_TYPE;
  dumpFSMContext: (headerInfo?: string) => void;
  /** 🆔 Unique instance ID for debugging */
  instanceId?: string;  // ← ADD THIS LINE
}

/**
 * Input feed state and control context
 */
export interface FeedContextType {
  validHexInput: string;
  debouncedHexInput: string;
  failedHexInput?: string;
  isValid: boolean;
  handleHexInputChange: (raw: string, isManual?: boolean) => boolean;
  resetHexInput: () => void;
  failedHexCount: number;
  isValidHexString: (raw: string) => boolean;
  dumpInputFeedContext: (headerInfo?: string) => void;
}

/**
 * Combined shared panel context
 */
export type SharedPanelContextType = FSMContextType &
  FeedContextType & {
    dumpSharedPanelContext: (headerInfo?: string) => void;
    forceReset?: () => void;
    forceClose?: () => void;
  };

export const SharedPanelContext = createContext<SharedPanelContextType | undefined>(undefined);

/**
 * Hook to safely consume SharedPanelContext
 */
export const useSharedPanelContext = (): SharedPanelContextType => {
  const ctx = useContext(SharedPanelContext);
  if (!ctx) {
    throw new Error('❌ useSharedPanelContext must be used within a SharedPanelProvider');
  }
  return ctx;
};
