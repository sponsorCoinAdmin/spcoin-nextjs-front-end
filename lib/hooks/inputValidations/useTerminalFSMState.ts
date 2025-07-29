// File: lib/hooks/inputValidations/useTerminalFSMState.ts

import { useSharedPanelContext } from '@/lib/context/ScrollSelectPanels/useSharedPanelContext';

import { InputState } from '@/lib/structure';
import { isErrorFSMState, isTerminalFSMState } from './FSM_Core/fSMInputStates';

export function useTerminalFSMState() {
  const { inputState } = useSharedPanelContext();

  return {
    inputState,
    isTerminalState: isTerminalFSMState(inputState),
    isErrorState: isErrorFSMState(inputState),
    isSuccess: inputState === InputState.CLOSE_SELECT_PANEL,
    showRenderPanel: inputState >= InputState.RESOLVE_ASSET,
  };
}
