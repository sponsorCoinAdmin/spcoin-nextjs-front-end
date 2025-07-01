// File: lib/context/ScrollSelectPanel/SharedPanelContext.tsx

'use client';

import { createContext, useContext, useMemo, useEffect } from 'react';
import { InputState, CONTAINER_TYPE, getInputStateString, TokenContract } from '@/lib/structure';
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

export interface SharedPanelContextType {
  inputState: InputState;
  setInputState: (state: InputState) => void;
  containerType: CONTAINER_TYPE;
  onSelect?: (token: TokenContract, state: InputState) => void;
}

const SharedPanelContext = createContext<SharedPanelContextType | undefined>(undefined);

export const SharedPanelProvider = ({
  children,
  containerType,
  onSelect,
}: {
  children: React.ReactNode;
  containerType: CONTAINER_TYPE;
  onSelect?: (token: TokenContract, state: InputState) => void;
}) => {
  const shared = useBaseSelectShared();

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

  const value = useMemo(
    () => ({
      inputState: shared.inputState,
      setInputState: (state: InputState) => {
        debugLog.log(`📝 setInputState called → ${getInputStateString(state)}`);
        shared.setInputState(state);
      },
      containerType,
      onSelect,
    }),
    [shared.inputState, shared.setInputState, containerType, onSelect]
  );

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
