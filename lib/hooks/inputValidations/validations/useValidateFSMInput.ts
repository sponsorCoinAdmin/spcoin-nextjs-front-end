// File: lib/hooks/inputValidations/validations/useValidateFSMInput.ts

'use client';

import { useEffect, useRef, useCallback } from 'react';
import { isAddress, Address } from 'viem';
import { useChainId, useAccount, usePublicClient } from 'wagmi';
import { useDebounce } from '@/lib/hooks/useDebounce';
import {
  InputState,
  TokenContract,
  WalletAccount,
} from '@/lib/structure';

import {
  useBuyTokenAddress,
  useSellTokenAddress,
  useBuyTokenContract,
  useSellTokenContract,
} from '@/lib/context/hooks';

import { debugLog } from '../helpers/debugLogInstance';
import { debugSetInputState } from '../helpers/debugSetInputState';
import { useSharedPanelContext } from '@/lib/context/ScrollSelectPanels/useSharedPanelContext';
import { validateFSMCore } from '../FSM_Core/validateFSMCore';
import { isTerminalFSMState } from '../FSM_Core/terminalStates';
import { useToken } from '@/lib/hooks/wagmi/useToken';

export const useValidateFSMInput = <T extends TokenContract | WalletAccount>(
  selectAddress: string | undefined,
) => {
  const debouncedHexInput = useDebounce(selectAddress || '', 250);

  const {
    inputState,
    setInputState,
    containerType,
    validatedAsset,
    setValidatedAsset,
    feedType,
    dumpSharedPanelContext,
    setTradingTokenCallback,
  } = useSharedPanelContext();

  const inputStateRef = useRef(inputState);
  inputStateRef.current = inputState;

  const prevDebouncedInputRef = useRef('');
  const queuedInputRef = useRef<string | null>(null);
  const fsmIsRunningRef = useRef(false);

  const buyAddress = useBuyTokenAddress();
  const sellAddress = useSellTokenAddress();
  const [, setSellTokenContract] = useSellTokenContract();
  const [, setBuyTokenContract] = useBuyTokenContract();

  const chainId = useChainId();
  const publicClient = usePublicClient();
  const { address: accountAddress } = useAccount();

  const isValidHex = isAddress(debouncedHexInput);
  const resolvedToken = useToken(isValidHex ? (debouncedHexInput as Address) : undefined);

  const seenBrokenLogosRef = useRef<Set<string>>(new Set());

  // ──────────────────────────────────────────────
  // 🔁 Restart FSM if input changed — ALWAYS
  // ──────────────────────────────────────────────
  useEffect(() => {
    const inputChanged = debouncedHexInput !== prevDebouncedInputRef.current;

    console.log('🔎 Checking for new input', {
      prevDebounced: prevDebouncedInputRef.current,
      currentDebounced: debouncedHexInput,
      equal: prevDebouncedInputRef.current === debouncedHexInput,
      inputState: InputState[inputStateRef.current],
      fsmIsRunning: fsmIsRunningRef.current,
    });

    if (inputChanged && !fsmIsRunningRef.current) {
      console.log('🔁 [RESTART FSM] New debounced input detected → VALIDATE_ADDRESS');
      setInputState(InputState.VALIDATE_ADDRESS);
      prevDebouncedInputRef.current = debouncedHexInput;
    }
  }, [debouncedHexInput]);

  // ──────────────────────────────────────────────
  // 🔂 Run FSM logic on input
  // ──────────────────────────────────────────────
  useEffect(() => {
    console.log(`🔥 [ENTRY] useValidateFSMInput → selectAddress="${selectAddress}", debouncedHexInput="${debouncedHexInput}"`);

    if (!selectAddress?.trim()) {
      console.log('⏭️ [SKIP EMPTY] selectAddress is empty → set EMPTY_INPUT');
      if (inputStateRef.current !== InputState.EMPTY_INPUT) {
        setInputState(InputState.EMPTY_INPUT);
      } else {
        console.log('🔁 [NOOP] Already in EMPTY_INPUT — skipping setState');
      }
      return;
    }

    if (debouncedHexInput !== selectAddress) {
      console.log(`⏭️ [WAIT DEBOUNCE] debounce not caught up → skip FSM`);
      return;
    }

    const inputChanged = debouncedHexInput !== prevDebouncedInputRef.current;

    if (fsmIsRunningRef.current) {
      console.log('⏳ [FSM BUSY] → queueing new input');
      queuedInputRef.current = debouncedHexInput;
      return;
    }

    if (!inputChanged && isTerminalFSMState(inputStateRef.current)) {
      console.log(`⏹️ [SKIP TERMINAL] Already in terminal state with no input change`);
      return;
    }

    if (inputChanged) {
      console.log(`🆕 [NEW INPUT] debouncedHexInput changed → FSM will re-enter`);
    }

    dumpSharedPanelContext?.(`[BEFORE FSM] debouncedHexInput="${debouncedHexInput}" state=${InputState[inputStateRef.current]}`);

    const runFSM = async () => {
      fsmIsRunningRef.current = true;
      console.log(`🧵 [FSM START] state=${InputState[inputStateRef.current]} input="${debouncedHexInput}"`);

      try {
        const result = await validateFSMCore({
          inputState: inputStateRef.current,
          debouncedHexInput,
          containerType: containerType!,
          sellAddress,
          buyAddress,
          chainId: chainId!,
          publicClient,
          accountAddress: accountAddress as Address,
          seenBrokenLogos: seenBrokenLogosRef.current,
          feedType,
          validatedAsset,
        });

        console.log(`✅ [FSM RESULT] nextState=${InputState[result.nextState]}`);
        dumpSharedPanelContext?.(`[AFTER FSM] nextState=${InputState[result.nextState]}`);

        if (result.nextState !== inputStateRef.current) {
          console.log(`🛤️ [FSM TRANSITION] ${InputState[inputStateRef.current]} → ${InputState[result.nextState]}`);
          setInputState(result.nextState);
        } else {
          console.log(`⚠️ [NO STATE CHANGE] remains in ${InputState[inputStateRef.current]}`);
        }

        if (result.nextState === InputState.UPDATE_VALIDATED_ASSET && result.validatedAsset) {
          console.log(`🎯 Setting validatedAsset → ${result.validatedAsset.symbol || result.validatedAsset.address}`);
          setValidatedAsset(result.validatedAsset as unknown as T);
        }

        prevDebouncedInputRef.current = debouncedHexInput;
      } catch (err) {
        console.error('❌ [FSM ERROR]', err);
      } finally {
        fsmIsRunningRef.current = false;
        dumpSharedPanelContext?.(`[AFTER FSM UPDATE]`);

        if (queuedInputRef.current && queuedInputRef.current !== prevDebouncedInputRef.current) {
          console.log(`🔁 [FSM QUEUED INPUT] Restarting FSM for queued input="${queuedInputRef.current}"`);
          setInputState(InputState.VALIDATE_ADDRESS);
          prevDebouncedInputRef.current = queuedInputRef.current;
          queuedInputRef.current = null;
        }
      }
    };

    runFSM();
  }, [
    debouncedHexInput,
    selectAddress,
    chainId,
    publicClient,
    accountAddress,
    containerType,
    feedType,
    resolvedToken,
    validatedAsset,
    sellAddress,
    buyAddress,
    setInputState,
    setValidatedAsset,
    dumpSharedPanelContext,
  ]);

  const reportMissingLogoURL = useCallback(() => {
    if (!debouncedHexInput) return;
    if (!seenBrokenLogosRef.current.has(debouncedHexInput)) {
      seenBrokenLogosRef.current.add(debouncedHexInput);
      debugSetInputState(
        `reportMissingLogoURL(${debouncedHexInput})`,
        InputState.PREVIEW_CONTRACT_NOT_FOUND_LOCALLY,
        inputStateRef.current,
        setInputState
      );
    }
  }, [debouncedHexInput, setInputState]);

  const hasBrokenLogoURL = useCallback(() => {
    return seenBrokenLogosRef.current.has(debouncedHexInput);
  }, [debouncedHexInput]);

  return {
    inputState,
    setInputState,
    validatedAsset,
    chainId,
    reportMissingLogoURL,
    hasBrokenLogoURL,
  };
};
