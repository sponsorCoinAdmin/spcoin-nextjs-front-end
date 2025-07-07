// File: lib/hooks/inputValidations/helpers/getInputStatusEmoji.ts

import { InputState } from '@/lib/structure';

export function getInputStatusEmoji(state: InputState): string {
  switch (state) {
    case InputState.EMPTY_INPUT:
      return '';
    case InputState.INVALID_ADDRESS_INPUT:
      return '❓';
    case InputState.CONTRACT_NOT_FOUND_ON_BLOCKCHAIN:
      return '❌';
    case InputState.CONTRACT_NOT_FOUND_LOCALLY:
      return '⚠️';
    case InputState.DUPLICATE_INPUT:
      return '♻️';
    case InputState.VALID_INPUT:
      return '✅';
    default:
      return '🔍';
  }
}
