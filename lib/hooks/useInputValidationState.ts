'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { isAddress } from 'viem';
import { InputState, TokenContract, CONTAINER_TYPE, getInputStateString } from '@/lib/structure/types';
import {
  useSellTokenContract,
  useBuyTokenContract,
  useBuyTokenAddress,
  useSellTokenAddress,
  useContainerType,
} from '@/lib/context/contextHooks';
import { useDebounce } from '@/lib/hooks/useDebounce';
import { useMappedTokenContract } from './wagmiERC20hooks';
import { useChainId } from 'wagmi';

function debugSetInputState(
  state: InputState,
  currentState: InputState,
  setState: (s: InputState) => void
): void {
  if (state === currentState) return;
  const prevState = getInputStateString(currentState);
  const currState = getInputStateString(state);
  const currStateImgs = '⚠️'.repeat(state);
  console.log(`${currStateImgs} STATE CHANGE: ${prevState}(${currentState}) -> ${currState}(${state})`);
  setState(state);
}

function isEmptyInput(input: string | undefined): boolean {
  return !input?.trim();
}

function isInvalidAddress(input: string): boolean {
  return !isAddress(input);
}

function isDuplicateInput(
  containerType: CONTAINER_TYPE,
  input: string,
  sellAddress?: string,
  buyAddress?: string
): boolean {
  if (!sellAddress || !buyAddress || containerType === CONTAINER_TYPE.UNDEFINED) return false;
  const opposite =
    containerType === CONTAINER_TYPE.SELL_SELECT_CONTAINER ? buyAddress : sellAddress;
  return input.toLowerCase() === opposite.toLowerCase();
}

export const useInputValidationState = (selectAddress: string | undefined) => {
  const debouncedAddress = useDebounce(selectAddress || '', 250);
  const [inputState, setInputState] = useState<InputState>(InputState.EMPTY_INPUT);
  const [validatedToken, setValidatedToken] = useState<TokenContract | undefined>(undefined);

  const [containerType] = useContainerType();
  const buyAddress = useBuyTokenAddress();
  const sellAddress = useSellTokenAddress();

  const seenBrokenImagesRef = useRef<Set<string>>(new Set());
  const previousAddressRef = useRef<string>('');
  const chainId = useChainId();

  useEffect(() => {
    if (
      inputState === InputState.CONTRACT_NOT_FOUND_LOCALLY &&
      debouncedAddress !== previousAddressRef.current &&
      !seenBrokenImagesRef.current.has(debouncedAddress)
    ) {
      debugSetInputState(InputState.EMPTY_INPUT, inputState, setInputState);
    }
    previousAddressRef.current = debouncedAddress;
  }, [debouncedAddress, inputState]);

  useEffect(() => {
    seenBrokenImagesRef.current.clear();
  }, [chainId]);

  const resolvedToken = useMappedTokenContract(
    isAddress(debouncedAddress) ? (debouncedAddress as `0x${string}`) : undefined
  );
  const isResolved = !!resolvedToken;
  const isLoading = isAddress(debouncedAddress) && resolvedToken === undefined;

  useEffect(() => {
    if (isEmptyInput(debouncedAddress)) {
      setValidatedToken(undefined);
      debugSetInputState(InputState.EMPTY_INPUT, inputState, setInputState);
      return;
    }

    if (isInvalidAddress(debouncedAddress)) {
      setValidatedToken(undefined);
      debugSetInputState(InputState.INVALID_ADDRESS_INPUT, inputState, setInputState);
      return;
    }

    if (isDuplicateInput(containerType, debouncedAddress, sellAddress, buyAddress)) {
      setValidatedToken(undefined);
      debugSetInputState(InputState.DUPLICATE_INPUT, inputState, setInputState);
      return;
    }

    if (isLoading) {
      setValidatedToken(undefined);
      return;
    }

    if (!isResolved || !resolvedToken) {
      if (seenBrokenImagesRef.current.has(debouncedAddress)) {
        setValidatedToken(undefined);
        debugSetInputState(InputState.CONTRACT_NOT_FOUND_LOCALLY, inputState, setInputState);
      } else {
        setValidatedToken(undefined);
        debugSetInputState(InputState.CONTRACT_NOT_FOUND_ON_BLOCKCHAIN, inputState, setInputState);
      }
      return;
    }

    if (
      inputState !== InputState.VALID_INPUT_PENDING ||
      validatedToken?.address !== resolvedToken.address
    ) {
      setValidatedToken(resolvedToken);
      debugSetInputState(InputState.VALID_INPUT_PENDING, inputState, setInputState);
    }
  }, [debouncedAddress, resolvedToken, isResolved, isLoading, sellAddress, buyAddress, containerType]);

  const reportMissingAvatar = useCallback(() => {
    if (!seenBrokenImagesRef.current.has(debouncedAddress)) {
      seenBrokenImagesRef.current.add(debouncedAddress);
      debugSetInputState(InputState.CONTRACT_NOT_FOUND_LOCALLY, inputState, setInputState);
    }
  }, [debouncedAddress, inputState]);

  return {
    inputState,
    validatedToken,
    isLoading,
    chainId,
    reportMissingAvatar,
  };
};
