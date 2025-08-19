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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ⛔️ Removed: useDebouncedFSMTrigger() — the new FSM state manager should be
  // the ONLY driver of inputState. Keeping this avoids double "kicks" and races.

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
