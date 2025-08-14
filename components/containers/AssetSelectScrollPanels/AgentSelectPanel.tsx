// File: components/containers/AgentSelectPanel.tsx
'use client';

import { useEffect } from 'react';
import {
  SP_COIN_DISPLAY,
  WalletAccount,
} from '@/lib/structure';

import AssetSelectPanel from './AssetSelectPanel';
import { useAssetSelectionContext } from '@/lib/context/ScrollSelectPanels/useAssetSelectionlContext';
import { useActiveDisplay } from '@/lib/context/hooks';
import { createDebugLogger } from '@/lib/utils/debugLogger';
import { AssetSelectionProvider } from '@/lib/context/ScrollSelectPanels/AssetSelectionProvider';

const LOG_TIME = false;
const DEBUG_ENABLED =
  process.env.NEXT_PUBLIC_DEBUG_LOG_SCROLL_PANEL_CONTEXT === 'true';
const debugLog = createDebugLogger('AgentSelectPanel', DEBUG_ENABLED, LOG_TIME);

interface AgentSelectPanelProps {
  isActive: boolean;
  closePanelCallback: () => void;
  setTradingTokenCallback: (wallet: WalletAccount) => void;
}

export default function AgentSelectPanel({
  isActive,
  closePanelCallback,
  setTradingTokenCallback,
}: AgentSelectPanelProps) {
  const { activeDisplay } = useActiveDisplay();

  if (!isActive) {
    debugLog.log(`⏭️ AgentSelectPanel → not active, skipping render`);
    return null;
  }

  debugLog.log(`🧩 AgentSelectPanel → showPanelDisplay=AgentSelectPanel`);

  return (
    <AssetSelectionProvider
      closePanelCallback={closePanelCallback}
      setTradingTokenCallback={setTradingTokenCallback as any} // ⛳ Temporary cast until generics are introduced
      containerType={activeDisplay}
    >
      <AgentSelectPanelInner />
    </AssetSelectionProvider>
  );
}

function AgentSelectPanelInner() {
  const { containerType, instanceId } = useAssetSelectionContext();

  useEffect(() => {
    debugLog.log(`🧩 AgentSelectPanel mounted for containerType=${containerType}, instanceId=${instanceId}`);
  }, [containerType, instanceId]);

  return <AssetSelectPanel />;
}
