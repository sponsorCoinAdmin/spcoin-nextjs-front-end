// File: lib/context/TradePanelProviders/useTokenPanelContext.ts
'use client';

import { createContext, useContext } from 'react';
import { SP_COIN_DISPLAY_NEW, TokenContract } from '@/lib/structure';

export interface TokenPanelContextType {
  localTokenContract?: TokenContract;
  setLocalTokenContract: (token: TokenContract | undefined) => void;

  localAmount: bigint;
  setLocalAmount: (amount: bigint) => void;

  dumpTokenContext: (headerInfo?: string) => void;
  containerType: SP_COIN_DISPLAY_NEW;
}

export const TokenPanelContext = createContext<TokenPanelContextType | undefined>(undefined);

export const useTokenPanelContext = (): TokenPanelContextType => {
  const ctx = useContext(TokenPanelContext);
  if (!ctx) throw new Error('❌ useTokenPanelContext must be used within a TokenPanelProvider');
  return ctx;
};
