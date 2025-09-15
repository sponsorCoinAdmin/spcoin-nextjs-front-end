// File: components/containers/AssetSelectPanels/AgentSelectPanel.tsx
'use client';

import { useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { WalletAccount, SP_COIN_DISPLAY } from '@/lib/structure';
import { createDebugLogger } from '@/lib/utils/debugLogger';

// Panels variant (correct location)
import { AssetSelectProvider } from '@/lib/context/AssetSelectPanels/AssetSelectProvider';
import { useAssetSelectContext } from '@/lib/context/AssetSelectPanels/useAssetSelectContext';

const LOG_TIME = false;
const DEBUG_ENABLED =
  process.env.NEXT_PUBLIC_DEBUG_LOG_SCROLL_PANEL_CONTEXT === 'true';
const debugLog = createDebugLogger('AgentSelectPanel', DEBUG_ENABLED, LOG_TIME);

interface AgentSelectPanelProps {
  isActive: boolean;
  closePanelCallback: () => void;
  setTradingTokenCallback: (wallet: WalletAccount) => void;
}

// ✅ Explicitly declare the dynamic component has **no props**
const AssetSelectContent = dynamic<{}>(() => import('./AssetSelectPanel'), {
  ssr: false,
  loading: () => null,
});

export default function AgentSelectPanel({
  isActive,
  closePanelCallback,
  setTradingTokenCallback,
}: AgentSelectPanelProps) {
  const containerType = SP_COIN_DISPLAY.AGENT_SELECT_CONFIG_PANEL;

  // Adapt parent close callback to provider's (fromUser:boolean) signature
  const closeForProvider = useCallback(
    (_fromUser: boolean) => {
      closePanelCallback();
    },
    [closePanelCallback]
  );

  if (!isActive) {
    debugLog.log('⏭️ AgentSelectPanel → not active, skipping render');
    return null;
  }

  debugLog.log('🧩 AgentSelectPanel → render with AssetSelectProvider', {
    containerType: SP_COIN_DISPLAY[containerType],
  });

  return (
    <AssetSelectProvider
      closePanelCallback={closeForProvider}
      // Provider accepts TokenContract | WalletAccount; WalletAccount is fine
      setTradingTokenCallback={setTradingTokenCallback as any}
      containerType={containerType}
    >
      <AgentSelectPanelInner />
    </AssetSelectProvider>
  );
}

function AgentSelectPanelInner() {
  const { instanceId, containerType } = useAssetSelectContext();

  useEffect(() => {
    debugLog.log(
      `🧩 AgentSelectPanel mounted → containerType=${SP_COIN_DISPLAY[containerType]}, instanceId=${instanceId}`
    );
  }, [containerType, instanceId]);

  // Render the shared asset select UI (dynamically imported)
  return <AssetSelectContent />;
}
