// File: components/containers/AssetSelectPanels/TokenSelectPanel.tsx
'use client';

import { useEffect } from 'react';
import {
  TokenContract,
  SP_COIN_DISPLAY,
} from '@/lib/structure';

import AssetSelectPanel from './AssetSelectPanel';
import { useSharedPanelContext } from '@/lib/context/ScrollSelectPanels/useSharedPanelContext';
import { useActiveDisplay } from '@/lib/context/hooks';
import { createDebugLogger } from '@/lib/utils/debugLogger';
import { SharedPanelProvider } from '@/lib/context/ScrollSelectPanels/SharedPanelProvider';

const LOG_TIME = false;
const DEBUG_ENABLED = process.env.NEXT_PUBLIC_DEBUG_LOG_SCROLL_PANEL_CONTEXT === 'true';
const debugLog = createDebugLogger('TokenSelectPanel', DEBUG_ENABLED, LOG_TIME);

interface TokenSelectPanelProps {
  isActive: boolean;
  closeCallback: () => void;
  setTradingTokenCallback: (token: TokenContract) => void;
}

export default function TokenSelectPanel({
  isActive,
  closeCallback,
  setTradingTokenCallback,
}: TokenSelectPanelProps) {
  const { activeDisplay } = useActiveDisplay();

  useEffect(() => {
    debugLog.log(`🟢 TokenSelectPanel mounted`);
    return () => {
      debugLog.log(`🔴 TokenSelectPanel unmounted`);
    };
  }, []);

  if (!isActive) return null;

  debugLog.log(`🧩 TokenSelectPanel → showPanelDisplay=TokenSelectPanel`);
  // alert(`🧩 TokenSelectPanel → showPanelDisplay=TokenSelectPanel`);

  return (
    <SharedPanelProvider
      closeCallback={closeCallback}
      setTradingTokenCallback={setTradingTokenCallback}
      containerType={activeDisplay as SP_COIN_DISPLAY} // Ensure valid enum
    >
      <TokenSelectPanelInner />
    </SharedPanelProvider>
  );
}

function TokenSelectPanelInner() {
  const {
    inputState,
    instanceId,
  } = useSharedPanelContext();

  useEffect(() => {
    debugLog.log(`🟢 TokenSelectPanelInner mounted → instanceId=${instanceId}`);
    return () => {
      debugLog.log(`🔴 TokenSelectPanelInner unmounted → instanceId=${instanceId}`);
    };
  }, [instanceId]);

  return <AssetSelectPanel />;
}
