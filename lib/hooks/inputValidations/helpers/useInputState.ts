// File: lib/hooks/inputValidations/helpers/useInputState.ts
'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { FEED_TYPE, InputState, SP_COIN_DISPLAY, getInputStateString } from '@/lib/structure';
import { useDebounce } from '@/lib/hooks/useDebounce';
import { validateFSMCore } from '../FSM_Core/validateFSMCore';
import { createDebugLogger } from '@/lib/utils/debugLogger';
import type {
  ValidateFSMInput,
  ValidateFSMOutput,
} from '../FSM_Core/types/validateFSMTypes';

const LOG_TIME: boolean = false;
const DEBUG_ENABLED_FSM: boolean = process.env.NEXT_PUBLIC_DEBUG_FSM === 'true';
const debugLog = createDebugLogger('useInputState', true, LOG_TIME);

const LOCAL_TRACE_KEY = 'latestFSMTrace';
const LOCAL_HEADER_KEY = 'latestFSMHeader';

function getStateIcon(state: InputState): string {
  switch (state) {
    case InputState.EMPTY_INPUT: return '🕳️';
    case InputState.INVALID_HEX_INPUT: return '🚫';
    case InputState.VALIDATE_ADDRESS: return '📬';
    case InputState.INCOMPLETE_ADDRESS: return '✂️';
    case InputState.INVALID_ADDRESS_INPUT: return '❓';
    case InputState.TEST_DUPLICATE_INPUT: return '🧪';
    case InputState.DUPLICATE_INPUT_ERROR: return '❌';
    case InputState.VALIDATE_PREVIEW: return '🖼️';
    case InputState.PREVIEW_ADDRESS: return '🔎';
    case InputState.PREVIEW_CONTRACT_EXISTS_LOCALLY: return '📁';
    case InputState.PREVIEW_CONTRACT_NOT_FOUND_LOCALLY: return '📂';
    case InputState.VALIDATE_EXISTS_ON_CHAIN: return '🛰️';
    case InputState.CONTRACT_NOT_FOUND_ON_BLOCKCHAIN: return '📵';
    case InputState.RESOLVE_ASSET: return '📊';
    case InputState.TOKEN_NOT_RESOLVED_ERROR: return '❗';
    case InputState.RESOLVE_ASSET_ERROR: return '💥';
    case InputState.MISSING_ACCOUNT_ADDRESS: return '🙈';
    case InputState.UPDATE_VALIDATED_ASSET: return '✅';
    case InputState.CLOSE_SELECT_PANEL: return '🔒';
    default: return '➖';
  }
}

function formatTrace(trace: InputState[]): string {
  if (!trace?.length) return 'No FSM trace found.';

  const lines: string[] = [];
  for (let i = 0; i < trace.length - 1; i++) {
    const from = trace[i];
    const to = trace[i + 1];
    const icon = i === 0 ? '🟢' : '🟡';
    lines.push(`${icon} ${getStateIcon(from)} ${getInputStateString(from)} → ${getStateIcon(to)} ${getInputStateString(to)}`);
  }

  if (trace.length === 1) {
    lines.push(`🟢 ${getStateIcon(trace[0])} ${getInputStateString(trace[0])}`);
  }

  return lines.join('\n');
}

export function useInputState() {
  const traceRef = useRef<InputState[]>([]);
  const headerRef = useRef<string>('');
  const prevFSMStateRef = useRef<InputState | null>(null); // NEW

  const [inputState, _setInputState] = useState<InputState>(InputState.EMPTY_INPUT);
  const [pendingTrace, setPendingTrace] = useState<InputState[]>([]);
  const debouncedTrace = useDebounce(pendingTrace, 200);

  // ⏪ Load trace from localStorage
  useEffect(() => {
    try {
      const rawTrace = localStorage.getItem(LOCAL_TRACE_KEY);
      traceRef.current = rawTrace ? JSON.parse(rawTrace) : [];

      const rawHeader = localStorage.getItem(LOCAL_HEADER_KEY);
      headerRef.current = rawHeader || '';

      debugLog.log('⏪ Loaded trace from localStorage:', traceRef.current);
      debugLog.log('⏪ Loaded header from localStorage:', headerRef.current);
    } catch (err) {
      debugLog.error('[useInputState] Failed to load from localStorage:', err);
    }
  }, []);

  // 💾 Save debounced trace to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_TRACE_KEY, JSON.stringify(debouncedTrace));
      debugLog.log('💾 Saved trace to localStorage:', debouncedTrace);
    } catch (err) {
      debugLog.error('[useInputState] Failed to persist debounced trace:', err);
    }
  }, [debouncedTrace]);

  // 🚦 FSM AUTO-EXECUTION LOOP
  useEffect(() => {
    let cancelled = false;

    async function runFSM() {
      if (prevFSMStateRef.current === inputState) {
        debugLog.log(`⏭️ Skipping FSM: already processed state ${getInputStateString(inputState)}`);
        return;
      }

      prevFSMStateRef.current = inputState;

      const fsmInput: ValidateFSMInput = {
        inputState,
        debouncedHexInput: '', // TODO: replace with actual hex input
        seenBrokenLogos: new Set(),
        containerType: SP_COIN_DISPLAY.TOKEN_SCROLL_PANEL,
        feedType: FEED_TYPE.TOKEN_LIST,
        chainId: 1,
        publicClient: undefined,
        accountAddress: '0x0000000000000000000000000000000000000000',
        manualEntry: false,
      };

      debugLog.log(`🔥 [FSM ENTRY] Starting FSM at: ${getInputStateString(fsmInput.inputState)}`);

      let current = fsmInput;

      while (!cancelled) {
        const result: ValidateFSMOutput = await validateFSMCore(current);
        if (cancelled) break;

        const nextState = result.nextState;

        if (nextState === current.inputState) {
          debugLog.log(`🟡 FSM halted at stable/terminal state: ${getInputStateString(current.inputState)}`);
          break;
        }

        debugLog.log(`➡️ FSM transition: ${getInputStateString(current.inputState)} → ${getInputStateString(nextState)}`);

        current = { ...current, inputState: nextState };
        _setInputState(nextState);
        traceRef.current.push(nextState);
        setPendingTrace([...traceRef.current]);
      }
    }

    runFSM();
    return () => {
      cancelled = true;
    };
  }, [inputState]);

  const setInputState = useCallback((next: InputState, source = 'useInputState') => {
    _setInputState((prev) => {
      if (prev === next) {
        debugLog.log(`🟡 Ignored redundant state: ${getInputStateString(next)} (from ${source})`);
        return prev;
      }

      traceRef.current.push(next);
      setPendingTrace([...traceRef.current]);

      debugLog.log(`🟢 ${getStateIcon(prev)} ${getInputStateString(prev)} → ${getStateIcon(next)} ${getInputStateString(next)} (from ${source})`);
      return next;
    });
  }, []);

  const appendState = useCallback((state: InputState) => {
    traceRef.current.push(state);
    setPendingTrace([...traceRef.current]);
    debugLog.log(`📌 Appended state manually: ${getInputStateString(state)}`);
  }, []);

  const resetTrace = useCallback(() => {
    traceRef.current = [];
    headerRef.current = '';
    prevFSMStateRef.current = null;
    setPendingTrace([]);
    _setInputState(InputState.EMPTY_INPUT);

    try {
      localStorage.removeItem(LOCAL_TRACE_KEY);
      localStorage.removeItem(LOCAL_HEADER_KEY);
      debugLog.log('🧹 Cleared trace and header from localStorage');
    } catch (err) {
      debugLog.error('[useInputState] Failed to clear trace:', err);
    }
  }, []);

  const setHeader = useCallback((header: string) => {
    headerRef.current = header;
    try {
      localStorage.setItem(LOCAL_HEADER_KEY, header);
      debugLog.log(`🏷️ Set FSM header: ${header}`);
    } catch (err) {
      debugLog.error('[useInputState] Failed to save header:', err);
    }
  }, []);

  const getHeader = useCallback(() => {
    debugLog.log('📤 Retrieved FSM header');
    return headerRef.current;
  }, []);

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
    getHeader,
    setHeader,
    displayTraceWithIcons,
  };
}
