// File: lib/context/ScrollSelectPanel/SharedPanelContext.tsx

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
  FEED_TYPE,
} from '@/lib/structure';

import { createDebugLogger } from '@/lib/utils/debugLogger';
import { ValidatedAsset } from '@/lib/hooks/inputValidations/types/validationTypes';
import { useDebouncedAddressInput } from '@/lib/hooks/useDebouncedAddressInput';

const LOG_TIME = false;
const DEBUG_ENABLED =
  process.env.NEXT_PUBLIC_DEBUG_LOG_SCROLL_PANEL_CONTEXT === 'true';
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
  inputValue: string;
  debouncedAddress: string;
  validateHexInput: (val: string) => void;
  getInputStatusEmoji: (state: InputState) => string;
  feedType: FEED_TYPE;
}

// ✅ DO NOT pass in a shared defaultState (this ensures state isolation)
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
}: {
  children: React.ReactNode;
  containerType: CONTAINER_TYPE;
}) => {
  const feedType = getFeedTypeFromContainer(containerType);
  const [validatedAsset, setValidatedAsset] = useState<ValidatedAsset>();
  const [inputState, setInputState] = useState<InputState>(InputState.EMPTY_INPUT);

  const {
    inputValue,
    debouncedAddress,
    validateHexInput,
  } = useDebouncedAddressInput();

  useEffect(() => {
    debugLog.log(
      `📦 SharedPanelProvider mount: containerType=${containerType}, inputState=${getInputStateString(
        inputState
      )}`
    );
    window.__scrollPanelDebug = {
      containerType,
      inputState,
    };
  }, [containerType, inputState]);

  useEffect(() => {
    debugLog.log(`🔁 inputState updated → ${getInputStateString(inputState)}`);
    if (window.__scrollPanelDebug) {
      window.__scrollPanelDebug.inputState = inputState;
    }
  }, [inputState]);

  const getInputStatusEmoji = (state: InputState): string => {
    switch (state) {
      case InputState.INVALID_ADDRESS_INPUT:
        return '❓';
      case InputState.DUPLICATE_INPUT:
      case InputState.CONTRACT_NOT_FOUND_ON_BLOCKCHAIN:
        return '❌';
      case InputState.CONTRACT_NOT_FOUND_LOCALLY:
        return '⚠️';
      case InputState.VALID_INPUT:
        return '✅';
      case InputState.IS_LOADING:
        return '⏳';
      default:
        return '🔍';
    }
  };

  // ✅ Construct fully independent state per instance
  const value = useMemo<SharedPanelContextType>(
    () => ({
      inputState,
      setInputState: (state: InputState) => {
        debugLog.log(`📝 setInputState called → ${getInputStateString(state)}`);
        setInputState(state);
      },
      validatedAsset,
      setValidatedAsset,
      containerType,
      inputValue,
      debouncedAddress,
      validateHexInput,
      getInputStatusEmoji,
      feedType,
    }),
    [
      inputState,
      validatedAsset,
      containerType,
      inputValue,
      debouncedAddress,
      validateHexInput,
      feedType,
    ]
  );

  return (
    <SharedPanelContext.Provider value={value}>
      {children}
    </SharedPanelContext.Provider>
  );
};

export const useSharedPanelContext = (): SharedPanelContextType => {
  const ctx = useContext(SharedPanelContext);
  if (!ctx)
    throw new Error('❌ useSharedPanelContext must be used within a SharedPanelProvider');
  return ctx;
};
