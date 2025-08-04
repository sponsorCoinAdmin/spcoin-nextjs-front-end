// File: lib/hooks/inputValidations/helpers/useValidateFSMInput.ts
'use client';

import { useRef, useEffect, useCallback } from 'react';
import { Address } from 'viem';
import { useChainId, useAccount, usePublicClient } from 'wagmi';
import { useDebounce } from '@/lib/hooks/useDebounce';
import { InputState, getInputStateString, SP_COIN_DISPLAY } from '@/lib/structure';

import { useBuyTokenAddress, useSellTokenAddress } from '@/lib/context/hooks';

import { debugSetInputState } from '../helpers/debugSetInputState';
import { useSharedPanelContext } from '@/lib/context/ScrollSelectPanels/useSharedPanelContext';
import { useDebouncedFSMTrigger } from '../helpers/useDebouncedFSMTrigger';
import { useFSMExecutor } from '../helpers/useFSMExecutor';
import { createDebugLogger } from '@/lib/utils/debugLogger';
import { isTriggerFSMState } from '../FSM_Core/fSMInputStates';

const LOG_TIME = false;
const DEBUG_ENABLED = process.env.NEXT_PUBLIC_DEBUG_LOG_INPUT_STATE_MANAGER === 'true';
const debugLog = createDebugLogger('useValidateFSMInput', DEBUG_ENABLED, LOG_TIME);

export const useValidateFSMInput = (selectAddress: string | undefined) => {
  const debouncedHexInput = useDebounce(selectAddress || '', 250);

  const {
    inputState,
    setInputState,
    containerType,
    validatedAsset,
    manualEntry,
  } = useSharedPanelContext();

  // alert(`useValidateFSMInput(selectAddress: ${selectAddress}) containerType: ${containerType} validatedAsset: ${validatedAsset} manualEntry: ${manualEntry}`);

  const validatedToken = validatedAsset; // Explicit alias for clarity

  const sellAddress = useSellTokenAddress();
  const buyAddress = useBuyTokenAddress();
  const chainId = useChainId();
  const publicClient = usePublicClient();
  const { address: accountAddress } = useAccount();

  const seenBrokenLogosRef = useRef<Set<string>>(new Set());

  // 🔍 Context logging
  useEffect(() => {
    debugLog.log(`🎯 containerType: ${SP_COIN_DISPLAY[containerType]} (${containerType})`);
  }, [containerType]);

  useEffect(() => {
    debugLog.log('🔁 useValidateFSMInput INIT', {
      selectAddress,
      debouncedHexInput,
      initialInputState: getInputStateString(inputState),
      manualEntry,
    });
  }, []); // One-time log on mount

  // Debounce FSM trigger
  useDebouncedFSMTrigger();

  // FSM Executor
  const { runFSM } = useFSMExecutor({
    sellAddress,
    buyAddress,
    chainId,
    publicClient,
    accountAddress: accountAddress as Address,
    seenBrokenLogosRef,
    token: validatedToken,
  });

  // Trigger FSM only when inputState is in trigger list and input is ready
  useEffect(() => {
    const ready =
      isTriggerFSMState(inputState) && debouncedHexInput.trim() !== '';

    if (!ready) {
      debugLog.log(`⏸️ Skipping FSM. State: ${getInputStateString(inputState)}`);
      return;
    }

    debugLog.log(`🚀 Triggering FSM: ${getInputStateString(inputState)} + debouncedHexInput stable`);
    runFSM();
  }, [inputState, debouncedHexInput, runFSM]);

  // Reset FSM if input is cleared
  useEffect(() => {
    if (!selectAddress?.trim() && inputState !== InputState.EMPTY_INPUT) {
      debugLog.log('🧹 Resetting to EMPTY_INPUT (selectAddress is empty)');
      setInputState(InputState.EMPTY_INPUT, 'useValidateFSMInput');
    }
  }, [selectAddress, inputState, setInputState]);

const reportMissingLogoURL = useCallback(() => {
  if (!debouncedHexInput) return;
  if (!seenBrokenLogosRef.current.has(debouncedHexInput)) {
    seenBrokenLogosRef.current.add(debouncedHexInput);

    // 🛠️ Wrap your 2-arg setter into a single-arg adapter
    const setInputStateSingleArg = (state: InputState) =>
      setInputState(state, `reportMissingLogoURL(${debouncedHexInput})`);

    debugSetInputState(
      `reportMissingLogoURL(${debouncedHexInput})`,
      InputState.PREVIEW_CONTRACT_NOT_FOUND_LOCALLY,
      inputState,
      setInputStateSingleArg // ✅ compatible with expected type
    );
  }
}, [debouncedHexInput, inputState, setInputState]);


  const hasBrokenLogoURL = useCallback(() => {
    return seenBrokenLogosRef.current.has(debouncedHexInput);
  }, [debouncedHexInput]);

  return {
    inputState,
    setInputState,
    validatedToken,
    validatedWallet: undefined, // useSharedPanelContext may not expose this directly
    chainId,
    reportMissingLogoURL,
    hasBrokenLogoURL,
  };
};
