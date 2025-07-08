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

  const [validatedAsset, setValidatedAssetRaw] = useState<ValidatedAsset | undefined>();
  const [inputState, setInputStateRaw] = useState<InputState>(InputState.EMPTY_INPUT);

  const setInputState = (next: InputState) => {
    if (next === inputState) {
      debugLog.log(`🚫 Skipping setInputState — already in ${getInputStateString(next)}`);
      return;
    }
    debugLog.log(`📝 setInputState → ${getInputStateString(next)}`);
    setInputStateRaw(next);
  };

  const setValidatedAsset = (next: ValidatedAsset | undefined) => {
    if (
      validatedAsset &&
      next &&
      validatedAsset.address === next.address
    ) {
      debugLog.log(`🚫 Skipping setValidatedAsset — already set to ${next.symbol || next.address}`);
      return;
    }

    if (!next) {
      debugLog.log(`🧹 Clearing validated asset`);
    } else {
      debugLog.log(`✅ setValidatedAsset → ${next.symbol || next.address}`);
    }

    setValidatedAssetRaw(next);
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
