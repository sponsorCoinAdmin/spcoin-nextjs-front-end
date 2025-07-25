// File: lib/hooks/inputValidations/FSM_Core/terminalStates.ts

import { InputState } from '@/lib/structure';

/**
 * A Set of all terminal FSM states — these indicate end-of-flow or unrecoverable states.
 * Used to prevent re-validation or recursive state transitions.
 */
const TERMINAL_FSM_STATES = new Set<InputState>([
  InputState.INVALID_HEX_INPUT,
  InputState.INCOMPLETE_ADDRESS,
  InputState.INVALID_ADDRESS_INPUT,
  InputState.DUPLICATE_INPUT_ERROR,
  InputState.CONTRACT_NOT_FOUND_ON_BLOCKCHAIN,
  InputState.PREVIEW_CONTRACT_NOT_FOUND_LOCALLY,
  InputState.VALIDATE_ASSET_ERROR,
  InputState.CLOSE_SELECT_PANEL,
]);

/**
 * Returns true if the given state is terminal (no further validation should occur).
 */
export function isTerminalFSMState(state: InputState): boolean {
  return TERMINAL_FSM_STATES.has(state);
}
