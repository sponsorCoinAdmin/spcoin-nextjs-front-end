'use client';

import { useEffect, useMemo } from 'react';
import AddressSelect from '@/components/shared/AddressSelect';
import { InputState, CONTAINER_TYPE, FEED_TYPE, TokenContract, WalletAccount } from '@/lib/structure';
import { BaseModalDialog } from './BaseModalDialog';
import { createDebugLogger, getContainerTitle } from '@/lib/utils';

const LOG_TIME: boolean = false;
const DEBUG_ENABLED = process.env.NEXT_PUBLIC_DEBUG_LOG_ASSET_SELECT_DIALOGS === 'true';
const debugLog = createDebugLogger('apiResponse', DEBUG_ENABLED, LOG_TIME);

interface BaseProps<T> {
  showDialog: boolean;
  setShowDialog: (show: boolean) => void;
  onSelect: (item: T, state: InputState) => void;
  feedType: FEED_TYPE;
  containerType: CONTAINER_TYPE;
  inputPlaceholder: string;
  showDuplicateCheck?: boolean;
}

export default function AddressSelectDialog<T extends TokenContract | WalletAccount>({
  showDialog,
  setShowDialog,
  onSelect,
  feedType,
  inputPlaceholder,
  containerType,
}: BaseProps<T>) {

  const showDuplicateCheck = useMemo(() => {
    return (
      containerType === CONTAINER_TYPE.BUY_SELECT_CONTAINER ||
      containerType === CONTAINER_TYPE.SELL_SELECT_CONTAINER
    );
  }, [containerType]);

  useEffect(() => {
    debugLog.log('📬 [AddressSelectDialog] props received', {
      showDialog,
      feedType,
      containerType,
    });
  }, [showDialog, feedType, showDuplicateCheck, containerType]);


  const duplicateMessage = useMemo(() =>
    containerType === CONTAINER_TYPE.SELL_SELECT_CONTAINER
      ? 'Sell Address Cannot Be the Same as Buy Address'
      : 'Buy Address Cannot Be the Same as Sell Address',
    [containerType]
  );

  const title = useMemo(() => {
    return getContainerTitle(containerType);
  }, [containerType]);



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
          debugLog.log('❌ [AddressSelectDialog] closeDialog called');
          setShowDialog(false);
        }}
        onSelect={(item, state) => {
          debugLog.log('🎯 [AddressSelectDialog] onSelect triggered', { item, state });
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
