'use client';

import { useEffect } from 'react';
import {
  CONTAINER_TYPE,
  InputState,
  getInputStateString,
  SP_COIN_DISPLAY, // ✅ optionally can be removed if unused elsewhere
} from '@/lib/structure';
import AssetSelectScrollPanel from './AssetSelectScrollPanel';
import { useSharedPanelContext } from '@/lib/context/ScrollSelectPanels/useSharedPanelContext';
import { useDisplayControls } from '@/lib/context/hooks';
import { createDebugLogger } from '@/lib/utils/debugLogger';

const LOG_TIME = false;
const DEBUG_ENABLED = process.env.NEXT_PUBLIC_DEBUG_LOG_SCROLL_PANEL_CONTEXT === 'true';
const debugLog = createDebugLogger('TokenSelectScrollPanel', DEBUG_ENABLED, LOG_TIME);

export default function TokenSelectScrollPanel() {
  const { inputState, setInputState, containerType } = useSharedPanelContext();
  const { updateActiveDisplay } = useDisplayControls(); // ✅ renamed to match new system

  const title =
    containerType === CONTAINER_TYPE.SELL_SELECT_CONTAINER
      ? 'Select a Token to Sell'
      : 'Select a Token to Buy';

  useEffect(() => {
    debugLog.log(`🧩 TokenSelectScrollPanel mounted for containerType=${containerType}`);
  }, [containerType]);

  useEffect(() => {
    const stateStr = getInputStateString(inputState);
    debugLog.log(`🌀 inputState changed → ${stateStr}`);

    if (inputState === InputState.CLOSE_SELECT_SCROLL_PANEL) {
      debugLog.log(`✅ CLOSE_SELECT_SCROLL_PANEL triggered, calling updateActiveDisplay → TRADING_STATION_PANEL`);
      updateActiveDisplay(SP_COIN_DISPLAY.TRADING_STATION_PANEL); // ✅ switch only activeDisplay

      // ✅ Prevent infinite loop by resetting inputState
      setInputState(InputState.EMPTY_INPUT);
    }
  }, [inputState, updateActiveDisplay, setInputState]);

  return (
    <AssetSelectScrollPanel title={title} />
  );
}
