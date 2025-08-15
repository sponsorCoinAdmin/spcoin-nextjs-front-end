// File: lib/hooks/inputValidations/FSM_Core/validationTests/closeSelectPanel.ts

import { InputState } from '@/lib/structure/assetSelection';
import type { ValidateFSMInput, ValidateFSMOutput } from '../types/validateFSMTypes';

/**
 * CLOSE_SELECT_PANEL
 * - Close the select panel (moved from context side-effects).
 * - Remains in CLOSE_SELECT_PANEL as a terminal state.
 *
 * Notes:
 * - This reads optional callback from `ValidateFSMInput`:
 *   - closePanelCallback?: (fromUser: boolean) => void
 */
export function closeSelectPanel(input: ValidateFSMInput): ValidateFSMOutput {
  try {
    (input as any)?.closePanelCallback?.(true);

    const out: ValidateFSMOutput = {
      nextState: InputState.CLOSE_SELECT_PANEL,
    };

    return out;
  } catch (err: any) {
    return {
      nextState: InputState.VALIDATE_ADDRESS,
      errorMessage: err?.message ?? 'closeSelectPanel() failed',
    };
  }
}
