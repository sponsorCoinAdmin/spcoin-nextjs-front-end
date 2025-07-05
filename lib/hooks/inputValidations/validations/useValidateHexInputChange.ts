// File: lib/hooks/inputValidations/useValidateHexInputChange.ts

'use client';

import { useCallback, useRef } from 'react';

export function useValidateHexInputChange(validateHexInput: (value: string) => void) {
  const onChange = useCallback((val: string, _isManual?: boolean) => {
    validateHexInput(val);
  }, [validateHexInput]);

  return {
    onChange,
  };
}
