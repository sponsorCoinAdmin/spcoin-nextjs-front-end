// File: lib/hooks/inputValidations/tests/validateAddress.ts

import { isAddress } from 'viem';
import { InputState } from '@/lib/structure';
import { isEmptyInput } from '../../validations/isEmptyInput';
import { ValidateFSMInput, ValidateFSMOutput } from '../types/validateFSMTypes';

export function validateAddress({ debouncedHexInput }: ValidateFSMInput): ValidateFSMOutput {
alert(`Running validateAddress(${debouncedHexInput})`);
  if (isEmptyInput(debouncedHexInput)) {
    return { nextState: InputState.EMPTY_INPUT };
  } else if (!isAddress(debouncedHexInput)) {
    return { nextState: InputState.INCOMPLETE_ADDRESS };
  }
  return { nextState: InputState.TEST_DUPLICATE_INPUT };
}

