// File: lib/context/TradePanelProviders/TokenPanelProvider.tsx

'use client';

import React, { createContext, useContext, ReactNode } from 'react';

export const TokenPanelContext = createContext<any>(undefined);

export const TokenPanelProvider = ({ children }: { children: ReactNode }) => {
  return (
    <TokenPanelContext.Provider value={{}}>
      {children}
    </TokenPanelContext.Provider>
  );
};

export const useTokenPanelContext = () => {
  const ctx = useContext(TokenPanelContext);
  if (!ctx) throw new Error('❌ useTokenPanelContext must be used within a TokenPanelProvider');
  return ctx;
};
