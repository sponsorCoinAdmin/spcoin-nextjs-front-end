// File: components/containers/RecipientSelectScrollPanel.tsx

'use client';

import { useCallback, useEffect } from 'react';
import {
  FEED_TYPE,
  InputState,
  WalletAccount,
  SP_COIN_DISPLAY,
} from '@/lib/structure';

import AssetSelectScrollContainer from './AssetSelectScrollContainer';
import { useBaseSelectShared } from '@/lib/hooks/useBaseSelectShared';
import { useDisplayControls } from '@/lib/context/hooks';

export default function RecipientSelectScrollPanel() {
  const { updateAssetScrollDisplay } = useDisplayControls();
  const sharedState = useBaseSelectShared();

  useEffect(() => {
    if (sharedState.inputState === InputState.CLOSE_INPUT) {
      updateAssetScrollDisplay(SP_COIN_DISPLAY.EXCHANGE_ROOT);
    }
  }, [sharedState.inputState, updateAssetScrollDisplay]);

  const handleSelect = useCallback(
    (wallet: WalletAccount, state: InputState) => {
      if (state === InputState.CLOSE_INPUT) {
        console.debug('✅ [RecipientSelectScrollPanel] selected wallet', wallet);
      }
    },
    []
  );

  return (
    <AssetSelectScrollContainer<WalletAccount>
      setShowDialog={() => {}} // deprecated – no longer controls visibility
      onSelect={handleSelect}
      title="Select a Recipient"
      feedType={FEED_TYPE.RECIPIENT_ACCOUNTS}
      inputPlaceholder="Paste recipient wallet address"
    />
  );
}
