// File: @/components/containers/AssetSelectPanels/TokenListSelectPanel.tsx
'use client';

import { FEED_TYPE, SP_COIN_DISPLAY, type WalletAccount, type TokenContract } from '@/lib/structure';
import { usePanelVisible } from '@/lib/context/exchangeContext/hooks/usePanelVisible';
import { useSelectionCommit } from '@/lib/context/hooks/ExchangeContext/selectionCommit/useSelectionCommit';
import PanelListSelectWrapper from './PanelListSelectWrapper';

/** Visibility gate: SELL or BUY list (radio behavior handled upstream). */
export default function TokenListSelectPanel() {
  const sellVisible = usePanelVisible(SP_COIN_DISPLAY.SELL_LIST_SELECT_PANEL);
  const buyVisible  = usePanelVisible(SP_COIN_DISPLAY.BUY_LIST_SELECT_PANEL);

  const activePanel =
    sellVisible ? SP_COIN_DISPLAY.SELL_LIST_SELECT_PANEL :
    buyVisible  ? SP_COIN_DISPLAY.BUY_LIST_SELECT_PANEL  :
    null;

  if (!activePanel) return null;
  return <TokenListSelectPanelInner activePanel={activePanel} />;
}

function TokenListSelectPanelInner({
  activePanel,
}: {
  activePanel:
    | SP_COIN_DISPLAY.SELL_LIST_SELECT_PANEL
    | SP_COIN_DISPLAY.BUY_LIST_SELECT_PANEL;
}) {
  const { commitToken } = useSelectionCommit();
  const side = activePanel === SP_COIN_DISPLAY.SELL_LIST_SELECT_PANEL ? 'sell' : 'buy';

  const handleCommit = (asset: WalletAccount | TokenContract) => {
    const isToken = typeof (asset as any)?.decimals === 'number';
    if (!isToken) return;
    commitToken(asset as TokenContract, side);
  };

  return (
    <PanelListSelectWrapper
      panel={activePanel}
      feedType={FEED_TYPE.TOKEN_LIST}
      instancePrefix={side}
      onCommit={handleCommit}
    />
  );
}
