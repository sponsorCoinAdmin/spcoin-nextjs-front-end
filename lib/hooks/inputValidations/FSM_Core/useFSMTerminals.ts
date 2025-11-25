// File: @/lib/hooks/inputValidations/FSM_Core/useFSMTerminals.ts
import { useEffect, useRef } from 'react';
import { InputState } from '@/lib/structure/assetSelection';
import type { TokenContract, WalletAccount } from '@/lib/structure';
import { createDebugLogger } from '@/lib/utils/debugLogger';

type UseFSMTerminalsArgs = {
  inputState: InputState;
  validatedAsset?: TokenContract | WalletAccount;
  onForwardAsset: (asset: TokenContract | WalletAccount) => void;
  onClose: (fromUser: boolean) => void;
  onCleanup: () => void; // reset local/input/FSM state for next open
  debug?: boolean;
};

const LOG_TIME = false;
const DEBUG_ENABLED =
  process.env.NEXT_PUBLIC_DEBUG_FSM === 'true' ||
  process.env.NEXT_PUBLIC_DEBUG_FSM_TRACE_PANEL === 'true';

const debugLog = createDebugLogger('useFSMTerminals', DEBUG_ENABLED, LOG_TIME);

/**
 * Terminal-state safety net:
 *  - RETURN_VALIDATED_ASSET → forward asset once (if caller missed it)
 *  - CLOSE_SELECT_PANEL     → close once, then run cleanup
 *
 * NOTE:
 *  - Does NOT close on VALIDATE_PREVIEW (manual entry preview should stay open)
 *  - Does NOT close on error states (error preview should stay open)
 */
export function useFSMTerminals({
  inputState,
  validatedAsset,
  onForwardAsset,
  onClose,
  onCleanup,
  debug = false,
}: UseFSMTerminalsArgs) {
  const sentRef = useRef(false);
  const closedRef = useRef(false);

  useEffect(() => {
    const shouldLog = debug || DEBUG_ENABLED;

    // Fallback: ensure selected asset is forwarded on commit state
    if (
      inputState === InputState.RETURN_VALIDATED_ASSET &&
      validatedAsset &&
      !sentRef.current
    ) {
      if (shouldLog) {
        debugLog.warn?.('[useFSMTerminals] fallback: forward asset', {
          inputState: InputState[inputState],
        });
      }
      sentRef.current = true;
      onForwardAsset(validatedAsset);
    }

    // Only close on explicit CLOSE_SELECT_PANEL
    if (inputState === InputState.CLOSE_SELECT_PANEL) {
      if (!closedRef.current) {
        if (shouldLog) {
          debugLog.warn?.('[useFSMTerminals] fallback: close panel', {
            inputState: InputState[inputState],
          });
        }
        closedRef.current = true;
        onClose(false); // programmatic close
      } else if (debug || DEBUG_ENABLED) {
        debugLog.log?.('[useFSMTerminals] close already handled');
      }

      // Caller-provided cleanup (clear asset, reset input/FSM, etc.)
      onCleanup();

      // Ready for next cycle
      closedRef.current = false;
      sentRef.current = false;
    }
  }, [inputState, validatedAsset, onForwardAsset, onClose, onCleanup, debug]);
}
