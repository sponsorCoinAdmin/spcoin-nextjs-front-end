'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useIsAddressInput, useIsDuplicateToken, useValidateTokenAddress } from '@/lib/hooks/UseAddressSelectHooks';
import { useChainId } from 'wagmi';
import { useBuyTokenAddress, useSellTokenAddress, useContainerType } from '@/lib/context/contextHooks';
import { InputState, TokenContract } from '@/lib/structure/types';
import { useDebounce } from '@/lib/hooks/useDebounce';

export const useInputValidationState = (selectAddress: string) => {
  const debouncedAddress = useDebounce(selectAddress, 250);
  const [inputState, setInputState] = useState<InputState>(InputState.EMPTY_INPUT);
  const [validatedToken, setValidatedToken] = useState<TokenContract | undefined>(undefined);

  const buyAddress = useBuyTokenAddress();
  const sellAddress = useSellTokenAddress();
  const chainId = useChainId();
  const [containerType] = useContainerType();

  const isAddressValid = useIsAddressInput(debouncedAddress);
  const [resolvedToken, isLoading] = useValidateTokenAddress(debouncedAddress, () => {});
  const isDuplicateToken = useIsDuplicateToken(debouncedAddress);

  const seenBrokenImagesRef = useRef<Set<string>>(new Set());
  const previousAddressRef = useRef<string>('');

  // Reset inputState if address changed after local image failure
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
    if (debouncedAddress === '' || !isAddressValid || isLoading) {
      if (debouncedAddress === '' && inputState !== InputState.EMPTY_INPUT) {
        setInputState(InputState.EMPTY_INPUT);
      } else if (debouncedAddress !== '' && inputState !== InputState.INVALID_ADDRESS_INPUT) {
        setInputState(InputState.INVALID_ADDRESS_INPUT);
      }
      setValidatedToken(undefined);
      return;
    }

    if (isDuplicateToken) {
      if (inputState !== InputState.DUPLICATE_INPUT) {
        setInputState(InputState.DUPLICATE_INPUT);
      }
      setValidatedToken(undefined);
      return;
    }

    if (!resolvedToken) {
      if (inputState !== InputState.CONTRACT_NOT_FOUND_ON_BLOCKCHAIN) {
        setInputState(InputState.CONTRACT_NOT_FOUND_ON_BLOCKCHAIN);
      }
      setValidatedToken(undefined);
      return;
    }

    if (inputState !== InputState.VALID_INPUT_PENDING || validatedToken?.address !== resolvedToken.address) {
      setValidatedToken(resolvedToken);
      setInputState(InputState.VALID_INPUT_PENDING);
    }
  }, [
    debouncedAddress,
    isAddressValid,
    isLoading,
    resolvedToken,
    isDuplicateToken,
    inputState,
    validatedToken?.address,
  ]);

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
