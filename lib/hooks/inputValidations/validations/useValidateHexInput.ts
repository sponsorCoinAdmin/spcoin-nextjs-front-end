import { useSharedPanelContext } from "@/lib/context/ScrollSelectPanels";
import { InputState } from "@/lib/structure";
import { useCallback, useEffect } from "react";

export function useValidateHexInput() {
  const {
    validHexInput,
    debouncedHexInput,
    isValidHexInput,
    setInputState,
  } = useSharedPanelContext();

  const handleHexInputChange = useCallback(
    (raw: string, _isManual?: boolean) => {
      const ok = isValidHexInput(raw);
    },
    [isValidHexInput]
  );

  useEffect(() => {
    setInputState(InputState.VALIDATE_ADDRESS);
  }, [debouncedHexInput, setInputState]);

  return { validHexInput, debouncedHexInput, handleHexInputChange };
}
