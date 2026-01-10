// File: @/components/views/TradingStationPanel/AssetSelectPanels/RecipientListSelectPanel.tsx
'use client';

import { FEED_TYPE, SP_COIN_DISPLAY, type WalletAccount, type TokenContract, LIST_TYPE } from '@/lib/structure';
import { usePanelVisible } from '@/lib/context/exchangeContext/hooks/usePanelVisible';
import { useSelectionCommit } from '@/lib/context/hooks/ExchangeContext/selectionCommit/useSelectionCommit';
import PanelListSelectWrapper from './PanelListSelectWrapper';

/** Visibility gate only. */
export default function RecipientListSelectPanel() {
  const visible = usePanelVisible(SP_COIN_DISPLAY.RECIPIENT_LIST_SELECT_PANEL);
  if (!visible) return null;
  return <RecipientListSelectPanelInner />;
}

/** Shim: define feed + commit behavior. */
function RecipientListSelectPanelInner() {
  const { commitRecipient } = useSelectionCommit();

  const handleCommit = (asset: WalletAccount | TokenContract) => {
    const isToken = typeof (asset as any)?.decimals === 'number';
    if (isToken) return;
    commitRecipient(asset as WalletAccount);
  };

  return (
    <PanelListSelectWrapper
      panel={SP_COIN_DISPLAY.RECIPIENT_LIST_SELECT_PANEL}
      feedType={FEED_TYPE.RECIPIENT_ACCOUNTS}
      listType={LIST_TYPE.UNDEFINED} 
      instancePrefix="recipient"
      onCommit={handleCommit}
    />
  );
}
