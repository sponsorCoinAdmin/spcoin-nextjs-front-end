// File: lib/hooks/inputValidations/useBaseSelectShared.ts

'use client';

import { useSharedPanelContext } from '@/lib/context/ScrollSelectPanels/SharedPanelContext';
import {
  InputState,
  FEED_TYPE,
  CONTAINER_TYPE,
} from '@/lib/structure';
import { getInputStateEmoji } from './inputValidations/helpers/getInputStateEmoji';

export interface BaseSelectSharedState {
  inputValue: string;
  debouncedAddress: string;
  validateHexInput: (val: string) => void;
  inputState: InputState;
  setInputState: (state: InputState) => void;
  getInputStateEmoji: (state: InputState) => string;
  validateInputStatusMessage: (
    state: InputState,
    duplicateMessage?: string
  ) => { emoji?: string; text: string; useLogo?: boolean } | undefined;
  feedType: FEED_TYPE;
  containerType: CONTAINER_TYPE;
}

// ⚠️ Placeholder implementation — you must supply actual values via context or props
export function useBaseSelectShared(): BaseSelectSharedState {
  const { feedType, containerType } = useSharedPanelContext();

  // These must now be supplied via context, wrapper hook, or parent
  const inputValue = '';
  const debouncedAddress = '';
  const inputState = InputState.EMPTY_INPUT;
  const setInputState = () => {};
  const validateHexInput = () => {};

  const validateInputStatusMessage = (
    state: InputState,
    duplicateMessage = 'Duplicate token'
  ) => {
    const emojiMap: Partial<Record<InputState, { emoji?: string; text: string; useLogo?: boolean }>> = {
      [InputState.INVALID_ADDRESS_INPUT]: { emoji: '❓', text: 'Valid address required.' },
      [InputState.DUPLICATE_INPUT]: { text: duplicateMessage, useLogo: true },
      [InputState.CONTRACT_NOT_FOUND_LOCALLY]: { emoji: '⚠️', text: 'Missing local metadata.' },
      [InputState.CONTRACT_NOT_FOUND_ON_BLOCKCHAIN]: { emoji: '❌', text: 'Not found on blockchain.' },
    };
    return emojiMap[state];
  };

  return {
    inputValue,
    debouncedAddress,
    validateHexInput,
    inputState,
    setInputState,
    getInputStateEmoji,
    validateInputStatusMessage,
    feedType,
    containerType,
  };
}
