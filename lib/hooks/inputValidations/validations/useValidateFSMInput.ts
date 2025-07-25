// File: lib/hooks/inputValidations/validations/useValidateFSMInput.ts

'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import { isAddress, Address } from 'viem';
import { useChainId, useAccount, usePublicClient } from 'wagmi';

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
  const [validationPending, setValidationPending] = useState(false);

  useEffect(() => {
    debugLog.log(`🔥 [ENTRY] useValidateFSMInput → selectAddress="${selectAddress}", debouncedHexInput="${debouncedHexInput}"`);

    if (!selectAddress?.trim()) {
      debugLog.log('⏭️ [SKIP EMPTY] selectAddress is empty → set EMPTY_INPUT');
      if (inputStateRef.current !== InputState.EMPTY_INPUT) {
        setInputState(InputState.EMPTY_INPUT);
      }
      return;
    }

    if (debouncedHexInput !== selectAddress) {
      debugLog.log(`⏭️ [WAIT DEBOUNCE] debounce not caught up → skip FSM`);
      return;
    }

    if (validationPending) {
      debugLog.log('⏳ [SKIP] validation already in progress');
      return;
    }

    if (isTerminalFSMState(inputStateRef.current)) {
      debugLog.log(`⏹️ [SKIP TERMINAL] Already in terminal state`);
      return;
    }

    dumpSharedPanelContext?.(`[BEFORE FSM] debouncedHexInput="${debouncedHexInput}" state=${InputState[inputStateRef.current]}`);

    const runFSM = async () => {
      setValidationPending(true);
      debugLog.log(`🧵 [FSM START] state=${InputState[inputStateRef.current]} input="${debouncedHexInput}"`);

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

        debugLog.log(`✅ [FSM RESULT] nextState=${InputState[result.nextState]}`);
        dumpSharedPanelContext?.(`[AFTER FSM] nextState=${InputState[result.nextState]}`);

        if (result.nextState !== inputStateRef.current) {
          debugLog.log(`🛤️ [FSM TRANSITION] ${InputState[inputStateRef.current]} → ${InputState[result.nextState]}`);
          setInputState(result.nextState);
        } else {
          debugLog.log(`⚠️ [NO STATE CHANGE] remains in ${InputState[inputStateRef.current]}`);
        }

        if (result.nextState === InputState.UPDATE_VALIDATED_ASSET && result.validatedAsset) {
          debugLog.log(`🎯 Setting validatedAsset → ${result.validatedAsset.symbol || result.validatedAsset.address}`);
          setValidatedAsset(result.validatedAsset as unknown as T);
          // Don't update contract directly, SharedPanelProvider handles trading callback
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
    resolvedToken,
    validatedAsset,
    sellAddress,
    buyAddress,
    setInputState,
    setValidatedAsset,
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
