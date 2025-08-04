// File: lib/hooks/inputValidations/tests/validateExistsLocally.ts
import { JUNK_ALERTS } from '@/lib/utils/JUNK_ALERTS';

import { isAddress } from 'viem';
import { InputState } from '@/lib/structure';
import { isEmptyInput } from '../../validations/isEmptyInput';
import { ValidateFSMInput, ValidateFSMOutput } from '../types/validateFSMTypes';
import { createDebugLogger } from '@/lib/utils/debugLogger';

const LOG_TIME:boolean = false;
const DEBUG_ENABLED = process.env.NEXT_PUBLIC_DEBUG_LOG_FSM_CORE === 'true';
const debugLog = createDebugLogger('validateExistsLocally', DEBUG_ENABLED, LOG_TIME);

export function validateExistsLocally({ debouncedHexInput }: ValidateFSMInput): ValidateFSMOutput {
JUNK_ALERTS(`ToDo: validateExistsLocally(${debouncedHexInput})`);
  debugLog.log(`ToDo: validateExistsLocally(${debouncedHexInput})`);
  return { nextState: InputState.PREVIEW_CONTRACT_NOT_FOUND_LOCALLY };
}

