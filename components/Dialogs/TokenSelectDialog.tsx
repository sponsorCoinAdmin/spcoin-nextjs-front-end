// File: components/dialogs/TokenSelectDialog.tsx

'use client';

import { useEffect } from 'react';
import { InputState, CONTAINER_TYPE, FEED_TYPE, TokenContract } from '@/lib/structure';
import { useBuyTokenContract, useSellTokenContract } from '@/lib/context/hooks';
import { AssetSelectDialog } from './AssetSelectDialogs';
import { useAssetSelectDialog } from '@/lib/hooks/useAssetSelectDialog';

export function TokenSelectDialog(props: {
  showContainer: boolean;
  setShowContainer: (show: boolean) => void;
  containerType: CONTAINER_TYPE;
  onSelect: (token: TokenContract, state: InputState) => void;
}) {
  const { containerType } = props;
  const [, setSellTokenContract] = useSellTokenContract();
  const [, setBuyTokenContract] = useBuyTokenContract();

  const setTokenInContext =
    containerType === CONTAINER_TYPE.SELL_SELECT_CONTAINER
      ? setSellTokenContract
      : setBuyTokenContract;

  const { handleSelect, debugLog } = useAssetSelectDialog<TokenContract>(
    'TokenSelectDialog',
    (token, state) => {
      if (state === InputState.CLOSE_INPUT) {
        setTokenInContext(token);
        props.onSelect(token, state);
      }
    }
  );

  useEffect(() => {
    debugLog.log('📬 [TokenSelectDialog] props received', {
      showContainer: props.showContainer,
      containerType,
    });
  }, [props.showContainer, containerType]);

  return (
    <AssetSelectDialog<TokenContract>
      {...props}
      feedType={FEED_TYPE.TOKEN_LIST}
      containerType={containerType}
      onSelect={handleSelect}
    />
  );
}
