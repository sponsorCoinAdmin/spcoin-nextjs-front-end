// File: lib/hooks/inputValidations/helpers/useInputState.ts

'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  FEED_TYPE,
  InputState,
  SP_COIN_DISPLAY,
  WalletAccount,
  getInputStateString,
} from '@/lib/structure';
import { useDebounce } from '@/lib/hooks/useDebounce';
import { validateFSMCore } from '../FSM_Core/validateFSMCore';
import { createDebugLogger } from '@/lib/utils/debugLogger';
import type {
  ValidateFSMInput,
  ValidateFSMOutput,
} from '../FSM_Core/types/validateFSMTypes';
import { useFSMHeaderTrace } from '@/lib/hooks/useFSMHeaderTrace';
import { usePublicClient, useChainId, useAccount } from 'wagmi';

const LOG_TIME = false;
const DEBUG_ENABLED_FSM = process.env.NEXT_PUBLIC_DEBUG_FSM === 'true';
const debugLog = createDebugLogger('useInputState', DEBUG_ENABLED_FSM, LOG_TIME);

const LOCAL_TRACE_KEY = 'latestFSMTrace';

function getStateIcon(state: InputState): string {
  switch (state) {
    case InputState.EMPTY_INPUT:
      return '🕳️';
    case InputState.INVALID_HEX_INPUT:
      return '🚫';
    case InputState.VALIDATE_ADDRESS:
      return '📬';
    case InputState.INCOMPLETE_ADDRESS:
      return '✂️';
    case InputState.INVALID_ADDRESS_INPUT:
      return '❓';
    case InputState.TEST_DUPLICATE_INPUT:
      return '🧪';
    case InputState.DUPLICATE_INPUT_ERROR:
      return '❌';
    case InputState.VALIDATE_PREVIEW:
      return '🖼️';
    case InputState.PREVIEW_ADDRESS:
      return '🔎';
    case InputState.PREVIEW_CONTRACT_EXISTS_LOCALLY:
      return '📁';
    case InputState.PREVIEW_CONTRACT_NOT_FOUND_LOCALLY:
      return '📂';
    case InputState.VALIDATE_EXISTS_ON_CHAIN:
      return '🛰️';
    case InputState.CONTRACT_NOT_FOUND_ON_BLOCKCHAIN:
      return '📵';
    case InputState.RESOLVE_ASSET:
      return '📊';
    case InputState.TOKEN_NOT_RESOLVED_ERROR:
      return '❗';
    case InputState.RESOLVE_ASSET_ERROR:
      return '💥';
    case InputState.MISSING_ACCOUNT_ADDRESS:
      return '🙈';
    case InputState.UPDATE_VALIDATED_ASSET:
      return '✅';
    case InputState.CLOSE_SELECT_PANEL:
      return '🔒';
    default:
      return '➖';
  }
}

function formatTrace(trace: InputState[]): string {
  if (!trace?.length) return 'No FSM trace found.';
  const lines: string[] = [];
  for (let i = 0; i < trace.length - 1; i++) {
    const from = trace[i];
    const to = trace[i + 1];
    if (from === to) continue;
    const icon = i === 0 ? '🟢' : '🟡';
    lines.push(
      `${icon} ${getStateIcon(from)} ${getInputStateString(from)} → ${getStateIcon(to)} ${getInputStateString(to)}`
    );
  }
  if (trace.length === 1) {
    lines.push(`🟢 ${getStateIcon(trace[0])} ${getInputStateString(trace[0])}`);
  }
  return lines.join('\n');
}

interface UseInputStateParams {
  validHexInput: string;
  debouncedHexInput: string;
  containerType: SP_COIN_DISPLAY;
  feedType: FEED_TYPE;
  instanceId: string;
  setValidatedAsset: (asset: WalletAccount | undefined) => void;
  closeCallback: (fromUser: boolean) => void;
  setTradingTokenCallback: (token: any) => void;
}

export function useInputState(params: UseInputStateParams) {
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

  const publicClient = usePublicClient();
  const chainId = useChainId();
  const { address: accountAddress } = useAccount();

  const traceRef = useRef<InputState[]>([]);
  const [inputState, _setInputState] = useState<InputState>(InputState.EMPTY_INPUT);
  const [pendingTrace, setPendingTrace] = useState<InputState[]>([]);
  const debouncedTrace = useDebounce(pendingTrace, 200);
  const { addFSMKeyValue, reset: resetHeader } = useFSMHeaderTrace();

  const debugAdd = (key: string, val: string | undefined) => {
    if (!val) return;
    debugLog.log(`🧩 addingFSM(${key}, ${val})`);
    addFSMKeyValue(key, val);
  };

  useEffect(() => {
    try {
      const rawTrace = localStorage.getItem(LOCAL_TRACE_KEY);
      traceRef.current = rawTrace ? JSON.parse(rawTrace) : [];
      debugLog.log('⏪ Loaded trace from localStorage:', traceRef.current);
    } catch (err) {
      debugLog.error('[useInputState] Failed to load from localStorage:', err);
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_TRACE_KEY, JSON.stringify(debouncedTrace));
      debugLog.log('💾 Saved trace to localStorage:', debouncedTrace);
    } catch (err) {
      debugLog.error('[useInputState] Failed to persist debounced trace:', err);
    }
  }, [debouncedTrace]);

  useEffect(() => {
    let cancelled = false;

    async function runFSM() {
      debugLog.log('🔥 [FSM LOOP STARTED]', { inputState });

      const current: ValidateFSMInput = {
        inputState,
        debouncedHexInput,
        seenBrokenLogos: new Set(),
        containerType,
        feedType,
        chainId,
        publicClient,
        accountAddress: accountAddress ?? '0x0000000000000000000000000000000000000000',
        manualEntry: true,
        sellAddress: feedType === FEED_TYPE.TOKEN_LIST ? validHexInput : undefined,
        buyAddress: undefined,
        validatedToken: undefined,
        validatedWallet: undefined,
      };

      while (!cancelled) {
        const result: ValidateFSMOutput = await validateFSMCore(current);
        if (cancelled) break;
        const nextState = result.nextState;
        if (nextState === current.inputState) {
          debugLog.log(`🟡 FSM halted at stable/terminal state: ${getInputStateString(current.inputState)}`);
          break;
        }
        debugLog.log(`➡️ FSM transition: ${getInputStateString(current.inputState)} → ${getInputStateString(nextState)}`);
        current.inputState = nextState;
        _setInputState(nextState);

        const last = traceRef.current[traceRef.current.length - 1];
        if (last !== nextState) {
          traceRef.current.push(nextState);
          setPendingTrace([...traceRef.current]);
        }
      }

      const timestamp = new Date().toLocaleString();
      debugAdd('inputState', `${InputState[current.inputState]} (${current.inputState})`);
      debugAdd('feedType', `${FEED_TYPE[current.feedType]} (${current.feedType})`);
      debugAdd('containerType', `${SP_COIN_DISPLAY[current.containerType]} (${current.containerType})`);
      debugAdd('debouncedHex', current.debouncedHexInput);
      debugAdd('sellAddress', current.sellAddress);
      debugAdd('buyAddress', current.buyAddress);
      debugAdd('chainId', String(current.chainId));
      debugAdd('accountAddr', current.accountAddress);
      debugAdd('validatedTok', current.validatedToken?.symbol);
      debugAdd('validatedWal', current.validatedWallet?.name);
      debugAdd('manualEntry', current.manualEntry ? 'true' : 'false');
      debugAdd('timestamp', timestamp);

      debugLog.log(`🛠 FSM EXIT → Final inputState: ${InputState[current.inputState]}`);
    }

    runFSM();
    return () => {
      cancelled = true;
    };
  }, [inputState, debouncedHexInput, validHexInput, containerType, feedType, publicClient, chainId, accountAddress]);

  const setInputState = useCallback((next: InputState, source = 'useInputState') => {
    _setInputState((prev) => {
      if (prev === next) {
        debugLog.log(`🟡 Ignored redundant state: ${getInputStateString(next)} (from ${source})`);
        return prev;
      }
      const last = traceRef.current[traceRef.current.length - 1];
      if (last !== next) {
        traceRef.current.push(next);
        setPendingTrace([...traceRef.current]);
      }
      debugLog.log(`🟢 ${getStateIcon(prev)} ${getInputStateString(prev)} → ${getStateIcon(next)} ${getInputStateString(next)} (from ${source})`);
      return next;
    });
  }, []);

  const appendState = useCallback((state: InputState) => {
    const last = traceRef.current[traceRef.current.length - 1];
    if (last !== state) {
      traceRef.current.push(state);
      setPendingTrace([...traceRef.current]);
      debugLog.log(`📌 Appended state manually: ${getInputStateString(state)}`);
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
      debugLog.error('[useInputState] Failed to clear trace:', err);
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
