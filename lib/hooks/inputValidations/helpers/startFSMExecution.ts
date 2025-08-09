// File: lib/hooks/inputValidations/helpers/startFSMExecution.ts
import { InputState, FEED_TYPE, SP_COIN_DISPLAY, TokenContract, WalletAccount } from '@/lib/structure';
import { createDebugLogger } from '@/lib/utils/debugLogger';
import { runFSM } from './fsmRunner';
import { LOCAL_TRACE_KEY } from './fsmConstants';

const debugLog = createDebugLogger('startFSMExecution', process.env.NEXT_PUBLIC_DEBUG_FSM === 'true');

export async function startFSMExecution({
  debouncedHexInput,
  prevDebouncedInputRef,
  publicClient,
  chainId,
  accountAddress,
  containerType,
  feedType,
  setValidatedAsset,
  closePanelCallback,
  setTradingTokenCallback,
  // NEW
  isValid,
  failedHexInput,
}: {
  debouncedHexInput: string;
  prevDebouncedInputRef: React.MutableRefObject<string | undefined>;
  publicClient: any;
  chainId: number;
  accountAddress?: string;
  containerType: SP_COIN_DISPLAY;
  feedType: FEED_TYPE;
  setValidatedAsset: (asset: WalletAccount | TokenContract | undefined) => void;
  closePanelCallback: (fromUser: boolean) => void;
  setTradingTokenCallback: (token: any) => void;
  // NEW
  isValid: boolean;
  failedHexInput?: string;
}): Promise<InputState | null> {
  if (!publicClient) {
    debugLog.warn('⚠️ publicClient is undefined, aborting FSM execution.');
    return null;
  }

  if (debouncedHexInput === prevDebouncedInputRef.current) {
    debugLog.log(`⏭️ Skipping FSM: debouncedHexInput unchanged → "${debouncedHexInput}"`);
    return null;
  }

  // record latest
  prevDebouncedInputRef.current = debouncedHexInput;

  if (!debouncedHexInput || debouncedHexInput.trim() === '') {
    debugLog.log('⏭️ Skipping FSM: debouncedHexInput is empty');
    return InputState.EMPTY_INPUT;
  }

  debugLog.log(`🏃 Running FSM for input → "${debouncedHexInput}"`);

  await runFSM({
    debouncedHexInput,
    containerType,
    feedType,
    publicClient,
    chainId,
    accountAddress: accountAddress ?? undefined,
    setValidatedAsset,
    closePanelCallback,
    setTradingTokenCallback,
    // NEW
    isValid,
    failedHexInput,
  });

  try {
    const raw = localStorage.getItem(LOCAL_TRACE_KEY);
    const arr = JSON.parse(raw || '[]') as number[];
    const last = Array.isArray(arr) && arr.length > 0
      ? (arr[arr.length - 1] as InputState)
      : InputState.EMPTY_INPUT;
    return last;
  } catch {
    return InputState.EMPTY_INPUT;
  }
}
