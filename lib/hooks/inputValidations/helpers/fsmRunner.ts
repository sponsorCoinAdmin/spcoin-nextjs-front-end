// File: lib/hooks/inputValidations/helpers/fsmRunner.ts

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

type FSMRunnerParams = {
  cancelled: boolean;
  traceRef: React.MutableRefObject<InputState[]>;
  setPendingTrace: (trace: InputState[]) => void;
  _setInputState: (state: InputState) => void;
  debugLog: ReturnType<typeof import('@/lib/utils/debugLogger').createDebugLogger>;

  inputState: InputState;
  validHexInput: string;
  debouncedHexInput: string;
  containerType: SP_COIN_DISPLAY;
  feedType: FEED_TYPE;
  publicClient: any;
  chainId: number;
  accountAddress?: string;

  setValidatedAsset: (asset: WalletAccount | undefined) => void;
  closeCallback: (fromUser: boolean) => void;
  setTradingTokenCallback: (token: any) => void;
};

export async function runFSM(params: FSMRunnerParams) {
  const {
    cancelled,
    traceRef,
    setPendingTrace,
    _setInputState,
    debugLog,

    inputState,
    validHexInput,
    debouncedHexInput,
    containerType,
    feedType,
    publicClient,
    chainId,
    accountAddress,

    setValidatedAsset,
    closeCallback,
    setTradingTokenCallback,
  } = params;

  debugLog.log('🔥 [FSM LOOP STARTED]', { inputState });

  const current: ValidateFSMInput = {
    inputState,
    debouncedHexInput,
    seenBrokenLogos: new Set(),
    containerType,
    feedType,
    chainId,
    publicClient,
    accountAddress: accountAddress as Address,
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

  const header = {
    inputState: `${InputState[current.inputState]} (${current.inputState})`,
    feedType: `${FEED_TYPE[current.feedType]} (${current.feedType})`,
    containerType: `${SP_COIN_DISPLAY[current.containerType]} (${current.containerType})`,
    debouncedHex: current.debouncedHexInput,
    sellAddress: current.sellAddress,
    buyAddress: current.buyAddress,
    chainId: String(current.chainId),
    accountAddr: current.accountAddress,
    validatedTok: current.validatedToken?.symbol,
    validatedWal: current.validatedWallet?.name,
    manualEntry: current.manualEntry ? 'true' : 'false',
    timestamp: new Date().toLocaleString(),
  };

  localStorage.setItem('latestFSMHeader', JSON.stringify(header, null, 2));

  const historyKey = 'fsmHeaderHistory';
  const history = JSON.parse(localStorage.getItem(historyKey) || '[]');
  history.push(header);
  localStorage.setItem(historyKey, JSON.stringify(history, null, 2));

  debugLog.log('🗂️ FSM header saved to history:', header);
}
