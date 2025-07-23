// File: components/containers/AssetSelectPanels/TokenSelectPanel.tsx

'use client';

import { useEffect } from 'react';
import {
  InputState,
  getInputStateString,
  TokenContract,
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

  useEffect(() => {
    const stateStr = getInputStateString(inputState);
    debugLog.log(`🌀 inputState changed → ${stateStr} (instanceId=${instanceId})`);

    if (inputState === InputState.CLOSE_SELECT_PANEL) {
      debugLog.log(
        `✅ CLOSE_SELECT_PANEL triggered → calling closeCallback and resetting input (instanceId=${instanceId})`
      );
      closeCallback?.(); // ✅ call from context, safe with optional chaining
      setInputState(InputState.EMPTY_INPUT); // ✅ prevent loop
    }
  }, [inputState, setInputState, instanceId, closeCallback]);

  return (
    <AssetSelectPanel
      // ✅ no props needed; AssetSelectPanel can now pull directly from context if needed
      // closeCallback={closeCallback}
      // setTradingTokenCallback={setTradingTokenCallback}
    />
  );
}
