// File: lib/context/ScrollSelectPanels/SharedPanelContext.tsx
'use client';

import { createContext, useContext } from 'react';
import { InputState, CONTAINER_TYPE, FEED_TYPE } from '@/lib/structure';
import { ValidatedAsset } from '@/lib/hooks/inputValidations/types/validationTypes';

export interface SharedPanelContextType {
  // FSM
  inputState: InputState;
  setInputState: (state: InputState) => void;

  validatedAsset?: ValidatedAsset;
  setValidatedAsset?: (asset: ValidatedAsset | undefined) => void;

  // Panel identity
  containerType: CONTAINER_TYPE;
  feedType: FEED_TYPE;

  // Hex‐input state + setters
  validHexInput: string;
  failedHexInput?: string;
  failedHexCount: number;
  isValidHexInput: (raw: string) => boolean;
  resetHexInput: () => void;
  setValidHexInput: (raw: string) => void;
  setFailedHexInput: (raw?: string) => void;

  // Debounced version
  debouncedHexInput: string;

  // Convenience
  handleHexInputChange: (raw: string) => void;
}

export const SharedPanelContext = createContext<SharedPanelContextType | undefined>(undefined);

export const useSharedPanelContext = (): SharedPanelContextType => {
  const ctx = useContext(SharedPanelContext);
  if (!ctx) throw new Error('❌ useSharedPanelContext must be used within a Panel Provider');
  return ctx;
};
