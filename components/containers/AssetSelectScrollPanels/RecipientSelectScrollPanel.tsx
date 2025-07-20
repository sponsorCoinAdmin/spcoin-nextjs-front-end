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
import { useActiveDisplay } from '@/lib/context/hooks';
import { createDebugLogger } from '@/lib/utils/debugLogger';

const LOG_TIME = false;
const DEBUG_ENABLED =
  process.env.NEXT_PUBLIC_DEBUG_LOG_SCROLL_PANEL_CONTEXT === 'true';
const debugLog = createDebugLogger('RecipientSelectScrollPanel', DEBUG_ENABLED, LOG_TIME);

export default function RecipientSelectScrollPanel() {
  const { inputState, setInputState, containerType, instanceId } = useSharedPanelContext();
  const { activeDisplay, setActiveDisplay } = useActiveDisplay();

  // ✅ Skip render if this panel is not active
  if (activeDisplay !== SP_COIN_DISPLAY.RECIPIENT_SCROLL_PANEL) {
    debugLog.log(`⏭️ RecipientSelectScrollPanel → not active (instanceId=${instanceId}), skipping render`);
    return null;
  }

  useEffect(() => {
    debugLog.log(`🧩 RecipientSelectScrollPanel mounted for containerType=${containerType}, instanceId=${instanceId}`);
  }, [containerType, instanceId]);


  const handleSelect = useCallback(
    (wallet: WalletAccount, state: InputState) => {
      if (state === InputState.CLOSE_SELECT_SCROLL_PANEL) {
        debugLog.log(`✅ [RecipientSelectScrollPanel] selected wallet`, wallet, `(instanceId=${instanceId})`);
      }
    },
    [instanceId]
  );

  return <AssetSelectScrollPanel title="Select a Recipient" />;
}
