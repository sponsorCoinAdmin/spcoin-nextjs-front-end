// File: lib/context/TradePanelProviders/SellTradePanelProvider.tsx

'use client';

import React, { useState, ReactNode } from 'react';
import { CONTAINER_TYPE, FEED_TYPE, InputState, TokenContract } from '@/lib/structure';
import { TokenPanelContext } from './useTokenPanelContext';

export const SellTokenPanelProvider = ({ children }: { children: ReactNode }) => {
  const [inputState, setInputState] = useState<InputState>(InputState.EMPTY_INPUT);
  const [validatedAsset, setValidatedAsset] = useState<any>(undefined);

  // ✅ ADD HERE
  const [localTokenContract, setLocalTokenContract] = useState<TokenContract | undefined>(undefined);
  const [localAmount, setLocalAmount] = useState<bigint>(0n);

  const dumpTokenContext = (headerInfo?: string) => {
    console.log(`🛠️ [SellTradePanelProvider Dump] ${headerInfo || ''}`, {
      inputState,
      validatedAsset,
      localTokenContract,
      localAmount,
      containerType: CONTAINER_TYPE.SELL_SELECT_CONTAINER,
      feedType: FEED_TYPE.TOKEN_LIST,
    });
  };

  return (
    <TokenPanelContext.Provider
      value={{
        inputState,
        setInputState,
        validatedAsset,
        setValidatedAsset,
        localTokenContract,
        setLocalTokenContract,
        localAmount,
        setLocalAmount,
        containerType: CONTAINER_TYPE.SELL_SELECT_CONTAINER,
        feedType: FEED_TYPE.TOKEN_LIST,
        dumpTokenContext,
      }}
    >
      {children}
    </TokenPanelContext.Provider>
  );
};
