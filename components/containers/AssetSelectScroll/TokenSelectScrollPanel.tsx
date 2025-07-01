// File: components/containers/TokenSelectScrollPanel.tsx
'use client';

import { useCallback, useEffect } from 'react';
import {
  CONTAINER_TYPE,
  FEED_TYPE,
  InputState,
  TokenContract,
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
  const {
    useSellTokenContract,
    useBuyTokenContract,
  } = require('@/lib/context/hooks');

  const [, setSellTokenContract] = useSellTokenContract();
  const [, setBuyTokenContract] = useBuyTokenContract();

  const { updateAssetScrollDisplay } = useDisplayControls();
  const sharedState = useBaseSelectShared();

  const containerType = CONTAINER_TYPE.SELL_SELECT_CONTAINER;

  const setTokenInContext = containerType === CONTAINER_TYPE.SELL_SELECT_CONTAINER
    ? setSellTokenContract
    : setBuyTokenContract;

  const title =
    containerType === CONTAINER_TYPE.SELL_SELECT_CONTAINER
      ? 'Select a Token to Sell'
      : 'Select a Token to Buy';

  const duplicateMessage =
    containerType === CONTAINER_TYPE.SELL_SELECT_CONTAINER
      ? 'Sell Address Cannot Be the Same as Buy Address'
      : 'Buy Address Cannot Be the Same as Sell Address';

  useEffect(() => {
    debugLog.log(`🧩 TokenSelectScrollPanel mounted for containerType=${containerType}`);
  }, [containerType]);

  useEffect(() => {
    const stateStr = getInputStateString(sharedState.inputState);
    debugLog.log(`🌀 inputState changed → ${stateStr}`);

    if (sharedState.inputState === InputState.CLOSE_INPUT) {
      debugLog.log(`✅ CLOSE_INPUT triggered, calling updateAssetScrollDisplay → EXCHANGE_ROOT`);
      updateAssetScrollDisplay(SP_COIN_DISPLAY.EXCHANGE_ROOT);
    }
  }, [sharedState.inputState, updateAssetScrollDisplay]);

  const handleSelect = useCallback(
    (token: TokenContract, state: InputState) => {
      const stateStr = getInputStateString(state);
      debugLog.log(`🎯 handleSelect called with state=${stateStr} and token=${token?.symbol || token?.address}`);

      if (state === InputState.CLOSE_INPUT) {
        debugLog.log(`✅ Setting token in context → ${token.symbol || token.address}`);
        setTokenInContext(token);
      }
    },
    [setTokenInContext]
  );

  return (
    <AssetSelectScrollContainer<TokenContract>
      setShowDialog={() => {}} // unused legacy param
      onSelect={handleSelect}
      title={title}
      feedType={FEED_TYPE.TOKEN_LIST}
      inputPlaceholder="Type or paste token address"
      duplicateMessage={duplicateMessage}
      showDuplicateCheck
      containerType={containerType}
    />
  );
}
