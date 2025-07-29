// File: lib/hooks/inputValidations/helpers/useFSMExecutor.ts

import { useRef } from 'react';
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
}

export function useFSMExecutor({
  debouncedHexInput,
  inputState,
  setInputState,
  seenBrokenLogosRef,
  context,
  token,
}: Props) {
  const prevDebouncedInputRef = useRef('');
  const queuedInputRef = useRef<string | null>(null);
  const fsmIsRunningRef = useRef(false);

  const runFSM = async () => {
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

      // debugLog.log('📬 [FSM RESULT]', stringifyBigInt({
      //   nextState: InputState[result.nextState],
      //   validatedToken: result.validatedToken,
      //   validatedWallet: result.validatedWallet,
      // }));

      context.dumpSharedPanelContext?.(`[AFTER FSM] nextState=${InputState[result.nextState]}`);

      if (result.nextState !== inputState) {
        // debugLog.log(`🛤️ [FSM TRANSITION] ${InputState[inputState]} → ${InputState[result.nextState]}`);
        setInputState(result.nextState);
      } else {
        // debugLog.log(`⚠️ [NO STATE CHANGE] remains in ${InputState[inputState]}`);
      }

      if (result.nextState === InputState.UPDATE_VALIDATED_ASSET) {
        if (result.validatedToken) {
          // debugLog.log(`🎯 Setting validatedToken → ${result.validatedToken.symbol || result.validatedToken.address.toString()}`);
          context.setValidatedToken(result.validatedToken);
        } else if (result.validatedWallet) {
          // debugLog.log(`🎯 Setting validatedWallet → ${result.validatedWallet.name || result.validatedWallet.address.toString()}`);
          context.setValidatedWallet(result.validatedWallet);
        } else {
          // debugLog.warn('⚠️ UPDATE_VALIDATED_ASSET reached but no validatedToken or validatedWallet provided');
        }
      }

      prevDebouncedInputRef.current = debouncedHexInput;
    } catch (err: any) {
      debugLog.log('❌ [FSM ERROR]', {
        message: err?.message || 'Unknown error',
        name: err?.name,
        stack: err?.stack,
      }); debugLog.log('🚨 [FSM ERROR CONTEXT]', stringifyBigInt({
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

      if (queuedInputRef.current && queuedInputRef.current !== prevDebouncedInputRef.current) {
        // debugLog.log(`🔁 [FSM QUEUED INPUT] Restarting FSM for queued input="${queuedInputRef.current}"`);
        setInputState(InputState.VALIDATE_ADDRESS);
        prevDebouncedInputRef.current = queuedInputRef.current;
        queuedInputRef.current = null;
      }
    }
  };

  return { runFSM };
}
