// File: lib/hooks/inputValidations/helpers/useValidateFSMInput.ts

'use client';

import { useRef, useEffect, useCallback } from 'react';
import { Address } from 'viem';
import { useChainId, useAccount, usePublicClient } from 'wagmi';
import { useDebounce } from '@/lib/hooks/useDebounce';
import { InputState, getInputStateString, SP_COIN_DISPLAY } from '@/lib/structure';

import {
  useBuyTokenAddress,
  useSellTokenAddress,
} from '@/lib/context/hooks';

import { debugSetInputState } from '../helpers/debugSetInputState';
import { useSharedPanelContext } from '@/lib/context/ScrollSelectPanels/useSharedPanelContext';
import { useDebouncedFSMTrigger } from '../helpers/useDebouncedFSMTrigger';
import { useFSMExecutor } from '../helpers/useFSMExecutor';
import { createDebugLogger } from '@/lib/utils/debugLogger';

const LOG_TIME = false;
const DEBUG_ENABLED = process.env.NEXT_PUBLIC_DEBUG_LOG_INPUT_STATE_MANAGER === 'true';
const debugLog = createDebugLogger('useValidateFSMInput', DEBUG_ENABLED, LOG_TIME);

export const useValidateFSMInput = (
  selectAddress: string | undefined,
) => {
  const debouncedHexInput = useDebounce(selectAddress || '', 250);

  const {
    inputState,
    setInputState,
    containerType,
    validatedToken,
    validatedWallet,
    setValidatedToken: ctxSetValidatedToken,
    setValidatedWallet: ctxSetValidatedWallet,
    feedType,
    dumpSharedPanelContext,
    setTradingTokenCallback,
  } = useSharedPanelContext();

  // 🔍 Log containerType if valid
  useEffect(() => {
    if (typeof containerType === 'number' && SP_COIN_DISPLAY[containerType]) {
      debugLog.log(`🎯 containerType from context: ${SP_COIN_DISPLAY[containerType]} (${containerType})`);
    } else {
      debugLog.warn(`⚠️ containerType is invalid or undefined: ${containerType}`);
    }
  }, [containerType]);

  const setValidatedToken = ctxSetValidatedToken ?? (() => {});
  const setValidatedWallet = ctxSetValidatedWallet ?? (() => {});

  const inputStateRef = useRef(inputState);
  inputStateRef.current = inputState;

  const buyAddress = useBuyTokenAddress();
  const sellAddress = useSellTokenAddress();
  const chainId = useChainId();
  const publicClient = usePublicClient();
  const { address: accountAddress } = useAccount();

  const seenBrokenLogosRef = useRef<Set<string>>(new Set());

  // Debounce FSM restart if terminal and new input arrives
  useDebouncedFSMTrigger({
    debouncedHexInput,
    inputState,
    setInputState,
  });

  const { runFSM } = useFSMExecutor({
    debouncedHexInput,
    inputState,
    setInputState,
    seenBrokenLogosRef,
    context: {
      containerType,
      sellAddress,
      buyAddress,
      chainId,
      publicClient,
      accountAddress: accountAddress as Address,
      feedType,
      setValidatedToken,
      setValidatedWallet,
      dumpSharedPanelContext,
    },
  });

  useEffect(() => {
    if (!selectAddress?.trim()) {
      if (inputStateRef.current !== InputState.EMPTY_INPUT) {
        setInputState(InputState.EMPTY_INPUT);
      }
      return;
    }

    if (debouncedHexInput !== selectAddress) return;

    runFSM();
  }, [debouncedHexInput, selectAddress]);

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
    validatedToken,
    validatedWallet,
    chainId,
    reportMissingLogoURL,
    hasBrokenLogoURL,
  };
};
