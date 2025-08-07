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
  debugLog: ReturnType<typeof import('@/lib/utils/debugLogger').createDebugLogger>;

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
  // alert(`🚀 runFSM called with:\n\n${JSON.stringify(params, null, 2)}`);

  const {
    cancelled,
    traceRef,
    setPendingTrace,
    debugLog,
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

  let fSMState: InputState = InputState.VALIDATE_ADDRESS;

  // const msg = `🔥 [FSM LOOP STARTED] ${InputState[fSMState]}(${fSMState})`;
  // alert(msg);
  // debugLog.log(msg);

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

  while (!cancelled) {
    current.inputState = fSMState;

    const result: ValidateFSMOutput = await validateFSMCore(current);
    if (cancelled) break;

    const newState = result.nextState;

    if (newState === fSMState) {
      debugLog.log(`🟡 FSM halted at stable/terminal state: ${getInputStateString(fSMState)}`);
      break;
    }

    debugLog.log(`➡️ FSM transition: ${getInputStateString(fSMState)} → ${getInputStateString(newState)}`);
    fSMState = newState;

    const last = traceRef.current[traceRef.current.length - 1];
    if (last !== fSMState) {
      traceRef.current.push(fSMState);
      setPendingTrace([...traceRef.current]);
    }
  }

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

  localStorage.setItem('latestFSMHeader', JSON.stringify(header, null, 2));

  const historyKey = 'fsmHeaderHistory';
  const history = JSON.parse(localStorage.getItem(historyKey) || '[]');
  history.push(header);
  localStorage.setItem(historyKey, JSON.stringify(history, null, 2));

  debugLog.log('🗂️ FSM header saved to history:', header);
}
