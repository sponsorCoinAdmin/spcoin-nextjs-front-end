// File: lib/hooks/inputValidation/FSM_Core/fSMInputStates.ts

import { InputState } from '@/lib/structure';

// ────────────── Terminal FSM States ──────────────
export const TERMINAL_FSM_STATES = new Set<InputState>([
  InputState.INVALID_HEX_INPUT,
  InputState.INCOMPLETE_ADDRESS,
  InputState.INVALID_ADDRESS_INPUT,
  InputState.DUPLICATE_INPUT_ERROR,
  InputState.CONTRACT_NOT_FOUND_ON_BLOCKCHAIN,
  InputState.PREVIEW_CONTRACT_NOT_FOUND_LOCALLY,
  InputState.RESOLVE_ASSET_ERROR,
  InputState.TOKEN_NOT_RESOLVED_ERROR, // optional if used in your state enum
  InputState.CLOSE_SELECT_PANEL,
]);

export function isTerminalFSMState(state: InputState): boolean {
  return TERMINAL_FSM_STATES.has(state);
}

// ────────────── FSM Error States ──────────────
export const ERROR_FSM_STATES = new Set<InputState>([
  InputState.INVALID_HEX_INPUT,
  InputState.INCOMPLETE_ADDRESS,
  InputState.INVALID_ADDRESS_INPUT,
  InputState.DUPLICATE_INPUT_ERROR,
  InputState.CONTRACT_NOT_FOUND_ON_BLOCKCHAIN,
  InputState.PREVIEW_CONTRACT_NOT_FOUND_LOCALLY,
  InputState.RESOLVE_ASSET_ERROR,
  InputState.UPDATE_VALIDATED_ASSET
]);

export function isErrorFSMState(state: InputState): boolean {
  return ERROR_FSM_STATES.has(state);
}

// ────────────── FSM Trigger States ──────────────
export const TRIGGER_FSM_STATES = new Set<InputState>([
  InputState.VALIDATE_ADDRESS,
  InputState.TEST_DUPLICATE_INPUT,
  InputState.VALIDATE_PREVIEW,
  InputState.PREVIEW_ADDRESS,
  InputState.PREVIEW_CONTRACT_EXISTS_LOCALLY,
  InputState.VALIDATE_EXISTS_ON_CHAIN,
  InputState.RESOLVE_ASSET,
]);

export function isTriggerFSMState(state: InputState): boolean {
  return TRIGGER_FSM_STATES.has(state);
}
