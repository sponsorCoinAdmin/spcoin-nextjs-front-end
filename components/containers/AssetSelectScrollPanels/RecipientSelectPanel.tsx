// File: components/containers/RecipientSelectPanel.tsx

'use client';

import { useCallback, useEffect } from 'react';
import {
  InputState,
  WalletAccount,
  SP_COIN_DISPLAY,
} from '@/lib/structure';

import AssetSelectPanel from './AssetSelectPanel';
import { useSharedPanelContext } from '@/lib/context/ScrollSelectPanels/useSharedPanelContext';
import { useActiveDisplay } from '@/lib/context/hooks';
import { createDebugLogger } from '@/lib/utils/debugLogger';

const LOG_TIME = false;
const DEBUG_ENABLED =
  process.env.NEXT_PUBLIC_DEBUG_LOG_SCROLL_PANEL_CONTEXT === 'true';
const debugLog = createDebugLogger('RecipientSelectPanel', DEBUG_ENABLED, LOG_TIME);

export default function RecipientSelectPanel() {
  const { inputState, setInputState, containerType, instanceId } = useSharedPanelContext();
  const { activeDisplay, setActiveDisplay } = useActiveDisplay();

  // ✅ Skip render if this panel is not active
  if (activeDisplay !== SP_COIN_DISPLAY.RECIPIENT_SELECT_PANEL) {
    debugLog.log(`⏭️ RecipientSelectPanel → not active (instanceId=${instanceId}), skipping render`);
    return null;
  }

  useEffect(() => {
    debugLog.log(`🧩 RecipientSelectPanel mounted for containerType=${containerType}, instanceId=${instanceId}`);
  }, [containerType, instanceId]);

  return <AssetSelectPanel />;
}
