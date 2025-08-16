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
 * Ensures that when the FSM reaches terminal states:
 *  - UPDATE_VALIDATED_ASSET: the asset is forwarded to the parent at least once
 *  - CLOSE_SELECT_PANEL: the panel closes at least once and cleanup runs
 *
 * Guards dedupe both actions across BUY/SELL paths.
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
    // forward asset if hook-side missed it
    if (inputState === InputState.UPDATE_VALIDATED_ASSET && validatedAsset && !sentRef.current) {
      if (debug) console.warn('[useFSMTerminals] fallback: forward asset');
      sentRef.current = true;
      onForwardAsset(validatedAsset);
    }

    // close panel if hook-side missed it
    if (inputState === InputState.CLOSE_SELECT_PANEL) {
      if (!closedRef.current) {
        if (debug) console.warn('[useFSMTerminals] fallback: close panel');
        closedRef.current = true;
        onClose(false);
      } else if (debug) {
        console.log('[useFSMTerminals] close already handled');
      }

      // do caller-provided cleanup (clear asset, reset input + FSM, etc.)
      onCleanup();

      // allow next cycle
      closedRef.current = false;
      sentRef.current = false;
    }
  }, [inputState, validatedAsset, onForwardAsset, onClose, onCleanup, debug]);
}
