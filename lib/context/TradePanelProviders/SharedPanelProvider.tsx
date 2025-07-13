// File: lib/context/TradePanelProviders/SharedPanelProvider.tsx
// 
'use client';

import React, { createContext, useContext, ReactNode } from 'react';

export const SharedPanelContext = createContext<any>(undefined);

export const SharedPanelProvider = ({ children }: { children: ReactNode }) => {
  return (
    <SharedPanelContext.Provider value={{}}>
      {children}
    </SharedPanelContext.Provider>
  );
};

export const useSharedPanelContext = () => {
  const ctx = useContext(SharedPanelContext);
  if (!ctx) throw new Error('❌ useSharedPanelContext must be used within a SharedPanelProvider');
  return ctx;
};
