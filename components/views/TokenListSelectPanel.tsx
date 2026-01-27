// File: @/components/views/AssetSelectPanels/TokenListSelectPanel.tsx
'use client';

import { FEED_TYPE, SP_COIN_DISPLAY, type spCoinAccount, type TokenContract } from '@/lib/structure';
import { usePanelVisible } from '@/lib/context/exchangeContext/hooks/usePanelVisible';
import { useSelectionCommit } from '@/lib/context/hooks/ExchangeContext/selectionCommit/useSelectionCommit';
import PanelListSelectWrapper from './AssetSelectPanels/PanelListSelectWrapper';

/** Visibility gate: SELL or BUY list (radio behavior handled upstream). */
export default function TokenListSelectPanel() {
  const sellVisible = usePanelVisible(SP_COIN_DISPLAY.SELL_LIST_SELECT_PANEL);
  const buyVisible = usePanelVisible(SP_COIN_DISPLAY.BUY_LIST_SELECT_PANEL);

  const activePanel = sellVisible
    ? SP_COIN_DISPLAY.SELL_LIST_SELECT_PANEL
    : buyVisible
      ? SP_COIN_DISPLAY.BUY_LIST_SELECT_PANEL
      : null;

  if (!activePanel) return null;
  return <TokenListSelectPanelInner activePanel={activePanel} />;
}

function TokenListSelectPanelInner({
  activePanel,
}: {
  activePanel: SP_COIN_DISPLAY.SELL_LIST_SELECT_PANEL | SP_COIN_DISPLAY.BUY_LIST_SELECT_PANEL;
}) {
  const { commitToken } = useSelectionCommit();
  const side = activePanel === SP_COIN_DISPLAY.SELL_LIST_SELECT_PANEL ? 'sell' : 'buy';

  const handleCommit = (asset: spCoinAccount | TokenContract) => {
    const isToken = typeof (asset as any)?.decimals === 'number';
    if (!isToken) return;
    commitToken(asset as TokenContract, side);
  };

  return (
    <PanelListSelectWrapper
      panel={activePanel}
      feedType={FEED_TYPE.TOKEN_LIST}
      // ✅ token lists never hit the manage view; pick any allowed ASSET_LIST_MODE
      // Prefer AGENTS as a harmless default "non-manage" mode.
      listType={SP_COIN_DISPLAY.AGENTS}
      instancePrefix={side}
      onCommit={handleCommit}
    />
  );
}
