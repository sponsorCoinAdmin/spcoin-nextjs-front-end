// File: components/views/ScrollPanelView.tsx

'use client';

import {
  SP_COIN_DISPLAY,
  CONTAINER_TYPE,
  InputState,
  TokenContract,
  WalletAccount,
} from '@/lib/structure';
import {
  useExchangeContext,
  useDisplayControls,
} from '@/lib/context/hooks';
import {
  TokenSelectScrollPanel,
  RecipientSelectScrollPanel,
} from '@/components/containers/AssetSelectScrollContainer';

export default function ScrollPanelView() {
  const { exchangeContext } = useExchangeContext();
  const { assetSelectScrollDisplay } = exchangeContext.settings;
  const { updateAssetScrollDisplay } = useDisplayControls();

  const handleClose = () => updateAssetScrollDisplay(SP_COIN_DISPLAY.EXCHANGE_ROOT);

  if (assetSelectScrollDisplay === SP_COIN_DISPLAY.SHOW_TOKEN_SCROLL_CONTAINER) {
    return (
      <TokenSelectScrollPanel
        containerType={CONTAINER_TYPE.SELL_SELECT_CONTAINER}
        setShowDialog={show => { if (!show) handleClose(); }}
        onSelect={(token: TokenContract, state: InputState) => {
          if (state === InputState.CLOSE_INPUT) handleClose();
        }}
      />
    );
  }

  if (assetSelectScrollDisplay === SP_COIN_DISPLAY.SHOW_RECIPIENT_SCROLL_CONTAINER) {
    return (
      <RecipientSelectScrollPanel
        setShowDialog={show => { if (!show) handleClose(); }}
        onSelect={(wallet: WalletAccount, state: InputState) => {
          if (state === InputState.CLOSE_INPUT) handleClose();
        }}
      />
    );
  }

  return null;
}
