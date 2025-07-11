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
  dumpFSMContext: (headerInfo?: string) => void; // 🔧 updated here
}

export interface FeedContextType {
  validHexInput: string;
  debouncedHexInput: string;
  failedHexInput?: string;
  isValid: boolean;
  handleHexInputChange: (raw: string, isManual?: boolean) => boolean;
  resetHexInput: () => void;
  failedHexCount: number;
  isValidHexString: (raw: string) => boolean;
  dumpInputFeedContext: (headerInfo?: string) => void; // 🔧 updated here
}

export type SharedPanelContextType = FSMContextType &
  FeedContextType & {
    /** Combined debug dump of both FSM and InputFeed contexts */
    dumpPanelContext: (headerInfo?: string) => void; // 🔧 updated here

    /** Optional manager actions */
    forceReset?: () => void;
    forceClose?: () => void;
  };

export const SharedPanelContext = createContext<SharedPanelContextType | undefined>(undefined);

export const useSharedPanelContext = (): SharedPanelContextType => {
  const ctx = useContext(SharedPanelContext);
  if (!ctx) {
    throw new Error('❌ useSharedPanelContext must be used within a Panel Provider');
  }
  return ctx;
};
