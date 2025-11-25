// File: @/lib/hooks/inputValidation/FSM_Core/fSMInputStates.ts

import { InputState } from "@/lib/structure/assetSelection";

// ────────────── FSM Trigger States ──────────────
export const TRIGGER_FSM_STATES = new Set<InputState>([
  InputState.VALIDATE_ADDRESS,
  InputState.TEST_DUPLICATE_INPUT,
  InputState.VALIDATE_PREVIEW,
  InputState.VALIDATE_LOCAL_NATIVE_TOKEN,
  InputState.VALIDATE_EXISTS_ON_CHAIN,
  InputState.RESOLVE_ERC20_ASSET,
  InputState.RETURN_VALIDATED_ASSET,
]);

// ────────────── FSM Error States ──────────────
export const ERROR_FSM_STATES = new Set<InputState>([
  InputState.INVALID_HEX_INPUT,
  InputState.INCOMPLETE_ADDRESS,
  InputState.INVALID_ADDRESS_INPUT,
  InputState.DUPLICATE_INPUT_ERROR,
  InputState.CONTRACT_NOT_FOUND_ON_BLOCKCHAIN,
  InputState.VALIDATE_ERC20_ASSET_ERROR,
  InputState.VALIDATE_ERC20_ASSET_ERROR, // optional if used in your state enum
]);

// ────────────── Finalize FSM States ──────────────
export const FINALIZE_FSM_STATES = new Set<InputState>([
  InputState.EMPTY_INPUT,
  InputState.VALIDATE_PREVIEW,
  InputState.CLOSE_SELECT_PANEL,
]);

export const TERMINAL_FSM_STATES = new Set<InputState>([
  ...ERROR_FSM_STATES,
  ...FINALIZE_FSM_STATES,
]);

// ────────────── Render FSM States (for RenderAssetPreview) ──────────────
export const RENDER_FSM_STATES = new Set<InputState>([
  InputState.VALIDATE_PREVIEW,
  InputState.INVALID_ADDRESS_INPUT,
]);

export function isTriggerFSMState(state: InputState): boolean {
  return TRIGGER_FSM_STATES.has(state);
}

export function isErrorFSMState(state: InputState): boolean {
  return ERROR_FSM_STATES.has(state);
}

export function isFinalizeFSMState(state: InputState): boolean {
  return FINALIZE_FSM_STATES.has(state);
}

export function isTerminalFSMState(state: InputState): boolean {
  return TERMINAL_FSM_STATES.has(state);
}

export function isRenderFSMState(state: InputState): boolean {
  return RENDER_FSM_STATES.has(state);
}
