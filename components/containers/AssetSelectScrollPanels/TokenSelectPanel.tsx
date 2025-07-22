// File: components/containers/AssetSelectScrollPanels/TokenSelectPanel.tsx

'use client';

import { useEffect } from 'react';
import {
  InputState,
  getInputStateString,
  TokenContract,
} from '@/lib/structure';
import AssetSelectScrollPanel from './AssetSelectScrollPanel';
import { useSharedPanelContext } from '@/lib/context/ScrollSelectPanels/useSharedPanelContext';
import { useActiveDisplay } from '@/lib/context/hooks';
import { createDebugLogger } from '@/lib/utils/debugLogger';
import { SharedPanelProvider } from '@/lib/context/ScrollSelectPanels/SharedPanelProvider';

const LOG_TIME: boolean = false;
const DEBUG_ENABLED = process.env.NEXT_PUBLIC_DEBUG_LOG_SCROLL_PANEL_CONTEXT === 'true';
const debugLog = createDebugLogger('TokenSelectPanel', DEBUG_ENABLED, LOG_TIME);

interface TokenSelectPanelProps {
  isActive: boolean;
  closeCallback: (fromUser: boolean) => void;
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
    <SharedPanelProvider>
      <TokenSelectScrollPanelInner
        closeCallback={closeCallback}
        setTradingTokenCallback={setTradingTokenCallback}
      />
    </SharedPanelProvider>
  );
}

interface TokenSelectScrollPanelInnerProps {
  closeCallback: (fromUser: boolean) => void;
  setTradingTokenCallback: (token: TokenContract) => void;
}

function TokenSelectScrollPanelInner({
  closeCallback,
  setTradingTokenCallback,
}: TokenSelectScrollPanelInnerProps) {
  const { inputState, setInputState, instanceId } = useSharedPanelContext();

  useEffect(() => {
    debugLog.log(`🧩 TokenSelectPanel mounted → instanceId=${instanceId}`);
  }, [instanceId]);

  useEffect(() => {
    const stateStr = getInputStateString(inputState);
    debugLog.log(`🌀 inputState changed → ${stateStr} (instanceId=${instanceId})`);

    if (inputState === InputState.CLOSE_SELECT_SCROLL_PANEL) {
      debugLog.log(
        `✅ CLOSE_SELECT_SCROLL_PANEL triggered → calling closeCallback and resetting input (instanceId=${instanceId})`
      );
      closeCallback(true);
      setInputState(InputState.EMPTY_INPUT); // ✅ prevent loop
    }
  }, [inputState, setInputState, instanceId, closeCallback]);

  return (
    <AssetSelectScrollPanel
      // closeCallback={closeCallback}
      // setTradingTokenCallback={setTradingTokenCallback}
    />
  );
}
