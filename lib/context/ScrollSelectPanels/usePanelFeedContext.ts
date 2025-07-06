// File: lib/context/ScrollSelectPanels/usePanelFeedContext.ts
// Author: Robin
// Date: 2023-07-07
// Description: Unified hook to access SharedPanelContext safely

'use client';

import { useSharedPanelContext } from './SharedPanelContext';
import { InputState, FEED_TYPE, CONTAINER_TYPE } from '@/lib/structure';
import { ValidatedAsset } from '@/lib/hooks/inputValidations/types/validationTypes';

export interface UsePanelFeedContextResult {
  inputState: InputState;
  setInputState: (state: InputState) => void;
  validatedAsset?: ValidatedAsset;
  setValidatedAsset?: (asset: ValidatedAsset) => void;
  // inputValue: string;
  // debouncedAddress: string;
  // validateHexInput: (val: string) => void;
  feedType: FEED_TYPE;
  containerType: CONTAINER_TYPE;
  // instanceId: string;
}

export function usePanelFeedContext(): UsePanelFeedContextResult {
  const ctx = useSharedPanelContext();
  return {
    inputState: ctx.inputState,
    setInputState: ctx.setInputState,
    validatedAsset: ctx.validatedAsset,
    setValidatedAsset: ctx.setValidatedAsset,
    // inputValue: ctx.inputValue,
    // debouncedAddress: ctx.debouncedAddress,
    // validateHexInput: ctx.validateHexInput,
    feedType: ctx.feedType,
    containerType: ctx.containerType,
    // instanceId: ctx.instanceId,
  };
}
