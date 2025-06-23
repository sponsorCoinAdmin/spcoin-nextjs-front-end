// File: lib/components/dialogs/AssetSelectDialog.tsx

'use client';

import { useEffect, useMemo, useCallback } from 'react';
import AddressSelect from '@/components/shared/AddressSelect';
import { InputState, CONTAINER_TYPE, FEED_TYPE, TokenContract, WalletAccount } from '@/lib/structure';
import { BaseModalDialog } from './BaseModalDialog';
import { createDebugLogger } from '@/lib/utils/debugLogger';
import { useContainerType } from '@/lib/utils/useContainerType';

const LOG_TIME = false;
const DEBUG_ENABLED = process.env.NEXT_PUBLIC_DEBUG_LOG_ASSET_SELECT_DIALOGS === 'true';
const debugLog = createDebugLogger('AssetSelectDialog', DEBUG_ENABLED, LOG_TIME);

interface AssetSelectDialogProps<T> {
  showContainer: boolean;
  setShowContainer: (show: boolean) => void;
  onSelect: (item: T, state: InputState) => void;
  feedType: FEED_TYPE;
  containerType: CONTAINER_TYPE;
}

export default function AssetSelectDialog<T extends TokenContract | WalletAccount>({
  showContainer,
  setShowContainer,
  onSelect,
  feedType,
  containerType,
}: AssetSelectDialogProps<T>) {
  const containerProps = useContainerType(containerType);

  useEffect(() => {
    debugLog.log('📬 Props received', { showContainer, feedType, containerType });
  }, [showContainer, feedType, containerType]);

  const handleClose = useCallback(() => {
    debugLog.log('❌ closeDialog triggered');
    setShowContainer(false);
  }, [setShowContainer]);

  const handleSelect = useCallback(
    (item: T, state: InputState) => {
      debugLog.log('🎯 onSelect triggered', { item, state });
      if (state === InputState.CLOSE_INPUT) onSelect(item, state);
    },
    [onSelect]
  );

  return (
    <BaseModalDialog
      id="AssetSelectDialog"
      showContainer={showContainer}
      setShowContainer={setShowContainer}
      title={containerProps.title}
    >
      <AddressSelect<T>
        feedType={feedType}
        inputPlaceholder={containerProps.inputPlaceholder}
        closeDialog={handleClose}
        onSelect={handleSelect}
        duplicateMessage={containerProps.duplicateMessage}
        showDuplicateCheck={containerProps.showDuplicateCheck}
        containerType={containerType}
      />
    </BaseModalDialog>
  );
}
