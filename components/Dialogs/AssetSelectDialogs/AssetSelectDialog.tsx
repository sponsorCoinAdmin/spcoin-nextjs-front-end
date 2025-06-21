// File: lib/components/dialogs/AssetSelectDialog.tsx

'use client';

import { useEffect } from 'react';
import AddressSelect from '@/components/shared/AddressSelect';
import { InputState, CONTAINER_TYPE, FEED_TYPE, TokenContract, WalletAccount } from '@/lib/structure';
import { BaseModalDialog } from './BaseModalDialog';
import { createDebugLogger } from '@/lib/utils/debugLogger';
import { useContainerType } from '@/lib/utils/useContainerType';

const LOG_TIME: boolean = false;
const DEBUG_ENABLED = process.env.NEXT_PUBLIC_DEBUG_LOG_ASSET_SELECT_DIALOGS === 'true';
const debugLog = createDebugLogger('apiResponse', DEBUG_ENABLED, LOG_TIME);

interface BaseProps<T> {
  showDialog: boolean;
  setShowDialog: (show: boolean) => void;
  onSelect: (item: T, state: InputState) => void;
  feedType: FEED_TYPE;
  containerType: CONTAINER_TYPE;
}

export default function AssetSelectDialog<T extends TokenContract | WalletAccount>({
  showDialog,
  setShowDialog,
  onSelect,
  feedType,
  containerType,
}: BaseProps<T>) {
  const {
    inputPlaceholder,
    title,
    duplicateMessage,
    showDuplicateCheck,
  } = useContainerType(containerType);

  useEffect(() => {
    debugLog.log('📬 [AssetSelectDialog] props received', {
      showDialog,
      feedType,
      containerType,
    });
  }, [showDialog, feedType, containerType]);

  return (
    <BaseModalDialog
      id="AsetSelectDialog"
      showDialog={showDialog}
      setShowDialog={setShowDialog}
      title={title}
    >
      <AddressSelect<T>
        feedType={feedType}
        inputPlaceholder={inputPlaceholder}
        closeDialog={() => {
          debugLog.log('❌ [AssetSelectDialog] closeDialog called');
          setShowDialog(false);
        }}
        onSelect={(item, state) => {
          debugLog.log('🎯 [AssetSelectDialog] onSelect triggered', { item, state });
          if (state === InputState.CLOSE_INPUT) {
            onSelect(item, state);
          }
        }}
        duplicateMessage={duplicateMessage}
        showDuplicateCheck={showDuplicateCheck}
        containerType={containerType}
      />
    </BaseModalDialog>
  );
}
