// File: @/components/views/RecipientListSelectPanel.tsx
'use client';

import { FEED_TYPE, SP_COIN_DISPLAY, type spCoinAccount, type TokenContract } from '@/lib/structure';
import { usePanelVisible } from '@/lib/context/exchangeContext/hooks/usePanelVisible';
import { useSelectionCommit } from '@/lib/context/hooks/ExchangeContext/selectionCommit/useSelectionCommit';
import PanelListSelectWrapper from './AssetSelectPanels/PanelListSelectWrapper';
import { isAddress } from 'viem';

function hasValidAddress(a: any): a is { address: string } {
  return typeof a?.address === 'string' && isAddress(a.address);
}

export default function RecipientListSelectPanel() {
  const visible = usePanelVisible(SP_COIN_DISPLAY.RECIPIENT_LIST_SELECT_PANEL);
  const { commitRecipient } = useSelectionCommit();
  if (!visible) return null;

  const handleCommit = (asset: spCoinAccount | TokenContract) => {
    if (!hasValidAddress(asset)) return;
    commitRecipient(asset as spCoinAccount);
  };

  return (
    <PanelListSelectWrapper
      panel={SP_COIN_DISPLAY.RECIPIENT_LIST_SELECT_PANEL}
      feedType={FEED_TYPE.RECIPIENT_ACCOUNTS}
      listType={SP_COIN_DISPLAY.RECIPIENTS}
      instancePrefix="recipient"
      onCommit={handleCommit}
    />
  );
}
