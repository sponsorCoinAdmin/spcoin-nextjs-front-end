// File: lib/hooks/inputValidations/helpers/getInputStateEmoji.ts

import { InputState } from '@/lib/structure';

export function getInputStateEmoji(state: InputState): string {
  switch (state) {
    case InputState.EMPTY_INPUT:
      return '🈳';
    case InputState.INCOMPLETE_ADDRESS:
      return '❌';
    case InputState.INVALID_ADDRESS_INPUT:
      return '⛔';
    case InputState.VALIDATE_ADDRESS:
      return '📬';
    case InputState.TEST_DUPLICATE_INPUT:
      return '🧪';
    case InputState.DUPLICATE_INPUT_ERROR:
      return '♻️';
    case InputState.VALIDATE_EXISTS_ON_CHAIN:
      return '🔗';
    case InputState.CONTRACT_NOT_FOUND_ON_BLOCKCHAIN:
      return '🚫';
    case InputState.VALIDATE_CONTRACT_EXISTS_LOCALLY:
      return '💾';
    case InputState.CONTRACT_NOT_FOUND_LOCALLY:
      return '📭';
    case InputState.VALIDATE_BALANCE:
      return '💰';
    case InputState.VALID_INPUT:
      return '✅';
    case InputState.IS_LOADING:
      return '⏳';
    default:
      return '🔍';
  }
}
