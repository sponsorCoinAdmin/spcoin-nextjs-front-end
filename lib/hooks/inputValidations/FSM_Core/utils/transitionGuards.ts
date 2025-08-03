// File: lib/hooks/inputValidations/FSM_Core/utils/transitionGuards.ts

import { InputState } from '@/lib/structure';

/**
 * Defines the legal state transitions between FSM input states.
 */
export const transitionGuards: Record<InputState, InputState[]> = {
  [InputState.EMPTY_INPUT]: [
    InputState.VALIDATE_ADDRESS,
  ],

  [InputState.INVALID_HEX_INPUT]: [
    InputState.EMPTY_INPUT,
    InputState.VALIDATE_ADDRESS,
  ],

  [InputState.VALIDATE_ADDRESS]: [
    InputState.INCOMPLETE_ADDRESS,
    InputState.INVALID_ADDRESS_INPUT,
    InputState.TEST_DUPLICATE_INPUT,
  ],

  [InputState.INCOMPLETE_ADDRESS]: [
    InputState.EMPTY_INPUT,
    InputState.VALIDATE_ADDRESS,
  ],

  [InputState.INVALID_ADDRESS_INPUT]: [
    InputState.EMPTY_INPUT,
    InputState.VALIDATE_ADDRESS,
  ],

  [InputState.TEST_DUPLICATE_INPUT]: [
    InputState.DUPLICATE_INPUT_ERROR,
    InputState.VALIDATE_PREVIEW,
  ],

  [InputState.DUPLICATE_INPUT_ERROR]: [
    InputState.EMPTY_INPUT,
    InputState.VALIDATE_ADDRESS,
  ],

  [InputState.VALIDATE_PREVIEW]: [
    InputState.PREVIEW_ADDRESS,
    InputState.PREVIEW_CONTRACT_NOT_FOUND_LOCALLY,
  ],

  [InputState.PREVIEW_ADDRESS]: [
    InputState.PREVIEW_CONTRACT_EXISTS_LOCALLY,
    InputState.PREVIEW_CONTRACT_NOT_FOUND_LOCALLY,
  ],

  [InputState.PREVIEW_CONTRACT_EXISTS_LOCALLY]: [
    InputState.VALIDATE_EXISTS_ON_CHAIN,
  ],

  [InputState.PREVIEW_CONTRACT_NOT_FOUND_LOCALLY]: [
    InputState.VALIDATE_EXISTS_ON_CHAIN,
  ],

  [InputState.VALIDATE_EXISTS_ON_CHAIN]: [
    InputState.CONTRACT_NOT_FOUND_ON_BLOCKCHAIN,
    InputState.RESOLVE_ASSET,
  ],

  [InputState.CONTRACT_NOT_FOUND_ON_BLOCKCHAIN]: [
    InputState.EMPTY_INPUT,
    InputState.VALIDATE_ADDRESS,
  ],

  [InputState.RESOLVE_ASSET]: [
    InputState.TOKEN_NOT_RESOLVED_ERROR,
    InputState.RESOLVE_ASSET_ERROR,
    InputState.MISSING_ACCOUNT_ADDRESS,
    InputState.UPDATE_VALIDATED_ASSET,
  ],

  [InputState.TOKEN_NOT_RESOLVED_ERROR]: [
    InputState.EMPTY_INPUT,
    InputState.VALIDATE_ADDRESS,
  ],

  [InputState.RESOLVE_ASSET_ERROR]: [
    InputState.EMPTY_INPUT,
    InputState.VALIDATE_ADDRESS,
  ],

  [InputState.MISSING_ACCOUNT_ADDRESS]: [
    InputState.EMPTY_INPUT,
    InputState.VALIDATE_ADDRESS,
  ],

  [InputState.UPDATE_VALIDATED_ASSET]: [
    InputState.CLOSE_SELECT_PANEL,
  ],

  [InputState.CLOSE_SELECT_PANEL]: [
    InputState.EMPTY_INPUT,
  ],
};

/**
 * Checks if a transition from `from` state to `to` state is valid.
 */
export function isValidFSMTransition(from: InputState, to: InputState): boolean {
  const allowedNext = transitionGuards[from] || [];
  return allowedNext.includes(to);
}
