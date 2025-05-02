'use client';

import { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { useChainId } from 'wagmi';
import { isAddress } from 'viem';
import {
  InputState,
  TokenContract,
  CONTAINER_TYPE,
  getInputStateString,
} from '@/lib/structure/types';
import {
  useSellTokenContract,
  useBuyTokenContract,
  useContainerType,
  useBuyTokenAddress,
  useSellTokenAddress,
} from '@/lib/context/contextHooks';
import { useDebounce } from '@/lib/hooks/useDebounce';
import { useMappedTokenContract } from './wagmiERC20hooks';

function useIsAddressInput(input?: string): boolean {
  return useMemo(() => !!input && isAddress(input), [input]);
}

function useIsEmptyInput(input?: string): boolean {
  return useMemo(() => input == null || input.trim() === '', [input]);
}

function useIsDuplicateToken(tokenAddress?: string): boolean {
  const [sellTokenContract] = useSellTokenContract();
  const [buyTokenContract] = useBuyTokenContract();
  const [containerType] = useContainerType();

  if (!tokenAddress || !isAddress(tokenAddress)) return false;

  const oppositeTokenAddress =
    containerType === CONTAINER_TYPE.SELL_SELECT_CONTAINER
      ? buyTokenContract?.address
      : sellTokenContract?.address;

  return tokenAddress === oppositeTokenAddress;
}

function useResolvedTokenContractInfo(
  tokenAddress?: string
): [TokenContract | undefined, boolean, string, boolean] {
  const chainId = useChainId();
  const validAddress = useMemo(
    () => (isAddress(tokenAddress ?? '') ? (tokenAddress as `0x${string}`) : undefined),
    [tokenAddress]
  );

  const tokenContract = useMappedTokenContract(validAddress);
  const isResolved = !!tokenContract && tokenContract !== null;
  const isLoading = !!validAddress && tokenContract === undefined;

  const message = useMemo(() => {
    return isResolved
      ? `TokenContract ${tokenContract!.name} found on blockchain ${chainId}`
      : `TokenContract at address ${tokenAddress} NOT found on blockchain ${chainId}`;
  }, [isResolved, tokenContract?.name, tokenAddress, chainId]);

  return [tokenContract ?? undefined, isResolved, message, isLoading];
}

export const useInputValidationState = (selectAddress: string) => {
  const debouncedAddress = useDebounce(selectAddress, 250);
  const [inputState, setInputState] = useState<InputState>(InputState.EMPTY_INPUT);
  const [validatedToken, setValidatedToken] = useState<TokenContract | undefined>(undefined);

  const buyAddress = useBuyTokenAddress();
  const sellAddress = useSellTokenAddress();
  const chainId = useChainId();
  const [containerType] = useContainerType();

  const isAddressValid = useIsAddressInput(debouncedAddress);
  const isEmptyInput = useIsEmptyInput(debouncedAddress);
  const isDuplicate = useIsDuplicateToken(debouncedAddress);
  const [resolvedToken, isResolved, _, isLoading] = useResolvedTokenContractInfo(debouncedAddress);

  const seenBrokenImagesRef = useRef<Set<string>>(new Set());
  const previousAddressRef = useRef<string>('');

  useEffect(() => {
    if (
      inputState === InputState.CONTRACT_NOT_FOUND_LOCALLY &&
      debouncedAddress !== previousAddressRef.current &&
      !seenBrokenImagesRef.current.has(debouncedAddress)
    ) {
      debugSetInputState(InputState.EMPTY_INPUT);
    }
    previousAddressRef.current = debouncedAddress;
  }, [debouncedAddress, inputState]);

  const debugSetInputState = (state: InputState) => {
    console.log(`➡️ SETTING STATE → ${getInputStateString(state)}`);
    setInputState(state);
  };

  useEffect(() => {
    if (isEmptyInput) {
      setValidatedToken(undefined);
      debugSetInputState(InputState.EMPTY_INPUT);
      return;
    }
    else 
      console.log(`🟢 TESTING PASSED: InputState.EMPTY_INPUT(${debouncedAddress})`);

    if (!isAddressValid) {
      setValidatedToken(undefined);
      debugSetInputState(InputState.INVALID_ADDRESS_INPUT);
      return;
    }
    console.log(`🟢🟢 TESTING PASSED: InputState.INVALID_ADDRESS_INPUT(${debouncedAddress})`);

    if (isDuplicate) {
      setValidatedToken(undefined);
      debugSetInputState(InputState.DUPLICATE_INPUT);
      return;
    }
    console.log(`🟢🟢🟢 TESTING PASSED: InputState.DUPLICATE_INPUT(${debouncedAddress})`);

    if (isLoading) {
      setValidatedToken(undefined);
      return;
    }
    if (!isResolved || !resolvedToken) {
      if (seenBrokenImagesRef.current.has(debouncedAddress)) {
        setValidatedToken(undefined);
        debugSetInputState(InputState.CONTRACT_NOT_FOUND_LOCALLY);
      } else {
        console.log(`🟢🟢🟢🟢 TESTING PASSED: InputState.CONTRACT_NOT_FOUND_LOCALLY(${debouncedAddress})`);
        setValidatedToken(undefined);
        debugSetInputState(InputState.CONTRACT_NOT_FOUND_ON_BLOCKCHAIN);
      }
      return;
    }
    console.log(`🟢🟢🟢🟢🟢 TESTING PASSED: InputState.CONTRACT_NOT_FOUND_ON_BLOCKCHAIN(${debouncedAddress})`);

    if (inputState !== InputState.VALID_INPUT_PENDING || validatedToken?.address !== resolvedToken.address) {
      setValidatedToken(resolvedToken);
      debugSetInputState(InputState.VALID_INPUT_PENDING);
    }
    else
      console.log(`🟢🟢🟢🟢🟢🟢 TESTING PASSED: InputState.VALID_INPUT_PENDING(${debouncedAddress})`);

  }, [debouncedAddress, isEmptyInput, isAddressValid, isDuplicate, isLoading, isResolved, resolvedToken]);

  const reportMissingAvatar = useCallback(() => {
    if (!seenBrokenImagesRef.current.has(debouncedAddress)) {
      seenBrokenImagesRef.current.add(debouncedAddress);
      debugSetInputState(InputState.CONTRACT_NOT_FOUND_LOCALLY);
    }
    else
      console.log(`🟢🟢🟢🟢🟢🟢🟢 TESTING PASSED: InputState.CONTRACT_NOT_FOUND_LOCALLY(${debouncedAddress})`);
  }, [debouncedAddress]);

  return {
    inputState,
    validatedToken,
    isLoading,
    chainId,
    reportMissingAvatar,
  };
};
