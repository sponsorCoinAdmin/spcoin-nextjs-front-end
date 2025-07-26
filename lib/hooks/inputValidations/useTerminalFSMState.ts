// File: lib/hooks/inputValidations/useTerminalFSMState.ts

import { useSharedPanelContext } from '@/lib/context/ScrollSelectPanels/useSharedPanelContext';
import { InputState } from '@/lib/structure';

// ──────────────────────────────────────────────
// FSM terminal states (where inputState should halt FSM)
// ──────────────────────────────────────────────
const terminalStates = [
  InputState.INVALID_HEX_INPUT,
  InputState.INCOMPLETE_ADDRESS,
  InputState.INVALID_ADDRESS_INPUT,
  InputState.DUPLICATE_INPUT_ERROR,
  InputState.CONTRACT_NOT_FOUND_ON_BLOCKCHAIN,
  InputState.PREVIEW_CONTRACT_NOT_FOUND_LOCALLY,
  InputState.VALIDATE_ASSET_ERROR,
  InputState.CLOSE_SELECT_PANEL,
];

// ──────────────────────────────────────────────
// FSM error states (used to show validation errors)
// ──────────────────────────────────────────────
const errorStates = [
  InputState.INVALID_HEX_INPUT,
  InputState.INCOMPLETE_ADDRESS,
  InputState.INVALID_ADDRESS_INPUT,
  InputState.DUPLICATE_INPUT_ERROR,
  InputState.CONTRACT_NOT_FOUND_ON_BLOCKCHAIN,
  InputState.PREVIEW_CONTRACT_NOT_FOUND_LOCALLY,
  InputState.VALIDATE_ASSET_ERROR,
];

export function useTerminalFSMState() {
  const { inputState } = useSharedPanelContext();

  const isTerminalState = terminalStates.includes(inputState);
  const isErrorState = errorStates.includes(inputState);
  const isSuccess = inputState === InputState.CLOSE_SELECT_PANEL;

  // 💡 Show validated preview/contract panel if we've entered post-validation stages
  const showRenderPanel = inputState >= InputState.VALIDATE_ASSET;

  return {
    inputState,
    isTerminalState,
    isErrorState,
    isSuccess,
    showRenderPanel,
  };
}
