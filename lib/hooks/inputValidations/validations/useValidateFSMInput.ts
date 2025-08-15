// File: lib/hooks/inputValidations/helpers/useValidateFSMInput.ts
'use client';

import { useRef, useEffect, useCallback } from 'react';
import { useChainId, useAccount, usePublicClient } from 'wagmi';

import { useDebounce } from '@/lib/hooks/useDebounce';
import { SP_COIN_DISPLAY } from '@/lib/structure';
import { InputState } from '@/lib/structure/assetSelection';


import { useBuyTokenAddress, useSellTokenAddress } from '@/lib/context/hooks';
import { useAssetSelectionContext } from '@/lib/context/ScrollSelectPanels/useAssetSelectionContext';

import { createDebugLogger } from '@/lib/utils/debugLogger';
import { useDebouncedFSMTrigger } from '../helpers/useDebouncedFSMTrigger';

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
  } = useAssetSelectionContext();

  const validatedToken = validatedAsset; // Explicit alias

  const sellAddress = useSellTokenAddress();
  const buyAddress = useBuyTokenAddress();
  const chainId = useChainId();
  const publicClient = usePublicClient();
  const { address: accountAddress } = useAccount();

  const seenBrokenLogosRef = useRef<Set<string>>(new Set());

  // Debug logs on mount
  useEffect(() => {
    debugLog.log(`🎯 containerType: ${SP_COIN_DISPLAY[containerType]} (${containerType})`);
  }, [containerType]);

  useEffect(() => {
    debugLog.log('🔁 useValidateFSMInput INIT', {
      selectAddress,
      debouncedHexInput,
      initialInputState: InputState[inputState],
      manualEntry,
    });
  }, []);

  // Triggers FSM rerun when debounce completes (noop if not terminal)
  useDebouncedFSMTrigger();

  // Reset FSM if input is cleared
  useEffect(() => {
    if (!selectAddress?.trim() && inputState !== InputState.EMPTY_INPUT) {
      debugLog.log('🧹 Resetting to EMPTY_INPUT (selectAddress is empty)');
      setInputState(InputState.EMPTY_INPUT, 'useValidateFSMInput');
    }
  }, [selectAddress, inputState, setInputState]);

  const hasBrokenLogoURL = useCallback(() => {
    return seenBrokenLogosRef.current.has(debouncedHexInput);
  }, [debouncedHexInput]);

  return {
    inputState,
    setInputState,
    validatedToken,
    validatedWallet: undefined,
    chainId,
    hasBrokenLogoURL,
  };
};
