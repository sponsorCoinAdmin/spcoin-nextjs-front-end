// File: lib/context/TradePanelProviders/useTokenPanelContext.ts

'use client';

import { createContext, useContext } from 'react';
import { InputState, CONTAINER_TYPE, FEED_TYPE, TokenContract } from '@/lib/structure';
import { ValidatedAsset } from '@/lib/hooks/inputValidations/types/validationTypes';

export interface TokenPanelContextType {
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

export const TokenPanelContext = createContext<TokenPanelContextType | undefined>(undefined);

export const useTokenPanelContext = (): TokenPanelContextType => {
  const ctx = useContext(TokenPanelContext);
  if (!ctx) throw new Error('❌ useTokenPanelContext must be used within a TradePanelProvider');
  return ctx;
};
