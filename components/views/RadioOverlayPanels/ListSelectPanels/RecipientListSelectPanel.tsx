// File: @/components/views/RecipientListSelectPanel.tsx
'use client';

import React from 'react';
import { SP_COIN_DISPLAY, type spCoinAccount, type TokenContract } from '@/lib/structure';
import { usePanelVisible } from '@/lib/context/exchangeContext/hooks/usePanelVisible';
import { useSelectionCommit } from '@/lib/context/hooks/ExchangeContext/selectionCommit/useSelectionCommit';
import { isAddress } from 'viem';
import PanelListSelectWrapper from '../../AssetSelectPanels/PanelListSelectWrapper';

function hasValidAddress(a: any): a is { address: string } {
  return typeof a?.address === 'string' && isAddress(a.address);
}

export default function RecipientListSelectPanel() {
  const vAccountList = usePanelVisible(SP_COIN_DISPLAY.ACCOUNT_LIST_SELECT_PANEL);
  const vRecipientList = usePanelVisible(SP_COIN_DISPLAY.RECIPIENT_LIST);
  const visible = vAccountList && vRecipientList;
  const { commitRecipient } = useSelectionCommit();

  if (!visible) return null;

  const handleCommit = (asset: spCoinAccount | TokenContract) => {
    if (!hasValidAddress(asset)) return;
    commitRecipient(asset as spCoinAccount);
  };

  return (
    <div id="RECIPIENT_LIST_SELECT_PANEL" className="flex h-full min-h-0 w-full flex-col overflow-hidden">
      <div id="ACCOUNT_LIST_SELECT_PANEL" className="flex h-full min-h-0 w-full flex-col overflow-hidden">
        <div id="RECIPIENT_LIST" className="flex h-full min-h-0 w-full flex-col overflow-hidden">
          <PanelListSelectWrapper
            onCommit={handleCommit}
            containerTypeOverride={SP_COIN_DISPLAY.RECIPIENT_LIST}
          />
        </div>
      </div>
    </div>
  );
}
