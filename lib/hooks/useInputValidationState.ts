// File: lib/hooks/useInputValidationState.ts

'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { isAddress } from 'viem';
import { useChainId, useAccount, usePublicClient, useBalance } from 'wagmi';
import { getLogoURL } from '@/lib/network/utils';
import { useDebounce } from '@/lib/hooks/useDebounce';

import {
  useBuyTokenAddress,
  useSellTokenAddress,
  useBuyTokenContract,
  useSellTokenContract,
} from '@/lib/context/hooks';

import {
  CONTAINER_TYPE,
  FEED_TYPE,
  InputState,
  TokenContract,
  WalletAccount,
} from '@/lib/structure';

import { debugLog } from './inputValidations/helpers/debugLogInstance';
import { debugSetInputState } from './inputValidations/helpers/debugSetInputState';
import { isEmptyInput } from './inputValidations/validations/isEmptyInput';
import { isDuplicateInput } from './inputValidations/validations/isDuplicateInput';
import { resolveTokenContract } from './inputValidations/validations/resolveTokenContract';

export const useInputValidationState = <T extends TokenContract | WalletAccount>(
  selectAddress: string | undefined,
  feedType: FEED_TYPE = FEED_TYPE.TOKEN_LIST,
  containerType?: CONTAINER_TYPE
) => {
  const debouncedAddress = useDebounce(selectAddress || '', 250);
  const [inputState, setInputState] = useState<InputState>(InputState.VALIDATE_INPUT);
  const [validatedAsset, setValidatedAsset] = useState<T | undefined>(undefined);
  const [validationPending, setValidationPending] = useState(true);

  const buyAddress = useBuyTokenAddress();
  const sellAddress = useSellTokenAddress();

  const [, setSellTokenContract] = useSellTokenContract();
  const [, setBuyTokenContract] = useBuyTokenContract();

  const seenBrokenLogosRef = useRef<Set<string>>(new Set());
  const lastTokenAddressRef = useRef<string>('');

  const chainId = useChainId();
  const publicClient = usePublicClient();
  const { address: accountAddress } = useAccount();

  const { data: balanceData } = useBalance({
    address: isAddress(debouncedAddress) ? (debouncedAddress as `0x${string}`) : undefined,
    token: isAddress(debouncedAddress) ? (debouncedAddress as `0x${string}`) : undefined,
    chainId,
    query: { enabled: Boolean(accountAddress) },
  });

  // ✅ Finite State Machine — single useEffect
  useEffect(() => {
    const runValidationFSM = async () => {
      switch (inputState) {
        case InputState.VALIDATE_INPUT:
          setValidationPending(true);
          if (isEmptyInput(debouncedAddress)) {
            debugSetInputState(InputState.EMPTY_INPUT, inputState, setInputState);
          } else if (!/^0x[0-9a-fA-F]*$/.test(debouncedAddress)) {
            debugSetInputState(InputState.INVALID_HEX_INPUT, inputState, setInputState);
            alert('Hex Input Address Required');
          } else {
            debugSetInputState(InputState.VALIDATE_ADDRESS, inputState, setInputState);
          }
          break;

        case InputState.INVALID_HEX_INPUT:
          alert('Hex Input Address Required');
          setValidationPending(false);
          break;

        case InputState.EMPTY_INPUT:
        case InputState.INVALID_ADDRESS_INPUT:
        case InputState.DUPLICATE_INPUT:
        case InputState.CONTRACT_NOT_FOUND_ON_BLOCKCHAIN:
        case InputState.CONTRACT_NOT_FOUND_LOCALLY:
        case InputState.VALID_INPUT:
          setValidationPending(false);
          break;

        case InputState.VALIDATE_ADDRESS: {
          const isCompleteAddress = isAddress(debouncedAddress);
          if (!isCompleteAddress) {
            setValidationPending(false);
            debugSetInputState(InputState.INVALID_ADDRESS_INPUT, inputState, setInputState);
          } else {
            debugSetInputState(InputState.TEST_DUPLICATE_INPUT, inputState, setInputState);
          }
          break;
        }

        case InputState.TEST_DUPLICATE_INPUT:
          if (isDuplicateInput(containerType!, debouncedAddress, sellAddress, buyAddress)) {
            debugSetInputState(InputState.DUPLICATE_INPUT, inputState, setInputState);
          } else {
            debugSetInputState(InputState.VALIDATE_EXISTS_ON_CHAIN, inputState, setInputState);
          }
          break;

        case InputState.VALIDATE_EXISTS_ON_CHAIN:
          if (!publicClient) {
            debugLog.warn('❌ publicClient is undefined – skipping resolution');
            setValidationPending(false);
            return;
          }

          const resolved = await resolveTokenContract(
            debouncedAddress,
            chainId,
            feedType,
            publicClient,
            accountAddress
          );

          if (!resolved) {
            debugSetInputState(InputState.CONTRACT_NOT_FOUND_ON_BLOCKCHAIN, inputState, setInputState);
            return;
          }

          debugLog.log(`🎯 Resolved token contract`, resolved);
          setValidatedAsset(resolved as unknown as T);

          if (containerType === CONTAINER_TYPE.SELL_SELECT_CONTAINER) {
            setSellTokenContract(resolved);
          } else if (containerType === CONTAINER_TYPE.BUY_SELECT_CONTAINER) {
            setBuyTokenContract(resolved);
          }

          debugSetInputState(InputState.VALIDATE_CONTRACT_EXISTS_LOCALLY, inputState, setInputState);
          break;

        case InputState.VALIDATE_CONTRACT_EXISTS_LOCALLY:
          if (seenBrokenLogosRef.current.has(debouncedAddress)) {
            debugSetInputState(InputState.CONTRACT_NOT_FOUND_LOCALLY, inputState, setInputState);
          } else {
            debugSetInputState(InputState.VALIDATE_BALANCE, inputState, setInputState);
          }
          break;

        case InputState.VALIDATE_BALANCE:
          debugLog.log('⏳ Waiting for balance data...');
          if (!balanceData || !validatedAsset) return;

          if (lastTokenAddressRef.current === validatedAsset.address) return;

          lastTokenAddressRef.current = validatedAsset.address;

          const tokenWithBalance: TokenContract = {
            ...validatedAsset,
            balance: balanceData.value,
            chainId: chainId!,
            logoURL: getLogoURL(chainId!, validatedAsset.address, feedType),
          };

          debugLog.log(`✅ Fully validated tokenWithBalance`, tokenWithBalance);
          setValidatedAsset(tokenWithBalance as unknown as T);

          if (containerType === CONTAINER_TYPE.SELL_SELECT_CONTAINER) {
            setSellTokenContract(tokenWithBalance);
          } else if (containerType === CONTAINER_TYPE.BUY_SELECT_CONTAINER) {
            setBuyTokenContract(tokenWithBalance);
          }

          debugSetInputState(InputState.VALID_INPUT, inputState, setInputState);
          setValidationPending(false);
          break;
      }
    };

    runValidationFSM();
  }, [inputState, debouncedAddress, publicClient, balanceData, validatedAsset, chainId]);

  const reportMissingLogoURL = useCallback(() => {
    if (!debouncedAddress) return;
    if (!seenBrokenLogosRef.current.has(debouncedAddress)) {
      seenBrokenLogosRef.current.add(debouncedAddress);
      console.warn(`🛑 Missing logoURL image for ${debouncedAddress}`);
      debugSetInputState(InputState.CONTRACT_NOT_FOUND_LOCALLY, inputState, setInputState);
    }
  }, [debouncedAddress, inputState]);

  const hasBrokenLogoURL = useCallback(() => {
    return seenBrokenLogosRef.current.has(debouncedAddress);
  }, [debouncedAddress]);

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
