'use client';

import { useEffect } from 'react';
import {
  CONTAINER_TYPE,
  InputState,
  SP_COIN_DISPLAY,
  FEED_TYPE,
  getInputStateString,
} from '@/lib/structure';
import AssetSelectScrollContainer from './AssetSelectScrollContainer';
import { useBaseSelectShared } from '@/lib/hooks/useBaseSelectShared';
import { useDisplayControls } from '@/lib/context/hooks';
import { useSharedPanelContext } from '@/lib/context/ScrollSelectPanel/SharedPanelContext';
import { createDebugLogger } from '@/lib/utils/debugLogger';

const LOG_TIME = false;
const DEBUG_ENABLED = process.env.NEXT_PUBLIC_DEBUG_LOG_SCROLL_PANEL_CONTEXT === 'true';
const debugLog = createDebugLogger('TokenSelectScrollPanel', DEBUG_ENABLED, LOG_TIME);

export default function TokenSelectScrollPanel() {
  const sharedState = useBaseSelectShared();
  const {
    inputState,
    setInputState,
    containerType,
    instanceId,
  } = sharedState;

  const { activePanelFeed } = useSharedPanelContext();
  const { assetSelectScrollDisplay, updateAssetScrollDisplay } = useDisplayControls();

  const title =
    containerType === CONTAINER_TYPE.SELL_SELECT_CONTAINER
      ? 'Select a Token to Sell'
      : 'Select a Token to Buy';

  useEffect(() => {
    debugLog.log(`🧩 [${instanceId}] TokenSelectScrollPanel mounted for containerType=${containerType}`);
  }, [containerType, instanceId]);

  useEffect(() => {
    const stateStr = getInputStateString(inputState);
    debugLog.log(`🌀 [${instanceId}] inputState changed → ${stateStr}`);

    if (inputState === InputState.CLOSE_SELECT_INPUT) {
      debugLog.log(`✅ [${instanceId}] CLOSE_SELECT_INPUT triggered → updateAssetScrollDisplay(EXCHANGE_ROOT)`);
      updateAssetScrollDisplay(SP_COIN_DISPLAY.EXCHANGE_ROOT);
      setInputState(InputState.EMPTY_INPUT);
    }
  }, [inputState, updateAssetScrollDisplay, setInputState, instanceId]);

  useEffect(() => {
    debugLog.log(`📡 [${instanceId}] activePanelFeed = ${activePanelFeed}`);
  }, [activePanelFeed, instanceId]);

  const shouldRender = assetSelectScrollDisplay === SP_COIN_DISPLAY.DISPLAY_ON && activePanelFeed === FEED_TYPE.TOKEN_LIST;

  return <>{shouldRender && <AssetSelectScrollContainer title={title} />}</>;
}
