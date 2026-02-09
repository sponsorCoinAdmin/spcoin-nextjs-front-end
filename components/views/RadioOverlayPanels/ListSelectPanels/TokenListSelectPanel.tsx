// File: @/components/views/TokenListSelectPanel.tsx
'use client';

import { SP_COIN_DISPLAY, type spCoinAccount, type TokenContract } from '@/lib/structure';
import { useActiveRadioPanel } from '@/lib/context/exchangeContext/hooks/useActiveRadioPanel';
import { useSelectionCommit } from '@/lib/context/hooks/ExchangeContext/selectionCommit/useSelectionCommit';
import PanelListSelectWrapper from '../../AssetSelectPanels/PanelListSelectWrapper';
import { isAddress } from 'viem';

function hasValidAddress(a: any): a is { address: string } {
  return typeof a?.address === 'string' && isAddress(a.address);
}

/** Token list overlay (BUY or SELL). Active panel is derived from radio overlay state. */
export default function TokenListSelectPanel() {
  const activePanel = useActiveRadioPanel();
  const { commitToken } = useSelectionCommit();

  // Only handle token list overlays here
  const side =
    activePanel === SP_COIN_DISPLAY.TOKEN_LIST_SELECT_PANEL
      ? 'sell'
      : activePanel === SP_COIN_DISPLAY.BUY_LIST_SELECT_PANEL
        ? 'buy'
        : null;

  if (!side) return null;

  const handleCommit = (asset: spCoinAccount | TokenContract) => {
    if (!hasValidAddress(asset)) return;
    commitToken(asset as TokenContract, side);
  };

  return <PanelListSelectWrapper onCommit={handleCommit} />;
}
