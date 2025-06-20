'use client';

import { useEffect, useMemo } from 'react';
import { InputState, CONTAINER_TYPE, FEED_TYPE, TokenContract } from '@/lib/structure';
import { useBuyTokenContract, useSellTokenContract } from '@/lib/context/hooks';
import AddressSelectDialog from './AddressSelectDialog';
import { createDebugLogger } from '@/lib/utils/debugLogger';

const LOG_TIME: boolean = false;
const DEBUG_ENABLED = process.env.NEXT_PUBLIC_DEBUG_LOG_ASSET_SELECT_DIALOGS === 'true';
const debugLog = createDebugLogger('apiResponse', DEBUG_ENABLED, LOG_TIME);

export function TokenSelectDialog(props: {
  showDialog: boolean;
  setShowDialog: (show: boolean) => void;
  containerType: CONTAINER_TYPE;
  onSelect: (token: TokenContract, state: InputState) => void;
}) {
  const { containerType } = props;
  const [, setSellTokenContract] = useSellTokenContract();
  const [, setBuyTokenContract] = useBuyTokenContract();

  const title = useMemo(() => {
    const resolvedTitle =
      containerType === CONTAINER_TYPE.SELL_SELECT_CONTAINER
        ? 'Select a Token to Sell'
        : 'Select a Token to Buy';
    debugLog.log('🧠 [TokenSelectDialog] Resolved title', resolvedTitle);
    return resolvedTitle;
  }, [containerType]);

  const setTokenInContext =
    containerType === CONTAINER_TYPE.SELL_SELECT_CONTAINER
      ? setSellTokenContract
      : setBuyTokenContract;

  useEffect(() => {
    debugLog.log('📬 [TokenSelectDialog] props received', {
      showDialog: props.showDialog,
      containerType,
    });
  }, [props.showDialog, containerType]);

  return (
    <AddressSelectDialog<TokenContract>
      {...props}
      title={title}
      feedType={FEED_TYPE.TOKEN_LIST}
      inputPlaceholder="Type or paste token address"
      duplicateMessage={
        containerType === CONTAINER_TYPE.SELL_SELECT_CONTAINER
          ? 'Sell Address Cannot Be the Same as Buy Address'
          : 'Buy Address Cannot Be the Same as Sell Address'
      }
      showDuplicateCheck
      containerType={containerType}
      onSelect={(token, state) => {
        debugLog.log('✅ [TokenSelectDialog] selected token', token);
        if (state === InputState.CLOSE_INPUT) {
          setTokenInContext(token);
          props.onSelect(token, state);
        }
      }}
    />
  );
}
