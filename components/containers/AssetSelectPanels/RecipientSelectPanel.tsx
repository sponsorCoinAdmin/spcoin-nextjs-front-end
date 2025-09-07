// File: components/containers/RecipientSelectPanel.tsx
'use client';

import { useEffect, useCallback } from 'react';
import { WalletAccount, SP_COIN_DISPLAY } from '@/lib/structure';

import AssetSelectPanel from './AssetSelectPanel';
import { useAssetSelectContext } from '@/lib/context/AssetSelectPanels/useAssetSelectContext';
import { createDebugLogger } from '@/lib/utils/debugLogger';
import { AssetSelectProvider } from '@/lib/context/AssetSelectPanels/AssetSelectProvider';

const LOG_TIME = false;
const DEBUG_ENABLED =
  process.env.NEXT_PUBLIC_DEBUG_LOG_SCROLL_PANEL_CONTEXT === 'true';
const debugLog = createDebugLogger('RecipientSelectPanel', DEBUG_ENABLED, LOG_TIME);

interface RecipientSelectPanelProps {
  isActive: boolean;
  closePanelCallback: () => void;
  setTradingTokenCallback: (wallet: WalletAccount) => void;
}

export default function RecipientSelectPanel({
  isActive,
  closePanelCallback,
  setTradingTokenCallback,
}: RecipientSelectPanelProps) {
  // This panel should always advertise itself explicitly as the RECIPIENT panel.
  const containerType = SP_COIN_DISPLAY.RECIPIENT_SELECT_PANEL;

  // Adapt parent close callback to provider's (fromUser: boolean) signature
  const closeForProvider = useCallback(
    (_fromUser: boolean) => {
      closePanelCallback();
    },
    [closePanelCallback]
  );

  if (!isActive) {
    DEBUG_ENABLED && debugLog.log(`⏭️ RecipientSelectPanel → not active, skipping render`);
    return null;
  }

  DEBUG_ENABLED &&
    debugLog.log(`🧩 RecipientSelectPanel → activating (containerType=${containerType})`);

  return (
    <AssetSelectProvider
      closePanelCallback={closeForProvider}
      // Provider accepts TokenContract | WalletAccount; WalletAccount is valid here.
      setTradingTokenCallback={setTradingTokenCallback as any}
      containerType={containerType}
    >
      <RecipientSelectPanelInner />
    </AssetSelectProvider>
  );
}

function RecipientSelectPanelInner() {
  const { instanceId, containerType } = useAssetSelectContext();

  useEffect(() => {
    DEBUG_ENABLED &&
      debugLog.log(
        `🧩 RecipientSelectPanel mounted → containerType=${containerType}, instanceId=${instanceId}`
      );
  }, [containerType, instanceId]);

  return <AssetSelectPanel />;
}
