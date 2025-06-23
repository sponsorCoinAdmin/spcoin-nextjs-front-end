// File: components/dialogs/RecipientSelectDialog.tsx

'use client';

import { useEffect } from 'react';
import { InputState, FEED_TYPE, WalletAccount, CONTAINER_TYPE } from '@/lib/structure';
import AssetSelectDialog from './AssetSelectContainer';
import { useAssetSelectDialog } from '@/lib/hooks/useAssetSelectDialog';

export function RecipientSelectDialog(props: {
  showDialog: boolean;
  setShowDialog: (show: boolean) => void;
  onSelect: (wallet: WalletAccount, state: InputState) => void;
}) {
  const { handleSelect, debugLog } = useAssetSelectDialog<WalletAccount>(
    'RecipientSelectDialog',
    (wallet, state) => {
      if (state === InputState.CLOSE_INPUT) {
        props.onSelect(wallet, state);
      }
    }
  );

  useEffect(() => {
    debugLog.log('📬 [RecipientSelectDialog] props received', {
      showDialog: props.showDialog,
    });
  }, [props.showDialog]);

  return (
    <AssetSelectDialog<WalletAccount>
      {...props}
      feedType={FEED_TYPE.RECIPIENT_ACCOUNTS}
      containerType={CONTAINER_TYPE.RECIPIENT_CONTAINER}
      onSelect={handleSelect}
    />
  );
}
