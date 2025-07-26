// File: lib/hooks/inputValidations/tests/validateDuplicate.ts

import { InputState } from '@/lib/structure';
import { isDuplicateInput } from '../../validations/isDuplicateInput';
import { ValidateFSMInput, ValidateFSMOutput } from '../types/validateFSMTypes';

export function validateDuplicate({
  containerType,
  debouncedHexInput,
  sellAddress,
  buyAddress,
}: ValidateFSMInput): ValidateFSMOutput {
alert(`Running validateDuplicate(${debouncedHexInput})`);
  if (isDuplicateInput(containerType, debouncedHexInput, sellAddress, buyAddress)) {
    return {
      nextState: InputState.DUPLICATE_INPUT_ERROR,
      errorMessage: 'Duplicate address detected',
    };
  }
  return { nextState: InputState.VALIDATE_PREVIEW };
}

