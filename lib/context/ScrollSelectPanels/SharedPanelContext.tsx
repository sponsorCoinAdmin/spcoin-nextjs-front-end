// File: lib/context/ScrollSelectPanels/SharedPanelContext.tsx

'use client';

import { createContext, useContext } from 'react';
import { InputState, CONTAINER_TYPE, FEED_TYPE } from '@/lib/structure';
import { ValidatedAsset } from '@/lib/hooks/inputValidations/types/validationTypes';

export interface SharedPanelContextType {
  validatedAsset?: ValidatedAsset;
  setValidatedAsset?: (asset: ValidatedAsset) => void;
  containerType: CONTAINER_TYPE;
  inputState: InputState;
  setInputState: (state: InputState) => void;
  feedType: FEED_TYPE;
}

export const SharedPanelContext = createContext<SharedPanelContextType | undefined>(undefined);

export const useSharedPanelContext = (): SharedPanelContextType => {
  const ctx = useContext(SharedPanelContext);
  if (!ctx) {
    throw new Error('❌ useSharedPanelContext must be used within a Panel Provider');
  }
  return ctx;
};
