'use client';

import { useCallback } from 'react';
import AddressSelect from '@/components/shared/AddressSelect';
import { useBaseSelectShared } from '@/lib/hooks/useBaseSelectShared';
import {
  CONTAINER_TYPE,
  InputState,
  FEED_TYPE,
  TokenContract,
  WalletAccount,
} from '@/lib/structure';
import BaseModalDialog from './BaseModalDialog';

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

  const handleSelect = useCallback(
    (item: T, state: InputState) => {
      console.debug('🎯 [AssetSelectScrollContainer] onSelect triggered', { item, state });
      if (state === InputState.CLOSE_INPUT) {
        onSelect(item, state);
      }
    },
    [onSelect]
  );

  return (
    <BaseModalDialog
      id="AssetSelectScrollContainer"
      setShowDialog={setShowDialog}
      title={title}
    >
      <AddressSelect<T>
        feedType={feedType}
        inputPlaceholder={inputPlaceholder}
        closeDialog={() => setShowDialog(false)}
        onSelect={handleSelect}
        duplicateMessage={duplicateMessage}
        showDuplicateCheck={showDuplicateCheck}
        containerType={containerType}
        sharedState={sharedState} // ✅ required prop
      />
    </BaseModalDialog>
  );
}
