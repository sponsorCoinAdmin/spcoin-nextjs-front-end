// File: @/components/views/TokenListSelectPanel.tsx
'use client';

import { SP_COIN_DISPLAY, type spCoinAccount, type TokenContract } from '@/lib/structure';
import { usePanelVisible } from '@/lib/context/exchangeContext/hooks/usePanelVisible';
import { useSelectionCommit } from '@/lib/context/hooks/ExchangeContext/selectionCommit/useSelectionCommit';
import PanelListSelectWrapper from '../../AssetSelectPanels/PanelListSelectWrapper';
import { isAddress } from '@/lib/utils/address';

function hasValidAddress(a: any): a is { address: string } {
  return typeof a?.address === 'string' && isAddress(a.address);
}

/** Token list overlay (BUY or SELL). Active panel is derived from radio overlay state. */
export default function TokenListSelectPanel() {
  const { commitToken } = useSelectionCommit();
  const listVisible = usePanelVisible(SP_COIN_DISPLAY.TOKEN_LIST_SELECT_PANEL);
  const buyMode = usePanelVisible(SP_COIN_DISPLAY.BUY_CONTRACT);
  const sellMode = usePanelVisible(SP_COIN_DISPLAY.SELL_CONTRACT);

  if (!listVisible) return null;

  if (!buyMode && !sellMode) {
    const title = 'No buy or sell token contract selected.';
    const body = 'Select a buy or sell token to view its details.';
    return (
      <div
        id="TOKEN_LIST_SELECT_PANEL"
        className="flex h-full min-h-0 w-full flex-col overflow-hidden"
      >
        <div className="p-4 text-sm text-slate-200 text-center">
          <p className="mb-2 font-semibold">{title}</p>
          <p className="m-0">{body}</p>
        </div>
      </div>
    );
  }

  // Side is derived from token mode flags
  const side = sellMode ? 'sell' : buyMode ? 'buy' : 'sell';

  const handleCommit = (asset: spCoinAccount | TokenContract) => {
    if (!hasValidAddress(asset)) return;
    commitToken(asset as TokenContract, side);
  };

  return (
    <div
      id="TOKEN_LIST_SELECT_PANEL"
      className="flex h-full min-h-0 w-full flex-col overflow-hidden"
    >
      {buyMode && <div id="BUY_LIST_SELECT_PANEL" className="hidden" aria-hidden="true" />}
      <PanelListSelectWrapper onCommit={handleCommit} />
    </div>
  );
}
