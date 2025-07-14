// File: lib/context/ScrollSelectPanels/SharedPanelProvider.tsx

'use client';

import React, { ReactNode, useState } from 'react';
import { SharedPanelContext } from './useSharedPanelContext';
import { CONTAINER_TYPE, FEED_TYPE, InputState } from '@/lib/structure';

export const SharedPanelProvider = ({ children }: { children: ReactNode }) => {
  const [inputState, setInputState] = useState<InputState>(InputState.EMPTY_INPUT);
  const [validatedAsset, setValidatedAsset] = useState<any>(undefined);

  const contextValue = {
    inputState,
    setInputState,
    validatedAsset,
    setValidatedAsset,
    validHexInput: '',
    debouncedHexInput: '',
    failedHexInput: '',
    isValid: false,
    handleHexInputChange: () => false,
    resetHexInput: () => {},
    failedHexCount: 0,
    isValidHexString: () => false,
    dumpFSMContext: () => {},
    dumpInputFeedContext: () => {},
    dumpPanelContext: () => {},
    containerType: CONTAINER_TYPE.SELL_SELECT_CONTAINER, // ✅ enum, not string
    feedType: FEED_TYPE.TOKEN_LIST,                     // ✅ enum, not string
    forceReset: () => {},
    forceClose: () => {},
  };

  return (
    <SharedPanelContext.Provider value={contextValue}>
      {children}
    </SharedPanelContext.Provider>
  );
};
