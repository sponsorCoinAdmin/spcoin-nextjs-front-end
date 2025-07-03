import { useState } from 'react';
import { useDebouncedAddressInput } from '@/lib/hooks/useDebouncedAddressInput';
import { InputState, FEED_TYPE, CONTAINER_TYPE } from '@/lib/structure';

export interface BaseSelectSharedState {
  inputValue: string;
  debouncedAddress: string;
  onChange: (val: string) => void;
  clearInput: () => void;
  manualEntryRef: React.MutableRefObject<boolean>;
  validateHexInput: (val: string) => void;
  inputState: InputState;
  setInputState: React.Dispatch<React.SetStateAction<InputState>>;
  getInputStatusEmoji: (state: InputState) => string;
  validateInputStatusMessage: (
    state: InputState,
    duplicateMessage?: string
  ) => { emoji?: string; text: string; useLogo?: boolean } | undefined;
  feedType: FEED_TYPE;
}

// ✅ Correct CONTAINER_TYPE → FEED_TYPE mapping
function getFeedTypeFromContainer(containerType: CONTAINER_TYPE): FEED_TYPE {
  switch (containerType) {
    case CONTAINER_TYPE.BUY_SELECT_CONTAINER:
    case CONTAINER_TYPE.SELL_SELECT_CONTAINER:
      return FEED_TYPE.TOKEN_LIST;
    case CONTAINER_TYPE.RECIPIENT_SELECT_CONTAINER:
      return FEED_TYPE.RECIPIENT_ACCOUNTS;
    default:
      return FEED_TYPE.TOKEN_LIST;
  }
}

// ✅ Hook now expects CONTAINER_TYPE
export function useBaseSelectShared(containerType: CONTAINER_TYPE): BaseSelectSharedState {
  const feedType = getFeedTypeFromContainer(containerType);

  const {
    inputValue,
    debouncedAddress,
    onChange,
    clearInput,
    manualEntryRef,
    validateHexInput,
  } = useDebouncedAddressInput();

  const [inputState, setInputState] = useState<InputState>(InputState.EMPTY_INPUT);

  const getInputStatusEmoji = (state: InputState) => {
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
    onChange,
    clearInput,
    manualEntryRef,
    validateHexInput,
    inputState,
    setInputState,
    getInputStatusEmoji,
    validateInputStatusMessage,
    feedType,
  };
}
