'use client';

import { useCallback, useEffect } from 'react';
import {
  CONTAINER_TYPE,
  FEED_TYPE,
  InputState,
  TokenContract,
  SP_COIN_DISPLAY,
} from '@/lib/structure';
import AssetSelectScrollContainer from './AssetSelectScrollContainer';
import { useBaseSelectShared } from '@/lib/hooks/useBaseSelectShared';
import { useDisplayControls } from '@/lib/context/hooks';

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
    if (sharedState.inputState === InputState.CLOSE_INPUT) {
      updateAssetScrollDisplay(SP_COIN_DISPLAY.EXCHANGE_ROOT);
    }
  }, [sharedState.inputState, updateAssetScrollDisplay]);

  const handleSelect = useCallback(
    (token: TokenContract, state: InputState) => {
      if (state === InputState.CLOSE_INPUT) {
        setTokenInContext(token);
      }
    },
    [setTokenInContext]
  );

  return (
    <AssetSelectScrollContainer<TokenContract>
      setShowDialog={() => {}} // ignored now
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
