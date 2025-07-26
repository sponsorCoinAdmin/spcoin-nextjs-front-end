// File: lib/hooks/inputValidations/tests/validateExistsLocally.ts

import { isAddress } from 'viem';
import { InputState } from '@/lib/structure';
import { isEmptyInput } from '../../validations/isEmptyInput';
import { ValidateFSMInput, ValidateFSMOutput } from '../types/validateFSMTypes';

export function validateExistsLocally({ debouncedHexInput }: ValidateFSMInput): ValidateFSMOutput {
alert(`ToDo: validateExistsLocally(${debouncedHexInput})`);
  return { nextState: InputState.PREVIEW_CONTRACT_NOT_FOUND_LOCALLY };
}

