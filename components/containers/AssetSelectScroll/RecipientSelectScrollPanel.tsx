'use client';

import { useCallback } from 'react';
import { FEED_TYPE, InputState, WalletAccount } from '@/lib/structure';
import AssetSelectScrollContainer from './AssetSelectScrollContainer';

export default function RecipientSelectScrollPanel({
  setShowDialog,
  onSelect,
}: {
  setShowDialog: (show: boolean) => void;
  onSelect: (wallet: WalletAccount, state: InputState) => void;
}) {
  const handleSelect = useCallback(
    (wallet: WalletAccount, state: InputState) => {
      console.debug('✅ [RecipientSelectScrollPanel] selected wallet', wallet);
      if (state === InputState.CLOSE_INPUT) {
        onSelect(wallet, state);
      }
    },
    [onSelect]
  );

  return (
    <AssetSelectScrollContainer<WalletAccount>
      setShowDialog={setShowDialog}
      onSelect={handleSelect}
      title="Select a Recipient"
      feedType={FEED_TYPE.RECIPIENT_ACCOUNTS}
      inputPlaceholder="Paste recipient wallet address"
    />
  );
}
