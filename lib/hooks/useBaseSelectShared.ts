// File: lib/hooks/useBaseSelectShared.ts

import { useDebouncedAddressInput } from '@/lib/hooks/useDebouncedAddressInput';
import { InputState } from '@/lib/structure';
import { useEffect, useState } from 'react';
import { isAddress } from 'viem';

export function useBaseSelectShared() {
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
      case InputState.VALID_INPUT_PENDING:
        return '⏳';
      default:
        return '🔍';
    }
  };

  const validateInputStatusMessage = (state: InputState, duplicateMessage = 'Duplicate token') => {
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
  };
}
