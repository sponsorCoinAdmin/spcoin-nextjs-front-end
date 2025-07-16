'use client';

import React, { useState, ReactNode } from 'react';
import { CONTAINER_TYPE, FEED_TYPE, TokenContract } from '@/lib/structure';
import { TradePanelContext } from './useTradePanelContext';

export const BuyTradePanelProvider = ({ children }: { children: ReactNode }) => {
  const [localTokenContract, setLocalTokenContract] = useState<TokenContract | undefined>(undefined);
  const [localAmount, setLocalAmount] = useState<bigint>(0n);

  const dumpTokenContext = (headerInfo?: string) => {
    console.log(`🛠️ [BuyTradePanelProvider Dump] ${headerInfo || ''}`, {
      localTokenContract,
      localAmount,
      containerType: CONTAINER_TYPE.BUY_SELECT_CONTAINER,
      feedType: FEED_TYPE.TOKEN_LIST,
    });
  };

  return (
    <TradePanelContext.Provider
      value={{
        localTokenContract,
        setLocalTokenContract,
        localAmount,
        setLocalAmount,
        containerType: CONTAINER_TYPE.BUY_SELECT_CONTAINER,
        dumpTokenContext,
      }}
    >
      {children}
    </TradePanelContext.Provider>
  );
};
