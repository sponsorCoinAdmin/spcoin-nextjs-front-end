'use client';

import { useState, useMemo } from 'react';
import {
  InputState,
  getInputStateString,
  FEED_TYPE,
  CONTAINER_TYPE,
} from '@/lib/structure';

import { createDebugLogger } from '@/lib/utils/debugLogger';
import { ValidatedAsset } from '@/lib/hooks/inputValidations/types/validationTypes';

export function usePanelContextBase(
  feedType: FEED_TYPE,
  containerType: CONTAINER_TYPE,
  label: string,
  debugEnabled: boolean = false
) {
  const debugLog = createDebugLogger(label, debugEnabled, false);

  const [validatedAsset, setValidatedAsset] = useState<ValidatedAsset>();
  const [inputState, setInputStateRaw] = useState<InputState>(InputState.EMPTY_INPUT);

  const setInputState = (state: InputState) => {
    debugLog.log(`📝 setInputState → ${getInputStateString(state)}`);
    setInputStateRaw(state);
  };

  const contextValue = useMemo(() => ({
    inputState,
    setInputState,
    validatedAsset,
    setValidatedAsset,
    feedType,
    containerType,
  }), [inputState, validatedAsset, feedType, containerType]);

  return contextValue;
}
