// File: lib/hooks/inputValidations/helpers/useFSMExecutor.ts

import { useRef, useEffect } from 'react';
import { InputState, TokenContract, WalletAccount } from '@/lib/structure';
import { validateFSMCore } from '../FSM_Core/validateFSMCore';
import { Address } from 'viem';
import { createDebugLogger } from '@/lib/utils/debugLogger';
import { stringifyBigInt } from '@sponsorcoin/spcoin-lib/utils';

const debugLog = createDebugLogger('useFSMExecutor', true, false);

interface FSMContext {
  containerType: any;
  sellAddress: string | undefined;
  buyAddress: string | undefined;
  chainId: number;
  publicClient: any;
  accountAddress: Address;
  feedType: any;
  validatedWallet?: WalletAccount;
  setValidatedToken: (t: TokenContract) => void;
  setValidatedWallet: (w: WalletAccount) => void;
  dumpSharedPanelContext?: (headerInfo?: string) => void;
}

interface Props {
  debouncedHexInput: string;
  inputState: InputState;
  setInputState: (state: InputState) => void;
  seenBrokenLogosRef: React.MutableRefObject<Set<string>>;
  context: FSMContext;
  token?: TokenContract;
  selectAddress?: string;
}

const fsmTriggerStates: InputState[] = [
  InputState.VALIDATE_ADDRESS,
  InputState.TEST_DUPLICATE_INPUT,
  InputState.VALIDATE_PREVIEW,
  InputState.PREVIEW_ADDRESS,
  InputState.PREVIEW_CONTRACT_EXISTS_LOCALLY,
  InputState.VALIDATE_EXISTS_ON_CHAIN,
  InputState.RESOLVE_ASSET,
];

export function useFSMExecutor({
  debouncedHexInput,
  inputState,
  setInputState,
  seenBrokenLogosRef,
  context,
  token,
  selectAddress,
}: Props) {
  const prevDebouncedInputRef = useRef('');
  const queuedInputRef = useRef<string | null>(null);
  const fsmIsRunningRef = useRef(false);
  const lastFSMInputRef = useRef('');

  const runFSM = async () => {
    if (!fsmTriggerStates.includes(inputState)) {
      debugLog.log(`⚠️ Not a trigger state: ${InputState[inputState]}`);
      return;
    }

    if (fsmIsRunningRef.current) {
      debugLog.log('⏳ [FSM BUSY] → queueing new input');
      queuedInputRef.current = debouncedHexInput;
      return;
    }

    fsmIsRunningRef.current = true;
    debugLog.log(`🧵 [FSM START] state=${InputState[inputState]} input="${debouncedHexInput}"`);

    try {
      const result = await validateFSMCore({
        inputState,
        debouncedHexInput,
        seenBrokenLogos: seenBrokenLogosRef.current,
        ...context,
        validatedToken: token,
      });

      context.dumpSharedPanelContext?.(`[AFTER FSM] nextState=${InputState[result.nextState]}`);

      if (result.nextState !== inputState) {
        setInputState(result.nextState);
      }

      if (result.nextState === InputState.UPDATE_VALIDATED_ASSET) {
        if (result.validatedToken) {
          context.setValidatedToken(result.validatedToken);
        } else if (result.validatedWallet) {
          context.setValidatedWallet(result.validatedWallet);
        }
      }

      prevDebouncedInputRef.current = debouncedHexInput;
      lastFSMInputRef.current = debouncedHexInput;
    } catch (err: any) {
      debugLog.log('❌ [FSM ERROR]', {
        message: err?.message || 'Unknown error',
        name: err?.name,
        stack: err?.stack,
      });
      debugLog.log('🚨 [FSM ERROR CONTEXT]', stringifyBigInt({
        inputState: InputState[inputState],
        debouncedHexInput,
        chainId: context.chainId,
        accountAddress: context.accountAddress,
        feedType: context.feedType,
        tokenProvided: !!token,
      }));
    } finally {
      fsmIsRunningRef.current = false;
      context.dumpSharedPanelContext?.(`[AFTER FSM UPDATE]`);

      debugLog.log(`[FSM QUEUE CHECK] queued="${queuedInputRef.current}" prev="${prevDebouncedInputRef.current}"`);

      if (queuedInputRef.current && queuedInputRef.current !== prevDebouncedInputRef.current) {
        debugLog.log('🔁 Re-running FSM with queued input');
        setInputState(InputState.VALIDATE_ADDRESS);
        prevDebouncedInputRef.current = queuedInputRef.current;
        queuedInputRef.current = null;
      }
    }
  };

  useEffect(() => {
    if (!selectAddress?.trim()) {
      if (inputState !== InputState.EMPTY_INPUT) {
        setInputState(InputState.EMPTY_INPUT);
      }
      return;
    }

    if (debouncedHexInput !== selectAddress) return;

    if (
      lastFSMInputRef.current === debouncedHexInput &&
      !fsmTriggerStates.includes(inputState)
    ) {
      debugLog.log(`⏭️ Skipping runFSM — already handled "${debouncedHexInput}" and not a trigger state`);
      return;
    }

    runFSM();
  }, [debouncedHexInput, selectAddress, inputState]);

  return { runFSM };
}
