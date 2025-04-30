'use client';

import { useEffect, useState } from 'react';
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

  useEffect(() => {
    // Reset CONTRACT_NOT_FOUND_LOCALLY when a new input starts validation
    if (inputState === InputState.CONTRACT_NOT_FOUND_LOCALLY) {
      setInputState(InputState.EMPTY_INPUT);
    }

    if (debouncedAddress === '' || !isAddressValid || isLoading) {
      const nextState = debouncedAddress === ''
        ? InputState.EMPTY_INPUT
        : InputState.INVALID_ADDRESS_INPUT;

      if (inputState !== nextState) setInputState(nextState);
      if (validatedToken !== undefined) setValidatedToken(undefined);
      return;
    }

    if (isDuplicateToken) {
      if (inputState !== InputState.DUPLICATE_INPUT) setInputState(InputState.DUPLICATE_INPUT);
      if (validatedToken !== undefined) setValidatedToken(undefined);
      return;
    }

    if (!resolvedToken) {
      if (inputState !== InputState.CONTRACT_NOT_FOUND_ON_BLOCKCHAIN) {
        setInputState(InputState.CONTRACT_NOT_FOUND_ON_BLOCKCHAIN);
      }
      if (validatedToken !== undefined) setValidatedToken(undefined);
      return;
    }

    if (
      inputState !== InputState.VALID_INPUT_PENDING ||
      validatedToken?.address !== resolvedToken.address
    ) {
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
    validatedToken?.address
  ]);

  return {
    inputState,
    validatedToken,
    isLoading,
    chainId,
  };
};
