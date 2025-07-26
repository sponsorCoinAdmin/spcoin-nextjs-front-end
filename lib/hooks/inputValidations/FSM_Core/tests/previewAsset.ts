// File: lib/hooks/inputValidations/tests/previewAsset.ts

import { InputState } from '@/lib/structure';
import { ValidateFSMInput, ValidateFSMOutput } from '../types/validateFSMTypes';

export function previewAsset({ debouncedHexInput, seenBrokenLogos }: ValidateFSMInput): ValidateFSMOutput {
alert(`Running previewAsset(${debouncedHexInput})`)
  if (seenBrokenLogos.has(debouncedHexInput)) {
    return { nextState: InputState.PREVIEW_CONTRACT_NOT_FOUND_LOCALLY };
  }
  return { nextState: InputState.PREVIEW_CONTRACT_EXISTS_LOCALLY };
}

