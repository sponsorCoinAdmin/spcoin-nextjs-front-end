// File: lib/hooks/inputValidations/utils/handleTerminalState.ts

import { InputState, TokenContract, getInputStateString } from '@/lib/structure';
import { createDebugLogger } from '@/lib/utils/debugLogger';

const DEBUG_ENABLED = process.env.NEXT_PUBLIC_DEBUG_FSM === 'true';
const LOG_TIME = false;
const debugFSM = createDebugLogger('handleFSMTerminalState', DEBUG_ENABLED, LOG_TIME);

export function handleFSMTerminalState(
  inputState: InputState,
  validatedAsset: TokenContract | undefined,
  setInputState: (state: InputState) => void,
  setValidatedAsset: (token: TokenContract | undefined) => void,
  setTradingTokenCallback: (token: TokenContract) => void,
  closeCallback: (fromUser: boolean) => void
): void {
  switch (inputState) {
    case InputState.UPDATE_VALIDATED_ASSET:
      debugFSM.log('📥 FSM: UPDATE_VALIDATED_ASSET reached');
      if (validatedAsset) {
        debugFSM.log(`📦 setValidatedAsset → ${validatedAsset.symbol || validatedAsset.address}`);
        setValidatedAsset(validatedAsset); // ✅ Now storing the validated asset in context
        debugFSM.log(`📦 setTradingTokenCallback → ${validatedAsset.symbol || validatedAsset.address}`);
        setTradingTokenCallback(validatedAsset);
        setInputState(InputState.CLOSE_SELECT_PANEL);
      } else {
        debugFSM.warn('⚠️ Missing validatedAsset in UPDATE_VALIDATED_ASSET');
      }
      break;

    case InputState.CLOSE_SELECT_PANEL:
      debugFSM.log('🚪 FSM: CLOSE_SELECT_PANEL → closeCallback(true)');
      closeCallback(true);
      break;

    default:
      // Do nothing for non-terminal states
      break;
  }
}
