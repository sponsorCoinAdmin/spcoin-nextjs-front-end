// File: lib/hooks/inputValidations/tests/previewAsset.ts

import { InputState } from '@/lib/structure/assetSelection';
import { ValidateFSMInput, ValidateFSMOutput } from '../types/validateFSMTypes';
import { createDebugLogger } from '@/lib/utils/debugLogger';

const LOG_TIME:boolean = false;
const DEBUG_ENABLED = process.env.NEXT_PUBLIC_DEBUG_LOG_FSM_CORE === 'true';
const debugLog = createDebugLogger('previewAsset', DEBUG_ENABLED, LOG_TIME);

export function previewAsset({ debouncedHexInput, seenBrokenLogos }: ValidateFSMInput): ValidateFSMOutput {
  debugLog.log(`Running previewAsset(${debouncedHexInput})`)
  if (seenBrokenLogos?.has(debouncedHexInput)) {
    return { nextState: InputState.PREVIEW_CONTRACT_NOT_FOUND_LOCALLY };
  }
  return { nextState: InputState.PREVIEW_CONTRACT_EXISTS_LOCALLY };
}

