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
    if (debouncedAddress === '' || !isAddressValid || isLoading) {
      setInputState(debouncedAddress === '' ? InputState.EMPTY_INPUT : InputState.INVALID_ADDRESS_INPUT);
      setValidatedToken(undefined);
      return;
    }

    if (isDuplicateToken) {
      setInputState(InputState.DUPLICATE_INPUT);
      setValidatedToken(undefined);
      return;
    }

    if (!resolvedToken) {
      setInputState(InputState.CONTRACT_NOT_FOUND_ON_BLOCKCHAIN);
      setValidatedToken(undefined);
      return;
    }

    setValidatedToken(resolvedToken);
    setInputState(InputState.VALID_INPUT_PENDING);

  }, [
    debouncedAddress,
    isAddressValid,
    isLoading,
    resolvedToken,
    buyAddress,
    sellAddress,
    containerType,
    isDuplicateToken,
    chainId
  ]);

  return {
    inputState,
    validatedToken,
    isLoading,
    chainId,
  };
};
