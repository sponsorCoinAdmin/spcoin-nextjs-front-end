// File: lib/hooks/validationStateHooks/useInputValidationState.ts
'use client';

import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';

import {
  InputState,
  TokenContract,
  WalletAccount,
  CONTAINER_TYPE,
  FEED_TYPE,
} from '@/lib/structure';

import {
  useBuyTokenContract,
  useSellTokenContract,
} from '@/lib/context/hooks';

import { getLogoURL } from '@/lib/network/utils';
import { useDebouncedAddress } from './validationStateHooks/useDebouncedAddress';
import { useResolvedAsset } from './validationStateHooks/useResolvedAsset';
import { useTokenBalance } from './validationStateHooks/useTokenBalance';
import {
  useValidationStateManager,
  setDebugInputState,
} from './validationStateHooks/useValidationStateManager';
import { useLogoURL } from './validationStateHooks/useLogoURL';
import { createDebugLogger } from '@/lib/utils/debugLogger';
import { useLocalChainId } from '../context/hooks/nestedHooks/useLocalChainId';

const LOG_TIME = false;
const DEBUG_ENABLED = process.env.NEXT_PUBLIC_DEBUG_LOG_VALIDATION_STATE === 'true';
const debugLog = createDebugLogger('useInputValidationState', DEBUG_ENABLED, LOG_TIME);

export const useInputValidationState = <T extends TokenContract | WalletAccount>(
  selectAddress: string | undefined,
  feedType: FEED_TYPE = FEED_TYPE.TOKEN_LIST,
  containerType?: CONTAINER_TYPE
) => {
  const debouncedAddress = useDebouncedAddress(selectAddress);
  const [inputState, setInputState] = useState<InputState>(InputState.EMPTY_INPUT);
  const [validatedAsset, setValidatedAsset] = useState<T | undefined>(undefined);

  const [, setSellTokenContract] = useSellTokenContract();
  const [, setBuyTokenContract] = useBuyTokenContract();

  const chainId = useLocalChainId();
  const { address: accountAddress } = useAccount();

  // ✅ Now passes feedType into useResolvedAsset
  const { resolvedAsset } = useResolvedAsset(debouncedAddress, feedType);

  const { data: balanceData } = useTokenBalance(resolvedAsset?.address);

  const { seenBrokenLogosRef, lastTokenAddressRef } = useValidationStateManager(
    debouncedAddress,
    inputState,
    setInputState
  );

  const setDebugState = (newState: InputState) =>
    setDebugInputState(debugLog, newState, inputState, setInputState);

  const { reportMissingLogoURL, hasBrokenLogoURL } = useLogoURL(
    debouncedAddress,
    inputState,
    setInputState,
    seenBrokenLogosRef
  );

  const isValidating = !resolvedAsset || !balanceData;

  useEffect(() => {
    debugLog.log(`🔁 Validation effect triggered`);
    debugLog.log(`📌 isValidating: ${isValidating}`);
    debugLog.log(`📦 resolvedAsset:`, resolvedAsset);
    debugLog.log(`💰 balanceData:`, balanceData);
    debugLog.log(`🔎 selectAddress: ${selectAddress}`);
    debugLog.log(`📨 debouncedAddress: ${debouncedAddress}`);

    if (isValidating) return;

    if (!resolvedAsset?.address) {
      debugLog.warn(`⛔ resolvedAsset.address missing — skipping`);
      return;
    }

    if (lastTokenAddressRef.current === resolvedAsset.address) {
      debugLog.log(`⏩ Skipping — already validated address: ${resolvedAsset.address}`);
      return;
    }

    debugLog.log(`✅ New validation target: ${resolvedAsset.address}`);
    lastTokenAddressRef.current = resolvedAsset.address;

    const tokenWithBalance: TokenContract = {
      ...resolvedAsset,
      balance: balanceData.value,
      chainId,
      logoURL: getLogoURL(chainId, resolvedAsset.address, feedType),
    };

    setValidatedAsset(tokenWithBalance as T);

    if (containerType === CONTAINER_TYPE.SELL_SELECT_CONTAINER) {
      debugLog.log(`💸 Setting sell token`);
      setSellTokenContract(tokenWithBalance);
    } else if (containerType === CONTAINER_TYPE.BUY_SELECT_CONTAINER) {
      debugLog.log(`🛒 Setting buy token`);
      setBuyTokenContract(tokenWithBalance);
    }

    setDebugState(InputState.VALID_INPUT_PENDING);
  }, [resolvedAsset?.address, balanceData?.value, chainId]);

  return {
    inputState,
    validatedAsset,
    isValidating,
    reportMissingLogoURL,
    hasBrokenLogoURL,
  };
};
