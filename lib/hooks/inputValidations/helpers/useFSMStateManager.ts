// File: lib/hooks/inputValidations/helpers/useFSMStateManager.ts

'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  FEED_TYPE,
  InputState,
  SP_COIN_DISPLAY,
  WalletAccount,
} from '@/lib/structure';

import { useAccount } from 'wagmi';
import { useDebounce } from '@/lib/hooks/useDebounce';
import { createDebugLogger } from '@/lib/utils/debugLogger';
import { useFSMHeaderTrace } from '@/lib/hooks/useFSMHeaderTrace';

import {
  formatTrace,
  getStateIcon,
  LOCAL_TRACE_KEY,
  LOCAL_TRACE_LINES_KEY,
} from './fsmTraceUtils';

import { useRunFSM } from './useRunFSM';

const LOG_TIME = false;
const DEBUG_ENABLED_FSM = process.env.NEXT_PUBLIC_DEBUG_FSM === 'true';
const debugLog = createDebugLogger('useFSMStateManager', DEBUG_ENABLED_FSM, LOG_TIME);

interface UseFSMStateManagerParams {
  validHexInput: string;
  debouncedHexInput: string;
  containerType: SP_COIN_DISPLAY;
  feedType: FEED_TYPE;
  instanceId: string;
  setValidatedAsset: (asset: WalletAccount | undefined) => void;
  closeCallback: (fromUser: boolean) => void;
  setTradingTokenCallback: (token: any) => void;
}

export function useFSMStateManager(params: UseFSMStateManagerParams) {
  const {
    validHexInput,
    debouncedHexInput,
    containerType,
    feedType,
    instanceId,
    setValidatedAsset,
    closeCallback,
    setTradingTokenCallback,
  } = params;

  const traceRef = useRef<InputState[]>([]);
  const [inputState, _setInputState] = useState<InputState>(InputState.EMPTY_INPUT);
  const [pendingTrace, setPendingTrace] = useState<InputState[]>([]);
  const debouncedTrace = useDebounce(pendingTrace, 200);
  const { reset: resetHeader } = useFSMHeaderTrace();

  // Load trace from localStorage on mount
  useEffect(() => {
    try {
      const rawTrace = localStorage.getItem(LOCAL_TRACE_KEY);
      traceRef.current = rawTrace ? JSON.parse(rawTrace) : [];
      debugLog.log('⏪ Loaded trace from localStorage:', traceRef.current);
    } catch (err) {
      debugLog.error('[useFSMStateManager] Failed to load from localStorage:', err);
    }
  }, []);

  // Save trace to localStorage when debounced
  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_TRACE_KEY, JSON.stringify(debouncedTrace));
      debugLog.log('💾 Saved trace to localStorage:', debouncedTrace);

      const lines = formatTrace(debouncedTrace);
      localStorage.setItem(LOCAL_TRACE_LINES_KEY, lines);
      debugLog.log('🧾 Saved FSM trace lines to localStorage:', lines);
    } catch (err) {
      debugLog.error('[useFSMStateManager] Failed to persist debounced trace:', err);
    }
  }, [debouncedTrace]);

  // 🚀 Run FSM
  useRunFSM({
    inputState,
    validHexInput,
    debouncedHexInput,
    containerType,
    feedType,
    instanceId,
    traceRef,
    setPendingTrace,
    _setInputState,
    setValidatedAsset,
    closeCallback,
    setTradingTokenCallback,
  });

  const setInputState = useCallback((next: InputState, source = 'useFSMStateManager') => {
    _setInputState((prev) => {
      if (prev === next) {
        debugLog.log(`🟡 Ignored redundant state: ${next} (from ${source})`);
        return prev;
      }
      const last = traceRef.current.at(-1);
      if (last !== next) {
        traceRef.current.push(next);
        setPendingTrace([...traceRef.current]);
      }
      debugLog.log(`🟢 ${getStateIcon(prev)} ${prev} → ${getStateIcon(next)} ${next} (from ${source})`);
      return next;
    });
  }, []);

  const appendState = useCallback((state: InputState) => {
    const last = traceRef.current.at(-1);
    if (last !== state) {
      traceRef.current.push(state);
      setPendingTrace([...traceRef.current]);
      debugLog.log(`📌 Appended state manually: ${state}`);
    }
  }, []);

  const resetTrace = useCallback(() => {
    traceRef.current = [];
    setPendingTrace([]);
    _setInputState(InputState.EMPTY_INPUT);
    try {
      localStorage.removeItem(LOCAL_TRACE_KEY);
      resetHeader();
      debugLog.log('🧹 Cleared trace and header from localStorage');
    } catch (err) {
      debugLog.error('[useFSMStateManager] Failed to clear trace:', err);
    }
  }, [resetHeader]);

  const getTrace = useCallback(() => {
    debugLog.log('📤 Retrieved FSM trace');
    return [...traceRef.current];
  }, []);

  const displayTraceWithIcons = useCallback(() => {
    const traceStr = formatTrace(traceRef.current);
    debugLog.log('📊 Display trace:\n' + traceStr);
    return traceStr;
  }, []);

  return {
    inputState,
    setInputState,
    appendState,
    resetTrace,
    getTrace,
    displayTraceWithIcons,
  };
}
