// File: components/containers/AssetSelectScrollContainer.tsx
'use client';

import { useCallback, useEffect } from 'react';
import AddressSelect from '@/components/shared/AddressSelect';
import { useBaseSelectShared } from '@/lib/hooks/useBaseSelectShared';
import {
  CONTAINER_TYPE,
  InputState,
  FEED_TYPE,
  TokenContract,
  WalletAccount,
  getInputStateString,
} from '@/lib/structure';
import BaseModalDialog from './BaseModalDialog';
import { createDebugLogger } from '@/lib/utils/debugLogger';

const LOG_TIME = false;
const DEBUG_ENABLED = process.env.NEXT_PUBLIC_DEBUG_LOG_SCROLL_PANEL_CONTEXT === 'true';
const debugLog = createDebugLogger('ScrollPanelContext', DEBUG_ENABLED, LOG_TIME);

// ---------------------------------------------
// Shared Interface
// ---------------------------------------------

interface BaseProps<T> {
  setShowDialog: (show: boolean) => void;
  onSelect: (item: T, state: InputState) => void;
  title: string;
  feedType: FEED_TYPE;
  inputPlaceholder: string;
  duplicateMessage?: string;
  showDuplicateCheck?: boolean;
  containerType?: CONTAINER_TYPE;
}

// ---------------------------------------------
// Generic Address Selection Dialog
// ---------------------------------------------

export default function AssetSelectScrollContainer<T extends TokenContract | WalletAccount>({
  setShowDialog,
  onSelect,
  title,
  feedType,
  inputPlaceholder,
  duplicateMessage,
  showDuplicateCheck = false,
  containerType,
}: BaseProps<T>) {
  const sharedState = useBaseSelectShared();

  useEffect(() => {
    debugLog.log(`📥 AssetSelectScrollContainer mounted`);
    debugLog.log(`📦 containerType = ${containerType}`);
  }, [containerType]);

  useEffect(() => {
    const stateStr = getInputStateString(sharedState.inputState);
    debugLog.log(`🔁 inputState changed → ${stateStr}`);
  }, [sharedState.inputState]);

  const handleSelect = useCallback(
    (item: T, state: InputState) => {
      const stateStr = getInputStateString(state);
      debugLog.log(`🎯 handleSelect called with state=${stateStr}`);
      debugLog.log(`📦 item = ${JSON.stringify(item, null, 2)}`);

      if (state === InputState.CLOSE_SELECT_INPUT) {
        debugLog.log(`✅ onSelect forwarding CLOSE_SELECT_INPUT`);
        onSelect(item, state);
      }
    },
    [onSelect]
  );

  return (
    <BaseModalDialog
      id="AssetSelectScrollContainer"
      title={title}
    >
      <AddressSelect<T>
        feedType={feedType}
        inputPlaceholder={inputPlaceholder}
        closeDialog={() => {
          debugLog.log(`❌ closeDialog() called → setShowDialog(false)`);
          setShowDialog(false);
        }}
        onSelect={handleSelect}
        duplicateMessage={duplicateMessage}
        showDuplicateCheck={showDuplicateCheck}
        containerType={containerType}
        sharedState={sharedState} // ✅ required prop
      />
    </BaseModalDialog>
  );
}
