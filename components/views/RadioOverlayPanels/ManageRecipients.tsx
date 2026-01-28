// File: @/components/views/ManageSponsorships/ManageRecipients.tsx
'use client';

import React, { useEffect, useContext, useCallback } from 'react';
import { FEED_TYPE, SP_COIN_DISPLAY, type spCoinAccount, type TokenContract } from '@/lib/structure';

import { usePanelVisible } from '@/lib/context/exchangeContext/hooks/usePanelVisible';
import { usePanelTree } from '@/lib/context/exchangeContext/hooks/usePanelTree';
import { ExchangeContextState } from '@/lib/context/ExchangeProvider';

import PanelListSelectWrapper from '@/components/views/AssetSelectPanels/PanelListSelectWrapper';
import { createDebugLogger } from '@/lib/utils/debugLogger';

const LOG_TIME = false;
const DEBUG_ENABLED = process.env.NEXT_PUBLIC_DEBUG_LOG_MANAGE_RECIPIENTS === 'true';
const debugLog = createDebugLogger('ManageRecipients', DEBUG_ENABLED, LOG_TIME);

/**
 * Recipients list:
 * - List visibility: RECIPIENT_LIST_SELECT_PANEL (opened by ManageSponsorshipsPanel.openOnly)
 * - Detail visibility: RECIPIENT_ACCOUNT_PANEL (ManageRecipient + PanelGate)
 * - Selection source: FEED_TYPE.MANAGE_RECIPIENTS via PanelListSelectWrapper
 */
export default function ManageRecipients() {

  return null
  const visible = usePanelVisible(SP_COIN_DISPLAY.RECIPIENT_LIST_SELECT_PANEL);
  const ctx = useContext(ExchangeContextState);
  const { openPanel } = usePanelTree();

  useEffect(() => {
    debugLog.log?.('[visibility] RECIPIENT_LIST_SELECT_PANEL', { visible });
    if (visible) debugLog.log?.('OPENING ManageRecipients');
  }, [visible]);

  debugLog.log?.('[render]', { visible });

  if (!visible) return null; // ✅ critical: don’t mount while hidden

  const handleCommit = useCallback(
    (asset: spCoinAccount | TokenContract) => {
      const isToken = typeof (asset as any)?.decimals === 'number';

      debugLog.log?.('[handleCommit]', {
        isToken,
        assetPreview: {
          address: (asset as any)?.address,
          name: (asset as any)?.name,
        },
      });

      // This panel is for recipient *wallets*, not tokens
      if (isToken) return;

      const wallet = asset as spCoinAccount;

      // 1️⃣ Set recipientAccount in ExchangeContext
      ctx?.setExchangeContext(
        (prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            accounts: {
              ...prev.accounts,
              recipientAccount: wallet,
            },
          };
        },
        'ManageRecipients:handleCommit(recipientAccount)',
      );

      // 2️⃣ Defer opening RECIPIENT_ACCOUNT_PANEL so it runs after transitions
      window.setTimeout(() => {
        debugLog.log?.('[handleCommit] deferred open of RECIPIENT_ACCOUNT_PANEL after transitions');
        openPanel(
          SP_COIN_DISPLAY.RECIPIENT_ACCOUNT_PANEL,
          'ManageRecipients:handleCommit(deferred open RECIPIENT_ACCOUNT_PANEL)',
        );
      }, 0);
    },
    [ctx, openPanel],
  );

  debugLog.log?.('[mounting PanelListSelectWrapper]', {
    panel: 'RECIPIENT_LIST_SELECT_PANEL',
    feedType: 'MANAGE_RECIPIENTS',
    instancePrefix: 'recipient',
  });

  return (
    <div id="RECIPIENT_LIST_SELECT_PANEL">
      <PanelListSelectWrapper
        panel={SP_COIN_DISPLAY.RECIPIENT_LIST_SELECT_PANEL}
        feedType={FEED_TYPE.MANAGE_RECIPIENTS}
        listType={SP_COIN_DISPLAY.RECIPIENTS}
        instancePrefix="recipient"
        onCommit={handleCommit}
      />
    </div>
  );
}
