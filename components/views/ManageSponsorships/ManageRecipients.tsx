// File: @/components/views/ManageSponsorships/ManageRecipients.tsx
'use client';

import React, { useEffect, useContext, useCallback } from 'react';
import {
  FEED_TYPE,
  SP_COIN_DISPLAY,
  type WalletAccount,
  type TokenContract,
} from '@/lib/structure';

import { usePanelVisible } from '@/lib/context/exchangeContext/hooks/usePanelVisible';
import { usePanelTree } from '@/lib/context/exchangeContext/hooks/usePanelTree';
import { ExchangeContextState } from '@/lib/context/ExchangeProvider';

import PanelListSelectWrapper from '@/components/containers/AssetSelectPanels/PanelListSelectWrapper';
import { createDebugLogger } from '@/lib/utils/debugLogger';

const LOG_TIME = false;
const DEBUG_ENABLED =
  process.env.NEXT_PUBLIC_DEBUG_LOG_MANAGE_RECIPIENTS === 'true';
const debugLog = createDebugLogger('ManageRecipients', DEBUG_ENABLED, LOG_TIME);

/**
 * Recipients list:
 * - List visibility: MANAGE_RECIPIENTS_PANEL (opened by ManageSponsorshipsPanel.openOnly)
 * - Detail visibility: MANAGE_RECIPIENT_PANEL (ManageRecipient + PanelGate)
 * - Selection source: FEED_TYPE.MANAGE_RECIPIENTS via PanelListSelectWrapper
 */
export default function ManageRecipients() {
  const visible = usePanelVisible(SP_COIN_DISPLAY.MANAGE_RECIPIENTS_PANEL);

  useEffect(() => {
    debugLog.log?.('[visibility] MANAGE_RECIPIENTS_PANEL', { visible });
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

      // 2️⃣ Defer opening MANAGE_RECIPIENT_PANEL so it runs *after*
      //     any toTrading(MAIN_TRADING_PANEL) transition.
      if (typeof window !== 'undefined') {
        window.setTimeout(() => {
          debugLog.log?.(
            '[handleCommit] deferred open of MANAGE_RECIPIENT_PANEL after transitions',
          );
          openPanel(
            SP_COIN_DISPLAY.MANAGE_RECIPIENT_PANEL,
            'ManageRecipients:handleCommit(deferred open MANAGE_RECIPIENT_PANEL)',
          );
        }, 0);
      } else {
        // Fallback (shouldn’t really hit because we’re in a client component)
        debugLog.log?.(
          '[handleCommit] non-window environment; opening MANAGE_RECIPIENT_PANEL immediately',
        );
        openPanel(
          SP_COIN_DISPLAY.MANAGE_RECIPIENT_PANEL,
          'ManageRecipients:handleCommit(open MANAGE_RECIPIENT_PANEL)',
        );
      }
    },
    [ctx, openPanel],
  );

  debugLog.log?.('[inner] mounting PanelListSelectWrapper', {
    panel: 'MANAGE_RECIPIENTS_PANEL',
    feedType: 'MANAGE_RECIPIENTS',
    instancePrefix: 'recipient',
  });

  return (
    <PanelListSelectWrapper
      panel={SP_COIN_DISPLAY.MANAGE_RECIPIENTS_PANEL}
      feedType={FEED_TYPE.MANAGE_RECIPIENTS}
      instancePrefix="recipient"
      onCommit={handleCommit}
    />
  );
}
