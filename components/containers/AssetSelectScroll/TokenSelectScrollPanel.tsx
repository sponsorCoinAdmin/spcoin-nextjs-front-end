'use client';

import { useEffect } from 'react';
import {
  CONTAINER_TYPE,
  InputState,
  SP_COIN_DISPLAY,
  getInputStateString,
} from '@/lib/structure';
import AssetSelectScrollContainer from './AssetSelectScrollContainer';
import { useBaseSelectShared } from '@/lib/hooks/useBaseSelectShared';
import { useDisplayControls } from '@/lib/context/hooks';
import { createDebugLogger } from '@/lib/utils/debugLogger';

const LOG_TIME = false;
const DEBUG_ENABLED = process.env.NEXT_PUBLIC_DEBUG_LOG_SCROLL_PANEL_CONTEXT === 'true';
const debugLog = createDebugLogger('TokenSelectScrollPanel', DEBUG_ENABLED, LOG_TIME);

export default function TokenSelectScrollPanel() {
  const sharedState = useBaseSelectShared();
  const { inputState, setInputState, containerType } = sharedState;
  const { assetSelectScrollDisplay, updateAssetScrollDisplay } = useDisplayControls();

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

    if (inputState === InputState.CLOSE_SELECT_INPUT) {
      debugLog.log(`✅ CLOSE_SELECT_INPUT triggered, calling updateAssetScrollDisplay → EXCHANGE_ROOT`);
      updateAssetScrollDisplay(SP_COIN_DISPLAY.EXCHANGE_ROOT);

      // ✅ Prevent infinite loop by resetting inputState
      setInputState(InputState.EMPTY_INPUT);
    }
  }, [inputState, updateAssetScrollDisplay, setInputState]);

  return (
    <>
      {assetSelectScrollDisplay === SP_COIN_DISPLAY.DISPLAY_ON && (
        <AssetSelectScrollContainer title={title} />
      )}
    </>
  );
}
