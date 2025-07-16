// File: lib/context/TradePanelProviders/useTradePanelContext.ts

'use client';

import { createContext, useContext } from 'react';
import { TokenContract, CONTAINER_TYPE } from '@/lib/structure';

export interface TradePanelContextType {
  localTokenContract?: TokenContract;
  setLocalTokenContract: (token: TokenContract | undefined) => void;

  localAmount: bigint;
  setLocalAmount: (amount: bigint) => void;

  containerType: CONTAINER_TYPE;  // ✅ NEW: identifies SELL or BUY container

  dumpTokenContext: (headerInfo?: string) => void;
}

export const TradePanelContext = createContext<TradePanelContextType | undefined>(undefined);

export const useTradePanelContext = (): TradePanelContextType => {
  const ctx = useContext(TradePanelContext);
  if (!ctx) throw new Error('❌ useTradePanelContext must be used within a TokenPanelProvider');
  return ctx;
};
