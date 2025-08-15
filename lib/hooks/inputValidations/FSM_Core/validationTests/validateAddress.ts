// File: lib/hooks/inputValidations/tests/validateAddress.ts

import { isAddress } from 'viem';
import { InputState } from '@/lib/structure/assetSelection';
import { isEmptyInput } from '../../validations/isEmptyInput';
import { ValidateFSMInput, ValidateFSMOutput } from '../types/validateFSMTypes';
import { createDebugLogger } from '@/lib/utils/debugLogger';

const LOG_TIME = false;
const DEBUG_ENABLED = process.env.NEXT_PUBLIC_DEBUG_LOG_FSM_CORE === 'true';
const debugLog = createDebugLogger('validateAddress', DEBUG_ENABLED, LOG_TIME);

/**
 * Merged precheck logic:
 * - We rely on `useHexInput` to tell us if the hex body is valid (`isValid`).
 * - This function maps the input + minimal shape checks to FSM states.
 */
export function validateAddress({
  debouncedHexInput,
  isValid, // <-- from useHexInput
}: ValidateFSMInput): ValidateFSMOutput {
  const raw = (debouncedHexInput ?? '').trim();

  debugLog.log(`Running validateAddress(${raw})`);

  // 1) Empty → EMPTY_INPUT
  if (isEmptyInput(raw)) {
    return { nextState: InputState.EMPTY_INPUT };
  }

  // 2) If hook says hex content is invalid → INVALID_HEX_INPUT
  if (!isValid) {
    return { nextState: InputState.INVALID_HEX_INPUT };
  }

  // 3) Minimal shape checks (no duplicate heavy parsing here)
  const has0x = /^0x/i.test(raw);

  // Shorter than 42 characters (e.g., while typing) → INCOMPLETE_ADDRESS
  if (raw.length < 42) {
    return { nextState: InputState.INCOMPLETE_ADDRESS };
  }

  // Wrong shape/length (e.g., missing 0x or not exactly 42 chars) → INVALID_ADDRESS_INPUT
  if (!has0x || raw.length !== 42) {
    return { nextState: InputState.INVALID_ADDRESS_INPUT };
  }

  // 4) Final strict check via viem
  if (!isAddress(raw)) {
    return { nextState: InputState.INVALID_ADDRESS_INPUT };
  }

  // 5) Good → continue FSM
  return { nextState: InputState.TEST_DUPLICATE_INPUT };
}
