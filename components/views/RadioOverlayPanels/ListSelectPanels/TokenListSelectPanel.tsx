// File: @/components/views/TokenListSelectPanel.tsx
'use client';

import { SP_COIN_DISPLAY, type spCoinAccount, type TokenContract } from '@/lib/structure';
import { usePanelVisible } from '@/lib/context/exchangeContext/hooks/usePanelVisible';
import { useSelectionCommit } from '@/lib/context/hooks/ExchangeContext/selectionCommit/useSelectionCommit';
import PanelListSelectWrapper from '../../AssetSelectPanels/PanelListSelectWrapper';
import { isAddress } from 'viem';

function hasValidAddress(a: any): a is { address: string } {
  return typeof a?.address === 'string' && isAddress(a.address);
}

/** Token list overlay (BUY or SELL). Active panel is derived from radio overlay state. */
export default function TokenListSelectPanel() {
  const { commitToken } = useSelectionCommit();
  const listVisible = usePanelVisible(SP_COIN_DISPLAY.TOKEN_LIST_SELECT_PANEL);
  const buyMode = usePanelVisible(SP_COIN_DISPLAY.BUY_TOKEN);
  const sellMode = usePanelVisible(SP_COIN_DISPLAY.SELL_TOKEN);

  if (!listVisible) return null;

  // Side is derived from token mode flags
  const side = sellMode ? 'sell' : buyMode ? 'buy' : 'sell';

  const handleCommit = (asset: spCoinAccount | TokenContract) => {
    if (!hasValidAddress(asset)) return;
    commitToken(asset as TokenContract, side);
  };

  return <PanelListSelectWrapper onCommit={handleCommit} />;
}
