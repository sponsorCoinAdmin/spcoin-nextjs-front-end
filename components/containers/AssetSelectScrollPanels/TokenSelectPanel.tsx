// File: components/containers/AssetSelectPanels/TokenSelectPanel.tsx
'use client';

import { useEffect } from 'react';
import { Address } from 'viem';
import { TokenContract, SP_COIN_DISPLAY } from '@/lib/structure';

import AssetSelectPanel from './AssetSelectPanel';
import { useSharedPanelContext } from '@/lib/context/ScrollSelectPanels/useSharedPanelContext';
import { useActiveDisplay } from '@/lib/context/hooks';
import { createDebugLogger } from '@/lib/utils/debugLogger';
import { SharedPanelProvider } from '@/lib/context/ScrollSelectPanels/SharedPanelProvider';
import type { SharedPanelBag } from '@/lib/context/ScrollSelectPanels/structure/types/panelBag';

const LOG_TIME = false;
const DEBUG_ENABLED = process.env.NEXT_PUBLIC_DEBUG_LOG_SCROLL_PANEL_CONTEXT === 'true';
const debugLog = createDebugLogger('TokenSelectPanel', DEBUG_ENABLED, LOG_TIME);

interface TokenSelectPanelProps {
  isActive: boolean;
  closePanelCallback: () => void;
  setTradingTokenCallback: (token: TokenContract) => void;

  /** Opposing side’s committed address (optional). BUY panel gets SELL’s addr; SELL panel gets BUY’s addr. */
  peerAddress?: string | Address;
}

export default function TokenSelectPanel({
  isActive,
  closePanelCallback,
  setTradingTokenCallback,
  peerAddress,
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

  // Build a typed initial panel bag for token select panels
  const initialPanelBag: SharedPanelBag = {
    type: activeDisplay as SP_COIN_DISPLAY,
    ...(peerAddress ? { peerAddress } : {}),
  } as SharedPanelBag;

  return (
    <SharedPanelProvider
      closePanelCallback={closePanelCallback}
      setTradingTokenCallback={setTradingTokenCallback}
      containerType={activeDisplay as SP_COIN_DISPLAY}
      /** 👇 namespaced, typed payload used by token select flow */
      initialPanelBag={initialPanelBag}
    >
      <TokenSelectPanelInner />
    </SharedPanelProvider>
  );
}

function TokenSelectPanelInner() {
  const { instanceId } = useSharedPanelContext();

  useEffect(() => {
    debugLog.log(`🟢 TokenSelectPanelInner mounted → instanceId=${instanceId}`);
    return () => {
      debugLog.log(`🔴 TokenSelectPanelInner unmounted → instanceId=${instanceId}`);
    };
  }, [instanceId]);

  return <AssetSelectPanel />;
}
