// File: lib/context/ScrollSelectPanel/SharedPanelProvider.tsx
'use client';

import React, { createContext, useState, useContext, ReactNode } from 'react';
import { CONTAINER_TYPE, InputState, FEED_TYPE } from '@/lib/structure';
import { ValidatedAsset } from '@/lib/hooks/inputValidations/types/validationTypes';
import {
  validateHexInput as baseValidateHexInput,
  getInputStatusEmoji as baseGetEmoji,
} from '@/lib/hooks/inputValidations/helpers';

export interface SharedPanelContextValue {
  inputState: InputState;
  setInputState: (s: InputState) => void;

  activePanelFeed: FEED_TYPE;
  setActivePanelFeed: (f: FEED_TYPE) => void;

  activeContainerType: CONTAINER_TYPE;
  setActiveContainerType: (c: CONTAINER_TYPE) => void;

  containerType: CONTAINER_TYPE;
  setContainerType: (c: CONTAINER_TYPE) => void;

  feedType: FEED_TYPE;
  setFeedType: (f: FEED_TYPE) => void;

  inputValue: string;
  setInputValue: (v: string) => void;

  debouncedAddress: string;
  setDebouncedAddress: (v: string) => void;

  validateHexInput: (val: string) => boolean;
  getInputStatusEmoji: (state: InputState) => string;

  validatedAsset?: ValidatedAsset;
  setValidatedAsset?: (v: ValidatedAsset) => void;

  instanceId: string;
}

export const SharedPanelContext = createContext<SharedPanelContextValue | undefined>(undefined);

export function SharedPanelProvider({ children }: { children: ReactNode }) {
  const [inputState, setInputState] = useState<InputState>(InputState.EMPTY_INPUT);
  const [activePanelFeed, setActivePanelFeed] = useState<FEED_TYPE>(FEED_TYPE.TOKEN_LIST);
  const [activeContainerType, setActiveContainerType] = useState<CONTAINER_TYPE>(CONTAINER_TYPE.SELL_SELECT_CONTAINER);
  const [containerType, setContainerType] = useState<CONTAINER_TYPE>(CONTAINER_TYPE.SELL_SELECT_CONTAINER);
  const [feedType, setFeedType] = useState<FEED_TYPE>(FEED_TYPE.TOKEN_LIST);

  const [inputValue, setInputValue] = useState('');
  const [debouncedAddress, setDebouncedAddress] = useState('');
  const [validatedAsset, setValidatedAsset] = useState<ValidatedAsset | undefined>(undefined);

  const instanceId = `${Date.now().toString(36)}-${Math.floor(Math.random() * 10000)}`;

  const contextValue: SharedPanelContextValue = {
    inputState,
    setInputState,
    activePanelFeed,
    setActivePanelFeed,
    activeContainerType,
    setActiveContainerType,
    containerType,
    setContainerType,
    feedType,
    setFeedType,
    inputValue,
    setInputValue,
    debouncedAddress,
    setDebouncedAddress,
    validateHexInput: baseValidateHexInput,
    getInputStatusEmoji: baseGetEmoji,
    validatedAsset,
    setValidatedAsset,
    instanceId,
  };

  return (
    <SharedPanelContext.Provider value={contextValue}>
      {children}
    </SharedPanelContext.Provider>
  );
}

// ✅ Consumer hook
export default function useSharedPanelContext(): SharedPanelContextValue {
  const context = useContext(SharedPanelContext);
  if (!context) {
    throw new Error('useSharedPanelContext must be used within a SharedPanelProvider');
  }
  return context;
}
