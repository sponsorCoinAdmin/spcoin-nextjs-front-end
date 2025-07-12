// File: lib/hooks/inputValidations/useValidateFSMInput.ts

'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import { isAddress, Address } from 'viem';
import { useChainId, useAccount, usePublicClient, useBalance } from 'wagmi';

import { useDebounce } from '@/lib/hooks/useDebounce';
import {
  InputState,
  CONTAINER_TYPE,
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
    dumpPanelContext,
  } = useSharedPanelContext();

  const inputStateRef = useRef(inputState);
  inputStateRef.current = inputState;

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

  useEffect(() => {
    debugLog.log(`🔥 [ENTRY] useValidateFSMInput → selectAddress="${selectAddress}", debouncedHexInput="${debouncedHexInput}"`);

    // 🚨 Guard: skip if no input, but reset state if needed
    if (!selectAddress || selectAddress.trim() === '') {
      debugLog.log('⏭️ [SKIP] selectAddress is empty or undefined → CLEAR to EMPTY_INPUT');
      if (inputStateRef.current !== InputState.EMPTY_INPUT) {
        debugLog.log(`🔄 [STATE UPDATE] Changing state from ${InputState[inputStateRef.current]} to EMPTY_INPUT`);
        setInputState(InputState.EMPTY_INPUT);
      }
      return;
    }

    // 🚨 Guard: skip if debounce hasn’t caught up
    if (debouncedHexInput !== selectAddress) {
      debugLog.log(`⏭️ [SKIP] debouncedHexInput ("${debouncedHexInput}") hasn't caught up with selectAddress ("${selectAddress}")`);
      return;
    }

    // 🚨 Guard: skip if validation is pending
    if (validationPending) {
      debugLog.log('⏳ [SKIP] validation already in progress, holding...');
      return;
    }

    // 🚨 Guard: skip if in terminal state
    // 🚨 Guard: skip if in terminal state
    const terminalStates = [
      InputState.INVALID_ADDRESS_INPUT,
      InputState.DUPLICATE_INPUT_ERROR,
      InputState.CONTRACT_NOT_FOUND_ON_BLOCKCHAIN,
      InputState.CONTRACT_NOT_FOUND_LOCALLY,
    ];
    if (terminalStates.includes(inputStateRef.current)) {
      dumpPanelContext?.('useValidateFSMInput(${debouncedHexInput}):Skipping FSM run:(${InputState[inputStateRef.current]} state is terminal)');
      return;
    }

    dumpPanelContext?.(`[BEFORE FSM] debouncedHexInput="${debouncedHexInput}" state=${InputState[inputStateRef.current]}`);

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
        dumpPanelContext?.(`[AFTER FSM CORE] nextState=${InputState[result.nextState]}`);

        if (result.nextState !== inputStateRef.current) {
          debugLog.log(`🔄 [STATE UPDATE] Changing state from ${InputState[inputStateRef.current]} to ${InputState[result.nextState]}`);
          setInputState(result.nextState);
        } else {
          debugLog.log(`⚠️ [SKIP] nextState same as current, no update`);
        }

        if (result.validatedAsset) {
          setValidatedAsset(result.validatedAsset as unknown as T);
          if (containerType === CONTAINER_TYPE.SELL_SELECT_CONTAINER) {
            setSellTokenContract(result.validatedAsset as TokenContract);
          } else if (containerType === CONTAINER_TYPE.BUY_SELECT_CONTAINER) {
            setBuyTokenContract(result.validatedAsset as TokenContract);
          }
        }
      } catch (err) {
        console.error('❌ [FSM ERROR]', err);
      } finally {
        setValidationPending(false);
        dumpPanelContext?.(`[AFTER FSM UPDATE]`);
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
    dumpPanelContext,
  ]);

  const reportMissingLogoURL = useCallback(() => {
    if (!debouncedHexInput) return;
    if (!seenBrokenLogosRef.current.has(debouncedHexInput)) {
      seenBrokenLogosRef.current.add(debouncedHexInput);
      console.warn(`🛑 [MISSING LOGO] ${debouncedHexInput}`);
      debugSetInputState(
        `reportMissingLogoURL(${debouncedHexInput})`,
        InputState.CONTRACT_NOT_FOUND_LOCALLY,
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
    isLoading: inputState === InputState.IS_LOADING,
    chainId,
    reportMissingLogoURL,
    hasBrokenLogoURL,
    validationPending,
  };
};
