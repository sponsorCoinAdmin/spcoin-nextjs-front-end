// File: lib/hooks/inputValidations/useBaseSelectShared.ts

'use client';

import { useSharedPanelContext } from '@/lib/context/ScrollSelectPanels/SharedPanelContext';
import {
  InputState,
  FEED_TYPE,
  CONTAINER_TYPE,
} from '@/lib/structure';
import { useValidateHexInput } from './inputValidations';
import { useValidateFSMInput } from './inputValidations/validations/useValidateFSMInput';
import { getInputStatusEmoji } from './inputValidations/helpers/getInputStatusEmoji';

export interface BaseSelectSharedState {
  inputValue: string;
  debouncedAddress: string;
  validateHexInput: (val: string) => void;
  inputState: InputState;
  setInputState: (state: InputState) => void;
  getInputStatusEmoji: (state: InputState) => string;
  validateInputStatusMessage: (
    state: InputState,
    duplicateMessage?: string
  ) => { emoji?: string; text: string; useLogo?: boolean } | undefined;
  feedType: FEED_TYPE;
  containerType: CONTAINER_TYPE;
}

export function useBaseSelectShared(): BaseSelectSharedState {
  const { feedType, containerType } = useSharedPanelContext();

  // Get values from correct sources
  const {
    inputValue,
    debouncedAddress,
    handleHexInputChange,
  } = useValidateHexInput(feedType);

  const {
    inputState,
    setInputState,
  } = useValidateFSMInput(debouncedAddress, feedType, containerType);

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
    validateHexInput: handleHexInputChange, // rename for clarity
    inputState,
    setInputState,
    getInputStatusEmoji,
    validateInputStatusMessage,
    feedType,
    containerType,
  };
}
