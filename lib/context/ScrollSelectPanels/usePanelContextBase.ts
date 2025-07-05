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
import { useDebouncedAddressInput } from '@/lib/hooks/useDebouncedAddressInput';

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

  const {
    inputValue,
    debouncedAddress,
    validateHexInput,
  } = useDebouncedAddressInput();

  const instanceId = `${Date.now().toString(36)}-${Math.floor(Math.random() * 10000)}`;

  const getInputStatusEmoji = (state: InputState): string => {
    switch (state) {
      case InputState.INVALID_ADDRESS_INPUT:
        return '❓';
      case InputState.DUPLICATE_INPUT:
      case InputState.CONTRACT_NOT_FOUND_ON_BLOCKCHAIN:
        return '❌';
      case InputState.CONTRACT_NOT_FOUND_LOCALLY:
        return '⚠️';
      case InputState.VALID_INPUT:
        return '✅';
      case InputState.IS_LOADING:
        return '⏳';
      default:
        return '🔍';
    }
  };

  const contextValue = useMemo(() => ({
    inputState,
    setInputState: (state: InputState) => {
      debugLog.log(`📝 setInputState → ${getInputStateString(state)} (instanceId=${instanceId})`);
      setInputState(state);
    },
    validatedAsset,
    setValidatedAsset,
    inputValue,
    debouncedAddress,
    validateHexInput,
    getInputStatusEmoji,
    feedType,
    containerType,
    instanceId,
  }), [
    inputState,
    validatedAsset,
    inputValue,
    debouncedAddress,
    validateHexInput,
    feedType,
    containerType,
    instanceId,
  ]);

  return contextValue;
}
