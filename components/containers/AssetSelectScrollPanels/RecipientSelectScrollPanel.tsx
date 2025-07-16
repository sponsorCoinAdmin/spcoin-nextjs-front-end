// File: components/containers/RecipientSelectScrollPanel.tsx

'use client';

import { useCallback, useEffect } from 'react';
import {
  FEED_TYPE,
  InputState,
  WalletAccount,
  SP_COIN_DISPLAY,
} from '@/lib/structure';

import AssetSelectScrollPanel from './AssetSelectScrollPanel';
import { useSharedPanelContext } from '@/lib/context/ScrollSelectPanels/useSharedPanelContext';
import { useDisplayControls } from '@/lib/context/hooks';

export default function RecipientSelectScrollPanel() {
  const { inputState, setInputState, containerType } = useSharedPanelContext();
  const { updateActiveDisplay } = useDisplayControls(); // ✅ switched to updateActiveDisplay

  useEffect(() => {
    if (inputState === InputState.CLOSE_SELECT_SCROLL_PANEL) {
      updateActiveDisplay(SP_COIN_DISPLAY.TRADING_STATION_PANEL); // ✅ fallback when closing
    }
  }, [inputState, updateActiveDisplay]);

  const handleSelect = useCallback(
    (wallet: WalletAccount, state: InputState) => {
      if (state === InputState.CLOSE_SELECT_SCROLL_PANEL) {
        console.debug('✅ [RecipientSelectScrollPanel] selected wallet', wallet);
      }
    },
    []
  );

  return (
    <AssetSelectScrollPanel title="Select a Recipient" />
  );
}
