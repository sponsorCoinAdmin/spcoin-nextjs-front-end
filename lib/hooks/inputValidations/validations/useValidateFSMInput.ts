// File: lib/hooks/inputValidations/useValidateFSMInput.ts

'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import { isAddress, Address } from 'viem';
import { useChainId, useAccount, usePublicClient, useBalance } from 'wagmi';

import { useDebounce } from '@/lib/hooks/useDebounce';
import {
  InputState,
  SP_COIN_DISPLAY,
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
    dumpSharedPanelContext,
  } = useSharedPanelContext();

  const inputStateRef = useRef(inputState);
  inputStateRef.current = inputState;

  const prevInputRef = useRef<string | undefined>(undefined);

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
  const [validationPending, setValidationPending] = useState(false);

  // 🆕 Reset FSM to VALIDATE_ADDRESS on input change
  useEffect(() => {
    if (debouncedHexInput !== prevInputRef.current) {
      debugLog.log('🔄 [RESET] New input detected, resetting FSM to VALIDATE_ADDRESS');
      setInputState(InputState.VALIDATE_ADDRESS);
    }
    prevInputRef.current = debouncedHexInput;
  }, [debouncedHexInput, setInputState]);

  useEffect(() => {
    debugLog.log(`🔥 [ENTRY] useValidateFSMInput → selectAddress="${selectAddress}", debouncedHexInput="${debouncedHexInput}"`);

    // 🛡️ HARD SKIP IF DEBOUNCE NOT READY
    if (!selectAddress || selectAddress.trim() === '') {
      debugLog.log('⏭️ [SKIP EMPTY] selectAddress is empty → set EMPTY_INPUT');
      if (inputStateRef.current !== InputState.EMPTY_INPUT) {
        setInputState(InputState.EMPTY_INPUT);
      }
      return;
    }

    if (debouncedHexInput !== selectAddress) {
      debugLog.log(`⏭️ [HARD SKIP] debounce not caught up → skip FSM run until ready`);
      return;
    }

    if (validationPending) {
      debugLog.log('⏳ [SKIP] validation already in progress, holding...');
      return;
    }

    dumpSharedPanelContext?.(`[BEFORE FSM] debouncedHexInput="${debouncedHexInput}" state=${InputState[inputStateRef.current]}`);

    const runFSM = async () => {
      setValidationPending(true);
      debugLog.log(`🧵 [FSM RUN] state=${InputState[inputStateRef.current]}, input="${debouncedHexInput}"`);

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
          balanceData: balanceData?.value,
          validatedAsset,
        });

        debugLog.log(`✅ [FSM RESULT] nextState=${InputState[result.nextState]}`);
        dumpSharedPanelContext?.(`[AFTER FSM CORE] nextState=${InputState[result.nextState]}`);

        if (result.nextState !== inputStateRef.current) {
          setInputState(result.nextState);
        } else {
          debugLog.log(`⚠️ [SKIP] nextState same as current, no update`);
        }

        if (result.validatedAsset) {
          setValidatedAsset(result.validatedAsset as unknown as T);
          if (containerType === SP_COIN_DISPLAY.SELL_SELECT_CONTAINER) {
            setSellTokenContract(result.validatedAsset as TokenContract);
          } else if (containerType === SP_COIN_DISPLAY.BUY_SELECT_CONTAINER) {
            setBuyTokenContract(result.validatedAsset as TokenContract);
          }
        }
      } catch (err) {
        console.error('❌ [FSM ERROR]', err);
      } finally {
        setValidationPending(false);
        dumpSharedPanelContext?.(`[AFTER FSM UPDATE]`);
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
    balanceData,
    validatedAsset,
    sellAddress,
    buyAddress,
    setInputState,
    setValidatedAsset,
    setSellTokenContract,
    setBuyTokenContract,
    dumpSharedPanelContext,
    validationPending,
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
    validationPending,
  };
};
