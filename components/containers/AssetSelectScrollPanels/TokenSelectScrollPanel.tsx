// File: components/containers/AssetSelectScrollPanels/TokenSelectScrollPanel.tsx

'use client';

import { useEffect } from 'react';
import {
  InputState,
  SP_COIN_DISPLAY,
  getInputStateString,
} from '@/lib/structure';
import AssetSelectScrollPanel from './AssetSelectScrollPanel';
import { useSharedPanelContext } from '@/lib/context/ScrollSelectPanels/useSharedPanelContext';
import { useActiveDisplay } from '@/lib/context/hooks';
import { createDebugLogger } from '@/lib/utils/debugLogger';
import { SharedPanelProvider } from '@/lib/context/ScrollSelectPanels/SharedPanelProvider';
import TradeContainerHeader from '@/components/Headers/TradeContainerHeader';

const LOG_TIME: boolean = false;
const DEBUG_ENABLED = process.env.NEXT_PUBLIC_DEBUG_LOG_SCROLL_PANEL_CONTEXT === 'true';
const debugLog = createDebugLogger('TokenSelectScrollPanel', DEBUG_ENABLED, LOG_TIME);

interface TokenSelectScrollPanelProps {
  containerType: SP_COIN_DISPLAY;
}

export default function TokenSelectScrollPanel({ containerType }: TokenSelectScrollPanelProps) {
  const { activeDisplay } = useActiveDisplay();
  const isActive =
    activeDisplay === SP_COIN_DISPLAY.SELL_SELECT_SCROLL_PANEL ||
    activeDisplay === SP_COIN_DISPLAY.BUY_SELECT_SCROLL_PANEL;

  if (!isActive) return null;

  debugLog.log(`🧩 containerType(${containerType}) = ${SP_COIN_DISPLAY[containerType]}`);

  return (
    <SharedPanelProvider>
      <TokenSelectScrollPanelInner />
    </SharedPanelProvider>
  );
}

function TokenSelectScrollPanelInner() {
  const { inputState, setInputState, instanceId } = useSharedPanelContext();
  const { setActiveDisplay } = useActiveDisplay();

  useEffect(() => {
    debugLog.log(`🧩 TokenSelectScrollPanel mounted → instanceId=${instanceId}`);
  }, [instanceId]);

  useEffect(() => {
    const stateStr = getInputStateString(inputState);
    debugLog.log(`🌀 inputState changed → ${stateStr} (instanceId=${instanceId})`);

    if (inputState === InputState.CLOSE_SELECT_SCROLL_PANEL) {
      debugLog.log(
        `✅ CLOSE_SELECT_SCROLL_PANEL triggered → setting activeDisplay to TRADING_STATION_PANEL (instanceId=${instanceId})`
      );
      setActiveDisplay(SP_COIN_DISPLAY.TRADING_STATION_PANEL);
      setInputState(InputState.EMPTY_INPUT); // ✅ prevent loop
    }
  }, [inputState, setActiveDisplay, setInputState, instanceId]);

  return <AssetSelectScrollPanel title={"ToDo Implement"}/>;
}
