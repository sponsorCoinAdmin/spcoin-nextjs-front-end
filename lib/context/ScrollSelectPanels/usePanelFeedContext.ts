// File: lib/context/ScrollSelectPanels/usePanelContextBase.ts

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

const LOG_TIME = false;

export function usePanelContextBase(
  feedType: FEED_TYPE,
  containerType: CONTAINER_TYPE,
  label: string,
  debugEnabled: boolean = false
) {
  const debugLog = createDebugLogger(label, debugEnabled, LOG_TIME);

  const [validatedAsset, setValidatedAsset] = useState<ValidatedAsset>();
  const [inputState, setInputState] = useState<InputState>(InputState.EMPTY_INPUT);

  const contextValue = useMemo(() => ({
    inputState,
    setInputState: (state: InputState) => {
      debugLog.log(`📝 setInputState → ${getInputStateString(state)}`);
      setInputState(state);
    },
    validatedAsset,
    setValidatedAsset,
    feedType,
    containerType,
  }), [inputState, validatedAsset, feedType, containerType]);

  return contextValue;
}
