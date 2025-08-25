// File: components/containers/RecipientSelectPanel.tsx
'use client';

import { useEffect, useCallback } from 'react';
import { WalletAccount, SP_COIN_DISPLAY } from '@/lib/structure';

import AssetSelectPanel from './AssetSelectPanel';
import { useAssetSelectContext } from '@/lib/context/AssetSelectPanels/useAssetSelectContext';
import { useActiveDisplay } from '@/lib/context/hooks';
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
  const { activeDisplay } = useActiveDisplay();

  // adapt parent close callback to provider's (fromUser:boolean) signature
  const closeForProvider = useCallback(
    (_fromUser: boolean) => {
      closePanelCallback();
    },
    [closePanelCallback]
  );

  if (!isActive) {
    debugLog.log(`⏭️ RecipientSelectPanel → not active, skipping render`);
    return null;
  }

  debugLog.log(`🧩 RecipientSelectPanel → showPanelDisplay=RecipientSelectPanel`);

  return (
    <AssetSelectProvider
      closePanelCallback={closeForProvider}
      setTradingTokenCallback={setTradingTokenCallback as any} // WalletAccount is OK; provider accepts TokenContract | WalletAccount
      containerType={activeDisplay as SP_COIN_DISPLAY}
    >
      <RecipientSelectPanelInner />
    </AssetSelectProvider>
  );
}

function RecipientSelectPanelInner() {
  const { instanceId, containerType } = useAssetSelectContext();

  useEffect(() => {
    debugLog.log(
      `🧩 RecipientSelectPanel mounted for containerType=${containerType}, instanceId=${instanceId}`
    );
  }, [containerType, instanceId]);

  return <AssetSelectPanel />;
}
