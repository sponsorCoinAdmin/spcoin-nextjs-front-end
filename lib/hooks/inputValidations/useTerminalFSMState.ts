// File: lib/hooks/inputValidations/useTerminalFSMState.ts

import { useSharedPanelContext } from '@/lib/context/ScrollSelectPanels/useSharedPanelContext';
import { InputState } from '@/lib/structure';

const terminalStates = [
  InputState.INVALID_HEX_INPUT,
  InputState.INCOMPLETE_ADDRESS,
  InputState.INVALID_ADDRESS_INPUT,
  InputState.DUPLICATE_INPUT_ERROR,
  InputState.CONTRACT_NOT_FOUND_ON_BLOCKCHAIN,
  InputState.PREVIEW_CONTRACT_NOT_FOUND_LOCALLY,
  InputState.VALIDATE_BALANCE_ERROR,
  InputState.CLOSE_SELECT_PANEL,
];

const errorStates = [
  InputState.INVALID_HEX_INPUT,
  InputState.INCOMPLETE_ADDRESS,
  InputState.INVALID_ADDRESS_INPUT,
  InputState.DUPLICATE_INPUT_ERROR,
  InputState.CONTRACT_NOT_FOUND_ON_BLOCKCHAIN,
  InputState.PREVIEW_CONTRACT_NOT_FOUND_LOCALLY,
  InputState.VALIDATE_BALANCE_ERROR,
];

export function useTerminalFSMState() {
  const { inputState } = useSharedPanelContext();
  const showRenderPanel = inputState >= InputState.VALIDATE_BALANCE;
  const isTerminalState = terminalStates.includes(inputState);
  const isErrorState = errorStates.includes(inputState);

  // ✅ define success as passing balance validation, just before close panel
  const isSuccess = inputState === InputState.CLOSE_SELECT_PANEL;

  return { inputState, isTerminalState, isErrorState, isSuccess, showRenderPanel };
}
