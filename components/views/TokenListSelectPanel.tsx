// File: @/components/views/TokenListSelectPanel.tsx
'use client';

import { FEED_TYPE, SP_COIN_DISPLAY, type spCoinAccount, type TokenContract } from '@/lib/structure';
import { usePanelVisible } from '@/lib/context/exchangeContext/hooks/usePanelVisible';
import { useSelectionCommit } from '@/lib/context/hooks/ExchangeContext/selectionCommit/useSelectionCommit';
import PanelListSelectWrapper from './AssetSelectPanels/PanelListSelectWrapper';
import { isAddress } from 'viem';

function hasValidAddress(a: any): a is { address: string } {
  return typeof a?.address === 'string' && isAddress(a.address);
}

/** Visibility gate: SELL or BUY list (radio behavior handled upstream). */
export default function TokenListSelectPanel() {
  const sellVisible = usePanelVisible(SP_COIN_DISPLAY.SELL_LIST_SELECT_PANEL);
  const buyVisible = usePanelVisible(SP_COIN_DISPLAY.BUY_LIST_SELECT_PANEL);
  const { commitToken } = useSelectionCommit();

  const activePanel = sellVisible
    ? SP_COIN_DISPLAY.SELL_LIST_SELECT_PANEL
    : buyVisible
      ? SP_COIN_DISPLAY.BUY_LIST_SELECT_PANEL
      : null;

  if (!activePanel) return null;

  const side = activePanel === SP_COIN_DISPLAY.SELL_LIST_SELECT_PANEL ? 'sell' : 'buy';

  const handleCommit = (asset: spCoinAccount | TokenContract) => {
    // Optional safety: ensure we have a real address
    if (!hasValidAddress(asset)) return;

    // Token panel => token feed => commit as token
    commitToken(asset as TokenContract, side);
  };

  return (
    <PanelListSelectWrapper
      panel={activePanel}
      feedType={FEED_TYPE.TOKEN_LIST}
      // token lists never hit the manage view; pick any allowed ASSET_LIST_MODE
      listType={SP_COIN_DISPLAY.AGENTS}
      instancePrefix={side}
      onCommit={handleCommit}
    />
  );
}
