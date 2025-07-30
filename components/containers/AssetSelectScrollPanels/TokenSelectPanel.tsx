'use client';

import { useEffect } from 'react';
import {
  InputState,
  getInputStateString,
  TokenContract,
  SP_COIN_DISPLAY,
} from '@/lib/structure';

import AssetSelectPanel from './AssetSelectPanel';
import { useSharedPanelContext } from '@/lib/context/ScrollSelectPanels/useSharedPanelContext';
import { useActiveDisplay } from '@/lib/context/hooks';
import { createDebugLogger } from '@/lib/utils/debugLogger';
import { SharedPanelProvider } from '@/lib/context/ScrollSelectPanels/SharedPanelProvider';

const LOG_TIME: boolean = false;
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

  if (!isActive) return null;

  debugLog.log(`🧩 TokenSelectPanel → showPanelDisplay=TokenSelectPanel`);

  return (
    <SharedPanelProvider
      closeCallback={closeCallback}
      setTradingTokenCallback={setTradingTokenCallback}
      containerType={activeDisplay} // ✅ Pass the actual active container type
    >
      <TokenSelectPanelInner />
    </SharedPanelProvider>
  );
}

function TokenSelectPanelInner() {
  const { inputState, setInputState, instanceId, closeCallback, setTradingTokenCallback } =
    useSharedPanelContext();

  useEffect(() => {
    debugLog.log(`🧩 TokenSelectPanel mounted → instanceId=${instanceId}`);
  }, [instanceId]);

  return (
    <AssetSelectPanel />
  );
}
