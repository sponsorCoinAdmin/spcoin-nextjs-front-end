'use client';

import React, {
  createContext,
  useContext,
  useMemo,
  useEffect,
  useState,
} from 'react';

import {
  InputState,
  CONTAINER_TYPE,
  getInputStateString,
  TokenContract,
  WalletAccount,
  FEED_TYPE,
} from '@/lib/structure';

import { useBaseSelectShared } from '@/lib/hooks/useBaseSelectShared';
import { createDebugLogger } from '@/lib/utils/debugLogger';
import { ValidatedAsset } from '@/lib/hooks/inputValidations/types/validationTypes';

const LOG_TIME = false;
const DEBUG_ENABLED = process.env.NEXT_PUBLIC_DEBUG_LOG_SCROLL_PANEL_CONTEXT === 'true';
const debugLog = createDebugLogger('ScrollPanelContext', DEBUG_ENABLED, LOG_TIME);

declare global {
  interface Window {
    __scrollPanelDebug?: any;
  }
}

export interface SharedPanelContextType {
  inputState: InputState;
  setInputState: (state: InputState) => void;
  validatedAsset?: ValidatedAsset;
  setValidatedAsset?: (asset: ValidatedAsset) => void;
  containerType: CONTAINER_TYPE;
  onSelect?: (item: ValidatedAsset, state: InputState) => void;
  inputValue: string;
  debouncedAddress: string;
  onChange: (val: string) => void;
  validateHexInput: (val: string) => void;
  getInputStatusEmoji: (state: InputState) => string;
  feedType: FEED_TYPE;
}

const SharedPanelContext = createContext<SharedPanelContextType | undefined>(undefined);

function getFeedTypeFromContainer(containerType: CONTAINER_TYPE): FEED_TYPE {
  switch (containerType) {
    case CONTAINER_TYPE.BUY_SELECT_CONTAINER:
    case CONTAINER_TYPE.SELL_SELECT_CONTAINER:
      return FEED_TYPE.TOKEN_LIST;
    case CONTAINER_TYPE.RECIPIENT_SELECT_CONTAINER:
      return FEED_TYPE.RECIPIENT_ACCOUNTS;
    case CONTAINER_TYPE.AGENT_SELECT_CONTAINER:
      return FEED_TYPE.AGENT_ACCOUNTS;
    default:
      return FEED_TYPE.TOKEN_LIST;
  }
}

export const SharedPanelProvider = ({
  children,
  containerType,
  onSelect,
}: {
  children: React.ReactNode;
  containerType: CONTAINER_TYPE;
  onSelect?: (item: ValidatedAsset, state: InputState) => void;
}) => {
  const shared = useBaseSelectShared(containerType); // ✅ FIXED: pass containerType, not feedType
  const feedType = getFeedTypeFromContainer(containerType);
  const [validatedAsset, setValidatedAsset] = useState<ValidatedAsset>();

  useEffect(() => {
    debugLog.log(
      `📦 SharedPanelProvider mount: containerType=${containerType}, inputState=${getInputStateString(
        shared.inputState
      )}`
    );
    window.__scrollPanelDebug = {
      containerType,
      inputState: shared.inputState,
    };
  }, []);

  useEffect(() => {
    debugLog.log(`🔁 inputState updated → ${getInputStateString(shared.inputState)}`);
    if (window.__scrollPanelDebug) {
      window.__scrollPanelDebug.inputState = shared.inputState;
    }
  }, [shared.inputState]);

  const value = useMemo<SharedPanelContextType>(() => ({
    inputState: shared.inputState,
    setInputState: (state: InputState) => {
      debugLog.log(`📝 setInputState called → ${getInputStateString(state)}`);
      shared.setInputState(state);
    },
    validatedAsset,
    setValidatedAsset,
    containerType,
    onSelect,
    inputValue: shared.inputValue,
    debouncedAddress: shared.debouncedAddress,
    onChange: shared.onChange,
    validateHexInput: shared.validateHexInput,
    getInputStatusEmoji: shared.getInputStatusEmoji,
    feedType: feedType,
  }), [
    shared.inputState,
    shared.setInputState,
    validatedAsset,
    containerType,
    onSelect,
    shared.inputValue,
    shared.debouncedAddress,
    shared.onChange,
    shared.validateHexInput,
    shared.getInputStatusEmoji,
    feedType,
  ]);

  return (
    <SharedPanelContext.Provider value={value}>
      {children}
    </SharedPanelContext.Provider>
  );
};

export const useSharedPanelContext = (): SharedPanelContextType => {
  const ctx = useContext(SharedPanelContext);
  if (!ctx) throw new Error('❌ useSharedPanelContext must be used within a SharedPanelProvider');
  return ctx;
};
