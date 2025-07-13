// File: lib/context/TradePanelProviders/useTradePanelContext.ts

'use client';

import { createContext, useContext } from 'react';
import { InputState, CONTAINER_TYPE, FEED_TYPE, TokenContract } from '@/lib/structure';
import { ValidatedAsset } from '@/lib/hooks/inputValidations/types/validationTypes';

export interface TradePanelContextType {
  inputState: InputState;
  setInputState: (state: InputState) => void;

  validatedAsset?: ValidatedAsset;
  setValidatedAsset: (asset: ValidatedAsset | undefined) => void;

  localTokenContract?: TokenContract;
  setLocalTokenContract: (token: TokenContract | undefined) => void;

  localAmount: bigint;
  setLocalAmount: (amount: bigint) => void;

  containerType: CONTAINER_TYPE;
  feedType: FEED_TYPE;

  dumpContext: (headerInfo?: string) => void;
}

export const TradePanelContext = createContext<TradePanelContextType | undefined>(undefined);

export const useTradePanelContext = (): TradePanelContextType => {
  const ctx = useContext(TradePanelContext);
  if (!ctx) throw new Error('❌ useTradePanelContext must be used within a TradePanelProvider');
  return ctx;
};
