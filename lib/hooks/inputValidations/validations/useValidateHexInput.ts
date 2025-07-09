import { useSharedPanelContext } from "@/lib/context/ScrollSelectPanels";
import { InputState } from "@/lib/structure";
import { useCallback, useEffect } from "react";

export function useValidateHexInput() {
  const {
    validHexInput,
    debouncedHexInput,
    isValidHexInput,
    setValidHexInput,
    setFailedHexInput,
    setInputState,
  } = useSharedPanelContext();

  const handleHexInputChange = useCallback(
    (raw: string, _isManual?: boolean) => {
      const ok = isValidHexInput(raw);
      setValidHexInput(raw);
      if (!ok) setFailedHexInput(raw);
    },
    [isValidHexInput, setValidHexInput, setFailedHexInput]
  );

  useEffect(() => {
    setInputState(InputState.VALIDATE_ADDRESS);
  }, [debouncedHexInput, setInputState]);

  return { validHexInput, debouncedHexInput, handleHexInputChange };
}
