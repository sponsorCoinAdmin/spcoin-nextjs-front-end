// File: lib/hooks/inputValidations/useValidateFSMInput.ts

'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import { isAddress, Address } from 'viem';
import { useChainId, useAccount, usePublicClient, useBalance } from 'wagmi';

import { useDebounce } from '@/lib/hooks/useDebounce';
import { getInputStateEmoji } from '@/lib/hooks/inputValidations/helpers/getInputStateEmoji';
import {
  InputState,
  CONTAINER_TYPE,
  FEED_TYPE,
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
    dumpPanelContext, // ✅ include optional dump
  } = useSharedPanelContext();

  const buyAddress = useBuyTokenAddress();
  const sellAddress = useSellTokenAddress();
  const [, setSellTokenContract] = useSellTokenContract();
  const [, setBuyTokenContract] = useBuyTokenContract();

  const chainId = useChainId();
  const publicClient = usePublicClient();
  const { address: accountAddress } = useAccount();

  const { data: balanceData } = useBalance({
    address: isAddress(debouncedHexInput) ? (debouncedHexInput as Address) : undefined,
    token: isAddress(debouncedHexInput) ? (debouncedHexInput as Address) : undefined,
    chainId,
    query: { enabled: Boolean(accountAddress) },
  });

  const seenBrokenLogosRef = useRef<Set<string>>(new Set());
  const [validationPending, setValidationPending] = useState(true);

  useEffect(() => {
    debugLog.log(`🔥 FSM hook mounted, selectAddress: ${selectAddress}`);

    if (debouncedHexInput !== selectAddress) {
      debugLog.log(`⏭️ Skipping FSM: debounced="${debouncedHexInput}" hasn't caught up with input="${selectAddress}"`);
      return;
    }

    dumpPanelContext?.(`📦 BEFORE FSM run — debouncedHexInput="${debouncedHexInput}"`);

    debugLog.log(`🧵 FSM triggered → ${getInputStateEmoji(inputState)} ${InputState[inputState]} on: "${debouncedHexInput}"`);

    const runFSM = async () => {
      const result = await validateFSMCore({
        inputState,
        debouncedHexInput,
        containerType: containerType!,
        sellAddress,
        buyAddress,
        chainId: chainId!,
        publicClient,
        accountAddress: accountAddress as Address,
        seenBrokenLogos: seenBrokenLogosRef.current,
        feedType,
        balanceData: balanceData?.value, // ✅ pass bigint only
        validatedAsset,
      });

      debugLog.log(`🔄 FSM next state → ${InputState[result.nextState]}`);
      dumpPanelContext?.(`✅ AFTER FSM core result — nextState="${InputState[result.nextState]}"`);

      setInputState(result.nextState);

      if (result.validatedAsset) {
        setValidatedAsset(result.validatedAsset as unknown as T);
        if (containerType === CONTAINER_TYPE.SELL_SELECT_CONTAINER) {
          setSellTokenContract(result.validatedAsset as TokenContract);
        } else if (containerType === CONTAINER_TYPE.BUY_SELECT_CONTAINER) {
          setBuyTokenContract(result.validatedAsset as TokenContract);
        }
      }

      setValidationPending(false);
      dumpPanelContext?.('✅ AFTER state + asset update');
    };

    runFSM();
  }, [
    inputState,
    debouncedHexInput,
    selectAddress,
    chainId,
    publicClient,
    accountAddress,
    containerType,
    feedType,
    balanceData,
    validatedAsset,
    sellAddress,
    buyAddress,
    setInputState,
    setValidatedAsset,
    setSellTokenContract,
    setBuyTokenContract,
    dumpPanelContext, // ✅ ensure included
  ]);

  const reportMissingLogoURL = useCallback(() => {
    if (!debouncedHexInput) return;
    if (!seenBrokenLogosRef.current.has(debouncedHexInput)) {
      seenBrokenLogosRef.current.add(debouncedHexInput);
      console.warn(`🛑 Missing logoURL for ${debouncedHexInput}`);
      debugSetInputState(
        `reportMissingLogoURL(${debouncedHexInput})`,
        InputState.CONTRACT_NOT_FOUND_LOCALLY,
        inputState,
        setInputState
      );
    }
  }, [debouncedHexInput, inputState, setInputState]);

  const hasBrokenLogoURL = useCallback(() => {
    return seenBrokenLogosRef.current.has(debouncedHexInput);
  }, [debouncedHexInput]);

  return {
    inputState,
    setInputState,
    validatedAsset,
    isLoading: inputState === InputState.IS_LOADING,
    chainId,
    reportMissingLogoURL,
    hasBrokenLogoURL,
    validationPending,
  };
};
