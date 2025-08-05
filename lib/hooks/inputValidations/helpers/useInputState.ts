'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { InputState, getInputStateString } from '@/lib/structure';
import { useDebounce } from '@/lib/hooks/useDebounce';

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

  // 1️⃣ Initial load from localStorage
  useEffect(() => {
    try {
      const rawTrace = localStorage.getItem(LOCAL_TRACE_KEY);
      const parsed = rawTrace ? JSON.parse(rawTrace) : [];
      traceRef.current = parsed;

      const rawHeader = localStorage.getItem(LOCAL_HEADER_KEY);
      headerRef.current = rawHeader || '';
    } catch (err) {
      console.warn('[useInputState] Failed to load from localStorage:', err);
    }
  }, []);

  // 2️⃣ Internal state for debounce trigger
  const [pendingTrace, setPendingTrace] = useState<InputState[]>([]);
  const debouncedTrace = useDebounce(pendingTrace, 200);

  // 3️⃣ Debounced save to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_TRACE_KEY, JSON.stringify(debouncedTrace));
    } catch (err) {
      console.warn('[useInputState] Failed to persist debounced trace:', err);
    }
  }, [debouncedTrace]);

  // 4️⃣ Append a new state
  const appendState = useCallback((state: InputState) => {
    traceRef.current.push(state);
    setPendingTrace([...traceRef.current]);
  }, []);

  // 5️⃣ Clear everything
  const resetTrace = useCallback(() => {
    traceRef.current = [];
    headerRef.current = '';
    setPendingTrace([]);

    try {
      localStorage.removeItem(LOCAL_TRACE_KEY);
      localStorage.removeItem(LOCAL_HEADER_KEY);
    } catch (err) {
      console.warn('[useInputState] Failed to clear trace:', err);
    }
  }, []);

  // 6️⃣ Header helpers
  const setHeader = useCallback((header: string) => {
    headerRef.current = header;
    try {
      localStorage.setItem(LOCAL_HEADER_KEY, header);
    } catch (err) {
      console.warn('[useInputState] Failed to save header:', err);
    }
  }, []);

  const getHeader = useCallback(() => {
    return headerRef.current;
  }, []);

  // 7️⃣ Retrieve current trace
  const getTrace = useCallback(() => {
    return [...traceRef.current];
  }, []);

  const displayTraceWithIcons = useCallback(() => {
    return formatTrace(traceRef.current);
  }, []);

  return {
    appendState,
    resetTrace,
    getTrace,
    getHeader,
    setHeader,
    displayTraceWithIcons,
  };
}
