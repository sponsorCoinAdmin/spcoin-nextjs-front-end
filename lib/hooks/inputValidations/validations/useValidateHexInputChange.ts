import { MutableRefObject, useCallback } from 'react';

export function useValidateHexInputChange(
  validateHexInput: (value: string) => void,
  manualEntryRef: MutableRefObject<boolean>
) {
  const onChange = useCallback((val: string, isManual: boolean = false) => {
    manualEntryRef.current = isManual;
    validateHexInput(val);
  }, [validateHexInput, manualEntryRef]);

  return {
    onChange,
    manualEntryRef,
  };
}
