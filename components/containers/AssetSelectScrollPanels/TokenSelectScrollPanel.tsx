// File: components/containers/AssetSelectScrollPanels/TokenSelectScrollPanel.tsx

'use client';

import { useEffect } from 'react';
import {
  InputState,
  getInputStateString,
  SP_COIN_DISPLAY,
} from '@/lib/structure';
import AssetSelectScrollPanel from './AssetSelectScrollPanel';
import { useSharedPanelContext } from '@/lib/context/ScrollSelectPanels/useSharedPanelContext';
import { useActiveDisplay } from '@/lib/context/hooks';
import { createDebugLogger } from '@/lib/utils/debugLogger';
import { SharedPanelProvider } from '@/lib/context/ScrollSelectPanels/SharedPanelProvider';
import TradeContainerHeader from '@/components/Headers/TradeContainerHeader';

const LOG_TIME:boolean = false;
const DEBUG_ENABLED = process.env.NEXT_PUBLIC_DEBUG_LOG_SCROLL_PANEL_CONTEXT === 'true';
const debugLog = createDebugLogger('TokenSelectScrollPanel', DEBUG_ENABLED, LOG_TIME);


interface TokenSelectScrollPanelProps {
  containerType: SP_COIN_DISPLAY;
}

export default function TokenSelectScrollPanel({ containerType }: TokenSelectScrollPanelProps) {
  const { activeDisplay } = useActiveDisplay();
  const isActive = activeDisplay === SP_COIN_DISPLAY.SHOW_TOKEN_SCROLL_PANEL;

  if (!isActive) return null;

  const title =
    containerType === SP_COIN_DISPLAY.SELL_SELECT_CONTAINER
      ? 'Select a Token to Sell'
      : 'Select a Token to Buy';

      alert (`containerType(${containerType}) = ${SP_COIN_DISPLAY[containerType]}`)
      alert (`title = ${title})`)

  return (
    <SharedPanelProvider>
      <TradeContainerHeader title={title} />
      <TokenSelectScrollPanelInner title={title}/>
    </SharedPanelProvider>
  );
}

interface Props {
  title: string;
}

function TokenSelectScrollPanelInner({ title }: Props) {
  const { inputState, setInputState, instanceId } = useSharedPanelContext();
  const { updateActiveDisplay } = useActiveDisplay();

  useEffect(() => {
    debugLog.log(`🧩 TokenSelectScrollPanel mounted → instanceId=${instanceId}`);
  }, [instanceId]);

  useEffect(() => {
    const stateStr = getInputStateString(inputState);
    debugLog.log(`🌀 inputState changed → ${stateStr} (instanceId=${instanceId})`);

    if (inputState === InputState.CLOSE_SELECT_SCROLL_PANEL) {
      debugLog.log(
        `✅ CLOSE_SELECT_SCROLL_PANEL triggered → setting activeDisplay to SHOW_TRADING_STATION_PANEL (instanceId=${instanceId})`
      );
      updateActiveDisplay(SP_COIN_DISPLAY.SHOW_TRADING_STATION_PANEL);
      setInputState(InputState.EMPTY_INPUT); // ✅ prevent loop
    }
  }, [inputState, updateActiveDisplay, setInputState, instanceId]);

  return <AssetSelectScrollPanel title={title} />;
}
