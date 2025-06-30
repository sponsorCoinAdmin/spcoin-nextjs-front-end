'use client';

import { useCallback } from 'react';
import { CONTAINER_TYPE, InputState, TokenContract, FEED_TYPE } from '@/lib/structure';
import AssetSelectScrollContainer from './AssetSelectScrollContainer';

export default function TokenSelectScrollPanel({
  setShowDialog,
  containerType,
  onSelect,
}: {
  setShowDialog: (show: boolean) => void;
  containerType: CONTAINER_TYPE;
  onSelect: (token: TokenContract, state: InputState) => void;
}) {
  const {
    useSellTokenContract,
    useBuyTokenContract,
  } = require('@/lib/context/hooks');

  const [, setSellTokenContract] = useSellTokenContract();
  const [, setBuyTokenContract] = useBuyTokenContract();

  const contractSetters = {
    [CONTAINER_TYPE.SELL_SELECT_CONTAINER]: setSellTokenContract,
    [CONTAINER_TYPE.BUY_SELECT_CONTAINER]: setBuyTokenContract,
  };

  const setTokenInContext = contractSetters[containerType];

  const title =
    containerType === CONTAINER_TYPE.SELL_SELECT_CONTAINER
      ? 'Select a Token to Sell'
      : 'Select a Token to Buy';

  const duplicateMessage =
    containerType === CONTAINER_TYPE.SELL_SELECT_CONTAINER
      ? 'Sell Address Cannot Be the Same as Buy Address'
      : 'Buy Address Cannot Be the Same as Sell Address';

  const handleSelect = useCallback(
    (token: TokenContract, state: InputState) => {
      console.debug('✅ [TokenSelectScrollPanel] selected token', token);
      if (state === InputState.CLOSE_INPUT) {
        setTokenInContext(token);
        onSelect(token, state);
      }
    },
    [setTokenInContext, onSelect]
  );

  return (
    <AssetSelectScrollContainer<TokenContract>
      setShowDialog={setShowDialog}
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
