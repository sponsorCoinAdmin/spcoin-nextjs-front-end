// File: lib/hooks/inputValidations/useValidateFSMInput.ts

'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import { isAddress } from 'viem';
import { useChainId, useAccount, usePublicClient, useBalance } from 'wagmi';

import { useDebounce } from '@/lib/hooks/useDebounce';
import { getLogoURL } from '@/lib/network/utils';
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

import { isEmptyInput } from './isEmptyInput';
import { isDuplicateInput } from './isDuplicateInput';
import { resolveTokenContract } from './resolveTokenContract';
import { useSharedPanelContext } from '@/lib/context/ScrollSelectPanels/SharedPanelContext';

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
    feedType
  } = useSharedPanelContext();

  const buyAddress = useBuyTokenAddress();
  const sellAddress = useSellTokenAddress();
  const [, setSellTokenContract] = useSellTokenContract();
  const [, setBuyTokenContract] = useBuyTokenContract();

  const chainId = useChainId();
  const publicClient = usePublicClient();
  const { address: accountAddress } = useAccount();

  const { data: balanceData } = useBalance({
    address: isAddress(debouncedHexInput) ? debouncedHexInput as `0x${string}` : undefined,
    token: isAddress(debouncedHexInput) ? debouncedHexInput as `0x${string}` : undefined,
    chainId,
    query: { enabled: Boolean(accountAddress) },
  });

  const seenBrokenLogosRef = useRef<Set<string>>(new Set());
  const lastTokenAddressRef = useRef<string>('');
  const [validationPending, setValidationPending] = useState(true);

  useEffect(() => {
  debugLog.log(`🎯 FSM useEffect triggered → state: ${InputState[inputState]}, debounced: ${debouncedHexInput}`);
}, [inputState, debouncedHexInput]);

  useEffect(() => {
    if (debouncedHexInput !== selectAddress) {
      debugLog.log(`⏭️ Skipping FSM: debounced="${debouncedHexInput}" hasn't caught up with input="${selectAddress}"`);
      return;
    }

    const stateLabel = `${getInputStateEmoji(inputState)} ${InputState[inputState]}`;
    debugLog.log(`🧵 FSM triggered for state ${stateLabel} on debouncedHexInput: "${debouncedHexInput}"`);

    const runValidationFSM = async () => {
      switch (inputState) {
        case InputState.EMPTY_INPUT:
        case InputState.INVALID_ADDRESS_INPUT:
        case InputState.INCOMPLETE_ADDRESS:
        case InputState.DUPLICATE_INPUT:
        case InputState.CONTRACT_NOT_FOUND_ON_BLOCKCHAIN:
        case InputState.CONTRACT_NOT_FOUND_LOCALLY:
        case InputState.VALID_INPUT:
          setValidationPending(false);
          return;

        case InputState.VALIDATE_ADDRESS: {
          setValidationPending(true);

          if (isEmptyInput(debouncedHexInput)) {
            setValidatedAsset?.(undefined);
            debugSetInputState('EMPTY_INPUT', InputState.EMPTY_INPUT, inputState, setInputState);
          } else if (!/^0x[0-9a-fA-F]*$/.test(debouncedHexInput)) {
            alert('Hex Input Address Required');
            debugSetInputState('INCOMPLETE_ADDRESS', InputState.INCOMPLETE_ADDRESS, inputState, setInputState);
          } else if (!isAddress(debouncedHexInput)) {
            debugSetInputState('INVALID_ADDRESS', InputState.INVALID_ADDRESS_INPUT, inputState, setInputState);
          } else {
            debugSetInputState('PASS → TEST_DUPLICATE', InputState.TEST_DUPLICATE_INPUT, inputState, setInputState);
          }
          return;
        }

        case InputState.TEST_DUPLICATE_INPUT:
          if (isDuplicateInput(containerType!, debouncedHexInput, sellAddress, buyAddress)) {
            alert('Duplicate address detected');
            debugSetInputState('DUPLICATE_INPUT', InputState.DUPLICATE_INPUT, inputState, setInputState);
          } else {
            debugSetInputState('PASS → VALIDATE_EXISTS_ON_CHAIN', InputState.VALIDATE_EXISTS_ON_CHAIN, inputState, setInputState);
          }
          return;

        case InputState.VALIDATE_EXISTS_ON_CHAIN:
          if (!publicClient) {
            debugLog.warn('❌ publicClient is undefined – skipping resolution');
            setValidationPending(false);
            return;
          }

          const resolved = await resolveTokenContract(
            debouncedHexInput,
            chainId,
            feedType,
            publicClient,
            accountAddress
          );

          if (!resolved) {
            alert('Contract not found on blockchain');
            debugSetInputState('NOT_FOUND', InputState.CONTRACT_NOT_FOUND_ON_BLOCKCHAIN, inputState, setInputState);
            return;
          }

          debugLog.log('🎯 Resolved token contract', resolved);
          setValidatedAsset?.(resolved as unknown as T);

          if (containerType === CONTAINER_TYPE.SELL_SELECT_CONTAINER) {
            setSellTokenContract(resolved);
          } else if (containerType === CONTAINER_TYPE.BUY_SELECT_CONTAINER) {
            setBuyTokenContract(resolved);
          }

          debugSetInputState('PASS → VALIDATE_CONTRACT_EXISTS_LOCALLY', InputState.VALIDATE_CONTRACT_EXISTS_LOCALLY, inputState, setInputState);
          return;

        case InputState.VALIDATE_CONTRACT_EXISTS_LOCALLY:
          if (seenBrokenLogosRef.current.has(debouncedHexInput)) {
            alert('Local contract logo missing');
            debugSetInputState('BROKEN_LOGO', InputState.CONTRACT_NOT_FOUND_LOCALLY, inputState, setInputState);
          } else {
            debugSetInputState('PASS → VALIDATE_BALANCE', InputState.VALIDATE_BALANCE, inputState, setInputState);
          }
          return;

        case InputState.VALIDATE_BALANCE:
          if (!balanceData || !validatedAsset) return;
          if (lastTokenAddressRef.current === validatedAsset.address) return;

          lastTokenAddressRef.current = validatedAsset.address;

          const tokenWithBalance: TokenContract = {
            ...validatedAsset,
            balance: balanceData.value,
            chainId: chainId!,
            logoURL: getLogoURL(chainId!, validatedAsset.address, feedType),
          };

          debugLog.log('✅ Fully validated tokenWithBalance', tokenWithBalance);
          setValidatedAsset?.(tokenWithBalance as unknown as T);

          if (containerType === CONTAINER_TYPE.SELL_SELECT_CONTAINER) {
            setSellTokenContract(tokenWithBalance);
          } else if (containerType === CONTAINER_TYPE.BUY_SELECT_CONTAINER) {
            setBuyTokenContract(tokenWithBalance);
          }

          debugSetInputState('PASS → VALID_INPUT', InputState.VALID_INPUT, inputState, setInputState);
          setValidationPending(false);
          return;
      }
    };

    runValidationFSM();
  }, [
    inputState,
  ]);

  const reportMissingLogoURL = useCallback(() => {
    if (!debouncedHexInput) return;
    if (!seenBrokenLogosRef.current.has(debouncedHexInput)) {
      seenBrokenLogosRef.current.add(debouncedHexInput);
      console.warn(`🛑 Missing logoURL for ${debouncedHexInput}`);
      alert('Missing logo — contract not found locally');
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
