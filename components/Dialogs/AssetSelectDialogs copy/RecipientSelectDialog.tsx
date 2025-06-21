'use client';

import { useEffect } from 'react';
import { InputState, FEED_TYPE, WalletAccount, CONTAINER_TYPE } from '@/lib/structure';
import AddressSelectDialog from './AddressSelectDialog';
import { createDebugLogger } from '@/lib/utils';

const LOG_TIME: boolean = false;
const DEBUG_ENABLED = process.env.NEXT_PUBLIC_DEBUG_LOG_ASSET_SELECT_DIALOGS === 'true';
const debugLog = createDebugLogger('apiResponse', DEBUG_ENABLED, LOG_TIME);

export function RecipientSelectDialog(props: {
  showDialog: boolean;
  setShowDialog: (show: boolean) => void;
  onSelect: (wallet: WalletAccount, state: InputState) => void;
}) {
  useEffect(() => {
    debugLog.log('📬 [RecipientSelectDialog] props received', {
      showDialog: props.showDialog,
    });
  }, [props.showDialog]);

  return (
    <AddressSelectDialog<WalletAccount>
    containerType={CONTAINER_TYPE.RECIPIENT_CONTAINER}
     {...props}
    // title="Select a Recipient"
    feedType={FEED_TYPE.RECIPIENT_ACCOUNTS}
    inputPlaceholder="Paste recipient wallet address"
    onSelect={(wallet, state) => {
      debugLog.log('✅ [RecipientSelectDialog] selected wallet', wallet);
      if (state === InputState.CLOSE_INPUT) {
        props.onSelect(wallet, state);
      }
    } }    />
  );
}
