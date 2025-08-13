// File: lib/context/TradePanelProviders/TokenPanelProvider.tsx
'use client';

import React, { useState, ReactNode } from 'react';
import { SP_COIN_DISPLAY_NEW, FEED_TYPE, InputState, TokenContract } from '@/lib/structure';
import { TokenPanelContext } from './useTokenPanelContext';

interface Props {
  containerType: SP_COIN_DISPLAY_NEW;
  children: ReactNode;
}

export const TokenPanelProvider = ({ containerType, children }: Props) => {
  const [inputState, setInputState] = useState<InputState>(InputState.EMPTY_INPUT);
  const [validatedAsset, setValidatedAsset] = useState<any>(undefined);

  const [localTokenContract, setLocalTokenContract] = useState<TokenContract | undefined>(undefined);
  const [localAmount, setLocalAmount] = useState<bigint>(0n);

  const dumpTokenContext = (headerInfo?: string) => {
    console.log(`🛠️ [${SP_COIN_DISPLAY_NEW[containerType]} Dump] ${headerInfo || ''}`, {
      inputState,
      validatedAsset,
      localTokenContract,
      localAmount,
      containerType,
      feedType: FEED_TYPE.TOKEN_LIST,
    });
  };

  return (
    <TokenPanelContext.Provider
      value={{
        localTokenContract,
        setLocalTokenContract,
        localAmount,
        setLocalAmount,
        dumpTokenContext,
        containerType, // include in context if needed by consumers
      }}
    >
      {children}
    </TokenPanelContext.Provider>
  );
};
