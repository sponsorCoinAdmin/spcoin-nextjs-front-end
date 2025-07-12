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
import { useSharedPanelContext } from '@/lib/context/ScrollSelectPanels/useSharedPanelContext';import { useDisplayControls } from '@/lib/context/hooks';

export default function RecipientSelectScrollPanel() {
  const { inputState, setInputState, containerType } = useSharedPanelContext();
  const { updateAssetScrollDisplay } = useDisplayControls();

  useEffect(() => {
    if (inputState === InputState.CLOSE_SELECT_SCROLL_PANEL) {
      updateAssetScrollDisplay(SP_COIN_DISPLAY.EXCHANGE_ROOT);
    }
  }, [inputState, updateAssetScrollDisplay]);

  const handleSelect = useCallback(
    (wallet: WalletAccount, state: InputState) => {
      if (state === InputState.CLOSE_SELECT_SCROLL_PANEL) {
        console.debug('✅ [RecipientSelectScrollPanel] selected wallet', wallet);
      }
    },
    []
  );

  return (
    <AssetSelectScrollContainer
      title="Select a Recipient"
    />
  );
}
