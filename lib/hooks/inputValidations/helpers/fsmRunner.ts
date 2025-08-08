// File: lib/hooks/inputValidations/helpers/fsmRunner.ts

'use client';

import {
  InputState,
  SP_COIN_DISPLAY,
  FEED_TYPE,
  WalletAccount,
  getInputStateString,
} from '@/lib/structure';

import { validateFSMCore } from '../FSM_Core/validateFSMCore';
import type {
  ValidateFSMInput,
  ValidateFSMOutput,
} from '../FSM_Core/types/validateFSMTypes';

import { Address } from 'viem';
import { formatTrace, getStateIcon } from './fsmTraceUtils';

export const LOCAL_TRACE_KEY = 'latestFSMTrace';
export const LOCAL_TRACE_LINES_KEY = 'latestFSMTraceLines';

export type FSMRunnerParams = {
  debouncedHexInput: string;
  containerType: SP_COIN_DISPLAY;
  feedType: FEED_TYPE;
  publicClient: any;
  chainId: number;
  accountAddress?: string;

  setValidatedAsset: (asset: WalletAccount | undefined) => void;
  closePanelCallback: (fromUser: boolean) => void;
  setTradingTokenCallback: (token: any) => void;
};

function getInitialTraceFromLocalStorage(): InputState[] {
  try {
    const raw = localStorage.getItem(LOCAL_TRACE_KEY);
    const parsed = JSON.parse(raw || '[]');
    if (Array.isArray(parsed) && parsed.every(n => typeof n === 'number')) {
      return parsed as InputState[];
    }
  } catch (err) {
    console.warn('⚠️ Failed to parse previous FSM trace from localStorage:', err);
  }
  return [];
}

export async function runFSM(params: FSMRunnerParams) {
  const {
    debouncedHexInput,
    containerType,
    feedType,
    publicClient,
    chainId,
    accountAddress,
    setValidatedAsset,
    closePanelCallback,
    setTradingTokenCallback,
  } = params;

  const trace: InputState[] = getInitialTraceFromLocalStorage();

  let fSMState: InputState = InputState.VALIDATE_ADDRESS;
  trace.push(fSMState);

  const current: ValidateFSMInput = {
    inputState: fSMState,
    debouncedHexInput,
    seenBrokenLogos: new Set(),
    containerType,
    feedType,
    chainId,
    publicClient,
    accountAddress: accountAddress as Address,
    manualEntry: true,
    sellAddress: feedType === FEED_TYPE.TOKEN_LIST ? debouncedHexInput : undefined,
    buyAddress: undefined,
    validatedToken: undefined,
    validatedWallet: undefined,
  };

  while (true) {
    current.inputState = fSMState;

    const result: ValidateFSMOutput = await validateFSMCore(current);
    const newState = result.nextState;

    if (newState === fSMState) break;

    const prev: InputState = fSMState;
    const next: InputState = newState;
    console.log(`🟢 ${getStateIcon(prev)} ${prev} → ${getStateIcon(next)} ${next} (FSM Runner)`);

    fSMState = next;
    trace.push(fSMState);
  }

  // ✅ Save trace log to localStorage (with custom header prepended to trace lines)
  // ✅ Save formatted trace block with header, append to history
  try {
    const headerLine = `🧮 ${SP_COIN_DISPLAY[containerType]}  for Address ${debouncedHexInput}`;
    const formattedLines = trace.map((state, i) => {
      const icon = i === 0 ? '🟢' : '🟡';
      return `${icon} ${getStateIcon(state)} ${getInputStateString(state)}`;
    });

    const block = [headerLine, ...formattedLines].join('\n');

    const previous = localStorage.getItem(LOCAL_TRACE_LINES_KEY) || '';
    const combined = [previous, block].filter(Boolean).join('\n');
    localStorage.setItem(LOCAL_TRACE_LINES_KEY, combined);
  } catch (err) {
    console.error('❌ Failed to save FSM trace block:', err);
  }
  
  // ✅ Save FSM header
  const header = {
    inputState: `${InputState[fSMState]} (${fSMState})`,
    feedType: `${FEED_TYPE[feedType]} (${feedType})`,
    containerType: `${SP_COIN_DISPLAY[containerType]} (${containerType})`,
    debouncedHex: debouncedHexInput,
    sellAddress: current.sellAddress,
    buyAddress: current.buyAddress,
    chainId: String(current.chainId),
    accountAddr: current.accountAddress,
    validatedTok: current.validatedToken?.symbol,
    validatedWal: current.validatedWallet?.name,
    manualEntry: current.manualEntry ? 'true' : 'false',
    timestamp: new Date().toLocaleString(),
  };

  try {
    localStorage.setItem('latestFSMHeader', JSON.stringify(header, null, 2));

    const historyKey = 'fsmHeaderHistory';
    const history = JSON.parse(localStorage.getItem(historyKey) || '[]');
    history.push(header);
    localStorage.setItem(historyKey, JSON.stringify(history, null, 2));
  } catch (err) {
    console.error('❌ Failed to save FSM header to history:', err);
  }
}
