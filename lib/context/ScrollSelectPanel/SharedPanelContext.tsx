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
} from '@/lib/structure';

import { useBaseSelectShared } from '@/lib/hooks/useBaseSelectShared';
import { createDebugLogger } from '@/lib/utils/debugLogger';

const LOG_TIME = false;
const DEBUG_ENABLED = process.env.NEXT_PUBLIC_DEBUG_LOG_SCROLL_PANEL_CONTEXT === 'true';
const debugLog = createDebugLogger('ScrollPanelContext', DEBUG_ENABLED, LOG_TIME);

declare global {
  interface Window {
    __scrollPanelDebug?: any;
  }
}

type ValidatedAsset = TokenContract | WalletAccount | undefined;

export interface SharedPanelContextType {
  inputState: InputState;
  setInputState: (state: InputState) => void;
  validatedAsset?: ValidatedAsset;
  setValidatedAsset?: (asset: ValidatedAsset) => void;
  containerType: CONTAINER_TYPE;
  onSelect?: (item: ValidatedAsset, state: InputState) => void;
}

const SharedPanelContext = createContext<SharedPanelContextType | undefined>(undefined);

export const SharedPanelProvider = ({
  children,
  containerType,
  onSelect,
}: {
  children: React.ReactNode;
  containerType: CONTAINER_TYPE;
  onSelect?: (item: ValidatedAsset, state: InputState) => void;
}) => {
  const shared = useBaseSelectShared();
  const [validatedAsset, setValidatedAsset] = useState<ValidatedAsset>(undefined);

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
  }), [shared.inputState, shared.setInputState, validatedAsset, containerType, onSelect]);

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
