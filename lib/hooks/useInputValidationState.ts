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
      setInputState(InputState.EMPTY_INPUT);
    }
    previousAddressRef.current = debouncedAddress;
  }, [debouncedAddress, inputState]);

  useEffect(() => {
    if (isEmptyInput) {
      setValidatedToken(undefined);
      setInputState(InputState.EMPTY_INPUT);
      return;
    }
    if (!isAddressValid) {
      setValidatedToken(undefined);
      setInputState(InputState.INVALID_ADDRESS_INPUT);
      return;
    }
    if (isDuplicate) {
      setValidatedToken(undefined);
      setInputState(InputState.DUPLICATE_INPUT);
      return;
    }
    if (isLoading) {
      setValidatedToken(undefined);
      return;
    }
    if (!isResolved || !resolvedToken) {
      if (seenBrokenImagesRef.current.has(debouncedAddress)) {
        setValidatedToken(undefined);
        setInputState(InputState.CONTRACT_NOT_FOUND_LOCALLY);
      } else {
        setValidatedToken(undefined);
        setInputState(InputState.CONTRACT_NOT_FOUND_ON_BLOCKCHAIN);
      }
      return;
    }

    if (inputState !== InputState.VALID_INPUT_PENDING || validatedToken?.address !== resolvedToken.address) {
      setValidatedToken(resolvedToken);
      setInputState(InputState.VALID_INPUT_PENDING);
    }
  }, [debouncedAddress, isEmptyInput, isAddressValid, isDuplicate, isLoading, isResolved, resolvedToken]);

  const reportMissingAvatar = useCallback(() => {
    if (!seenBrokenImagesRef.current.has(debouncedAddress)) {
      seenBrokenImagesRef.current.add(debouncedAddress);
      setInputState(InputState.CONTRACT_NOT_FOUND_LOCALLY);
    }
  }, [debouncedAddress]);

  return {
    inputState,
    validatedToken,
    isLoading,
    chainId,
    reportMissingAvatar,
  };
};
