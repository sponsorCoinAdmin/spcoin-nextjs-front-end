// File: lib/hooks/inputValidations/helpers/handleTerminalState.ts

import { InputState, TokenContract, WalletAccount } from '@/lib/structure';
import { createDebugLogger } from '@/lib/utils/debugLogger';

const debugLog = createDebugLogger(
  'handleTerminalState',
  process.env.NEXT_PUBLIC_DEBUG_FSM === 'true'
);

export function handleTerminalState({
  state,
  validatedAsset,
  setValidatedAsset,
  setTradingTokenCallback,
  setInputState,
  closePanelCallback,
}: {
  state: InputState;
  validatedAsset?: TokenContract;
  setValidatedAsset: (asset: WalletAccount | TokenContract | undefined) => void;
  setTradingTokenCallback: (token: any) => void;
  setInputState: (s: InputState, source?: string) => void;
  closePanelCallback: (fromUser: boolean) => void;
}) {
  switch (state) {
    case InputState.UPDATE_VALIDATED_ASSET: {
      debugLog.log(
        `📥 UPDATE_VALIDATED_ASSET (${validatedAsset?.symbol || validatedAsset?.address || 'none'})`
      );
      if (validatedAsset) {
        // Persist the resolved token and notify the panel
        setValidatedAsset(validatedAsset);
        setTradingTokenCallback(validatedAsset);

        // Advance to close
        setInputState(InputState.CLOSE_SELECT_PANEL, 'terminal:UPDATE_VALIDATED_ASSET');
      } else {
        debugLog.warn('⚠️ Missing validatedAsset in UPDATE_VALIDATED_ASSET');
      }
      break;
    }

    case InputState.CLOSE_SELECT_PANEL: {
      debugLog.log('🚪 CLOSE_SELECT_PANEL → closePanelCallback(true)');
      closePanelCallback(true);
      break;
    }

    default:
      // Non-terminal states: no-op
      break;
  }
}
