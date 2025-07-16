// File Name: components/containers/AssetSelectScrollPanels/TokenSelectScrollPanel.tsx
// Description: Token Select Scroll Panel
// Author: Robin
// Date: 2023-09-05
// Version: 1.0.0
// Copyright: SP Coin
// License: MIT

'use client';

import { useEffect } from 'react';
import {
  CONTAINER_TYPE,
  InputState,
  SP_COIN_DISPLAY,
  getInputStateString,
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
  debugLog.log(`✅ useSharedPanelContext → inputState=${getInputStateString(inputState)}, containerType=${containerType}`);

  const { assetSelectScrollDisplay, updateAssetScrollDisplay } = useDisplayControls();
  debugLog.log(`✅ useDisplayControls → assetSelectScrollDisplay=${assetSelectScrollDisplay} (${SP_COIN_DISPLAY[assetSelectScrollDisplay] || 'UNKNOWN'})`);

  if (assetSelectScrollDisplay === SP_COIN_DISPLAY.SHOW_TOKEN_SCROLL_CONTAINER) {
    debugLog.log('✅ Rendering AssetSelectScrollPanel (SHOW_TOKEN_SCROLL_CONTAINER)');
  } else {
    debugLog.log(`⏳ AssetSelectScrollPanel NOT rendered, assetSelectScrollDisplay=${assetSelectScrollDisplay} (${SP_COIN_DISPLAY[assetSelectScrollDisplay] || 'UNKNOWN'})`);
  }

  const title =
    containerType === CONTAINER_TYPE.SELL_SELECT_CONTAINER
      ? 'Select a Token to Sell'
      : 'Select a Token to Buy';
  debugLog.log(`✅ Computed title → ${title}`);

  useEffect(() => {
    debugLog.log(`🧩 TokenSelectScrollPanel mounted → containerType=${containerType}`);
  }, [containerType]);

  useEffect(() => {
    const stateStr = getInputStateString(inputState);
    debugLog.log(`🌀 inputState changed → ${stateStr}`);

    if (inputState === InputState.CLOSE_SELECT_SCROLL_PANEL) {
      debugLog.log(`✅ CLOSE_SELECT_SCROLL_PANEL triggered → setting assetSelectScrollDisplay to TRADING_STATION_PANEL`);
      updateAssetScrollDisplay(SP_COIN_DISPLAY.TRADING_STATION_PANEL);

      // ✅ Prevent infinite loop by resetting inputState
      setInputState(InputState.EMPTY_INPUT);
      debugLog.log(`✅ inputState reset to EMPTY_INPUT after CLOSE_SELECT_SCROLL_PANEL`);
    }
  }, [inputState, updateAssetScrollDisplay, setInputState]);

  return (
    <>
      {assetSelectScrollDisplay === SP_COIN_DISPLAY.SHOW_TOKEN_SCROLL_CONTAINER && (
        <AssetSelectScrollPanel title={title} />
      )}
    </>
  );
}
