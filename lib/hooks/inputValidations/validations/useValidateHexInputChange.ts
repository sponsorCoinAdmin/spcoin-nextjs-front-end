// File: lib/hooks/inputValidations/useValidateHexInputChange.ts

'use client';

import { useCallback } from 'react';
import { useDebouncedAddressInput } from '@/lib/hooks';
import { useInputValidationState } from '@/lib/hooks/useInputValidationState';
import { FEED_TYPE } from '@/lib/structure';

export function useValidateHexInputChange(feedType: FEED_TYPE) {
  const {
    inputValue,
    debouncedAddress,
    validateHexInput,
  } = useDebouncedAddressInput();

  const {
    isLoading,
    reportMissingLogoURL,
    hasBrokenLogoURL,
  } = useInputValidationState(debouncedAddress, feedType);

  const onChange = useCallback(
    (val: string, _isManual?: boolean) => {
      validateHexInput(val);
    },
    [validateHexInput]
  );

  return {
    inputValue,
    debouncedAddress,
    onChange,
    isLoading,
    reportMissingLogoURL,
    hasBrokenLogoURL,
  };
}
