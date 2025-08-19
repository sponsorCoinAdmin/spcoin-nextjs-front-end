// File: lib/hooks/inputValidations/FSM_Core/useFSMTerminals.ts
import { useEffect, useRef } from 'react';
import { InputState } from '@/lib/structure/assetSelection';
import type { TokenContract, WalletAccount } from '@/lib/structure';

type UseFSMTerminalsArgs = {
  inputState: InputState;
  validatedAsset?: TokenContract | WalletAccount;
  onForwardAsset: (asset: TokenContract | WalletAccount) => void;
  onClose: (fromUser: boolean) => void;
  onCleanup: () => void; // reset local/input/FSM state for next open
  debug?: boolean;
};

/**
 * Terminal-state safety net:
 *  - UPDATE_VALIDATED_ASSET → forward asset once (if caller missed it)
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
    // Fallback: ensure selected asset is forwarded on commit state
    if (
      inputState === InputState.UPDATE_VALIDATED_ASSET &&
      validatedAsset &&
      !sentRef.current
    ) {
      if (debug) console.warn('[useFSMTerminals] fallback: forward asset');
      sentRef.current = true;
      onForwardAsset(validatedAsset);
    }

    // Only close on explicit CLOSE_SELECT_PANEL
    if (inputState === InputState.CLOSE_SELECT_PANEL) {
      if (!closedRef.current) {
        if (debug) console.warn('[useFSMTerminals] fallback: close panel');
        closedRef.current = true;
        onClose(false); // programmatic close
      } else if (debug) {
        console.log('[useFSMTerminals] close already handled');
      }

      // Caller-provided cleanup (clear asset, reset input/FSM, etc.)
      onCleanup();

      // Ready for next cycle
      closedRef.current = false;
      sentRef.current = false;
    }
  }, [inputState, validatedAsset, onForwardAsset, onClose, onCleanup, debug]);
}
