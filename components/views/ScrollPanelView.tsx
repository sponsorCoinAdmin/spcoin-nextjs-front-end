'use client';

import { SP_COIN_DISPLAY } from '@/lib/structure';
import { useExchangeContext } from '@/lib/context/hooks';
import {
  TokenSelectScrollPanel,
  RecipientSelectScrollPanel,
} from '@/components/containers/AssetSelectScroll';

export default function ScrollPanelView() {
  const { assetSelectScrollDisplay } = useExchangeContext().exchangeContext.settings;

  if (assetSelectScrollDisplay === SP_COIN_DISPLAY.SHOW_TOKEN_SCROLL_CONTAINER) {
    return <TokenSelectScrollPanel />;
  }

  if (assetSelectScrollDisplay === SP_COIN_DISPLAY.SHOW_RECIPIENT_SCROLL_CONTAINER) {
    return <RecipientSelectScrollPanel />;
  }

  return null;
}
