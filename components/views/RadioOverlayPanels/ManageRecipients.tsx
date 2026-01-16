// File: @/components/views/ManageSponsorships/ManageRecipients.tsx
'use client';

import React, { useEffect, useContext, useCallback } from 'react';
import {
  FEED_TYPE,
  SP_COIN_DISPLAY,
  type WalletAccount,
  type TokenContract,
  LIST_TYPE,
} from '@/lib/structure';

import { usePanelVisible } from '@/lib/context/exchangeContext/hooks/usePanelVisible';
import { usePanelTree } from '@/lib/context/exchangeContext/hooks/usePanelTree';
import { ExchangeContextState } from '@/lib/context/ExchangeProvider';

import PanelListSelectWrapper from '@/components/views/AssetSelectPanels/PanelListSelectWrapper';
import { createDebugLogger } from '@/lib/utils/debugLogger';

const LOG_TIME = false;
const DEBUG_ENABLED =
  process.env.NEXT_PUBLIC_DEBUG_LOG_MANAGE_RECIPIENTS === 'true';
const debugLog = createDebugLogger('ManageRecipients', DEBUG_ENABLED, LOG_TIME);

/**
 * Recipients list:
 * - List visibility: RECIPIENT_LIST_SELECT_PANEL_OLD (opened by ManageSponsorshipsPanel.openOnly)
 * - Detail visibility: RECIPIENT_ACCOUNT_PANEL (ManageRecipient + PanelGate)
 * - Selection source: FEED_TYPE.MANAGE_RECIPIENTS via PanelListSelectWrapper
 */
export default function ManageRecipients() {
  const visible = usePanelVisible(SP_COIN_DISPLAY.RECIPIENT_LIST_SELECT_PANEL_OLD);

  useEffect(() => {
    debugLog.log?.('[visibility] RECIPIENT_LIST_SELECT_PANEL_OLD', { visible });
    if (visible) {
      debugLog.log?.('OPENING ManageRecipients');
    }
  }, [visible]);

  debugLog.log?.('[render]', { visible });

  return <ManageRecipientsInner />;
}

function ManageRecipientsInner() {
  const ctx = useContext(ExchangeContextState);
  const { openPanel } = usePanelTree();

  const handleCommit = useCallback(
    (asset: WalletAccount | TokenContract) => {
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

      const wallet = asset as WalletAccount;

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

      // 2️⃣ Defer opening RECIPIENT_ACCOUNT_PANEL so it runs *after*
      //     any toTrading(MAIN_TRADING_PANEL) transition.
      if (typeof window !== 'undefined') {
        window.setTimeout(() => {
          debugLog.log?.(
            '[handleCommit] deferred open of RECIPIENT_ACCOUNT_PANEL after transitions',
          );
          openPanel(
            SP_COIN_DISPLAY.RECIPIENT_ACCOUNT_PANEL,
            'ManageRecipients:handleCommit(deferred open RECIPIENT_ACCOUNT_PANEL)',
          );
        }, 0);
      } else {
        // Fallback (shouldn’t really hit because we’re in a client component)
        debugLog.log?.(
          '[handleCommit] non-window environment; opening RECIPIENT_ACCOUNT_PANEL immediately',
        );
        openPanel(
          SP_COIN_DISPLAY.RECIPIENT_ACCOUNT_PANEL,
          'ManageRecipients:handleCommit(open RECIPIENT_ACCOUNT_PANEL)',
        );
      }
    },
    [ctx, openPanel],
  );

  debugLog.log?.('[inner] mounting PanelListSelectWrapper', {
    panel: 'RECIPIENT_LIST_SELECT_PANEL_OLD',
    feedType: 'MANAGE_RECIPIENTS',
    instancePrefix: 'recipient',
  });

  return (
    <div id="RECIPIENT_LIST_SELECT_PANEL_OLD">
      <PanelListSelectWrapper
        panel={SP_COIN_DISPLAY.RECIPIENT_LIST_SELECT_PANEL_OLD}
        feedType={FEED_TYPE.MANAGE_RECIPIENTS}
        listType={LIST_TYPE.UNDEFINED}
        instancePrefix="recipient"
        onCommit={handleCommit}
      />
    </div>
  );
}
