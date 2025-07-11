import { useSharedPanelContext } from '@/lib/context/ScrollSelectPanels';
import { InputState } from '@/lib/structure';
import { useCallback, useEffect } from 'react';

export function useValidateHexInput() {
  const {
    debouncedHexInput,
    failedHexInput,
    isValidHexInput,
    resetHexInput,
    validHexInput,
    setInputState,
  } = useSharedPanelContext();

  const handleHexInputChange = useCallback(
    (raw: string, _isManual?: boolean) => {
      const ok = isValidHexInput(raw);
      // Optionally handle `ok` result here if needed
    },
    [isValidHexInput]
  );

  useEffect(() => {
    setInputState(InputState.VALIDATE_ADDRESS);
  }, [validHexInput, setInputState]);

  return {
    debouncedHexInput,
    failedHexInput,
    handleHexInputChange,
    isValidHexInput,
    resetHexInput,
    validHexInput,
  };
}
