// File: lib/context/TradePanelProviders/TokenPanelProvider.tsx

'use client';

import React, { createContext, useContext, ReactNode, useState } from 'react';
import { TokenContract } from '@/lib/structure';

export interface TokenPanelContextType {
  localTokenContract?: TokenContract;
  setLocalTokenContract: (token: TokenContract | undefined) => void;

  localAmount: bigint;
  setLocalAmount: (amount: bigint) => void;

  dumpContext: (headerInfo?: string) => void;
}

export const TokenPanelContext = createContext<TokenPanelContextType | undefined>(undefined);

export const TokenPanelProvider = ({ children }: { children: ReactNode }) => {
  const [localTokenContract, setLocalTokenContract] = useState<TokenContract | undefined>(undefined);
  const [localAmount, setLocalAmount] = useState<bigint>(0n);

  const dumpContext = (headerInfo?: string) => {
    console.log(`🛠️ [TokenPanelProvider Dump] ${headerInfo || ''}`, {
      localTokenContract,
      localAmount,
    });
  };

  return (
    <TokenPanelContext.Provider
      value={{
        localTokenContract,
        setLocalTokenContract,
        localAmount,
        setLocalAmount,
        dumpContext,
      }}
    >
      {children}
    </TokenPanelContext.Provider>
  );
};

export const useTokenPanelContext = (): TokenPanelContextType => {
  const ctx = useContext(TokenPanelContext);
  if (!ctx) throw new Error('❌ useTokenPanelContext must be used within a TokenPanelProvider');
  return ctx;
};
