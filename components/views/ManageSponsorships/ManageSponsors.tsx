// File: @/components/views/ManageSponsorships/ManageSponsors.tsx
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
  process.env.NEXT_PUBLIC_DEBUG_LOG_MANAGE_SPONSORS === 'true';
const debugLog = createDebugLogger('ManageSponsors', DEBUG_ENABLED, LOG_TIME);

/**
 * Sponsors list:
 * - List visibility: MANAGE_SPONSORS_PANEL (opened by ManageSponsorshipsPanel.openOnly)
 * - Detail visibility: MANAGE_SPONSOR_PANEL (ManageSponsor + PanelGate)
 * - Selection source: FEED_TYPE.MANAGE_SPONSORS via PanelListSelectWrapper
 */
export default function ManageSponsors() {
  const visible = usePanelVisible(SP_COIN_DISPLAY.MANAGE_SPONSORS_PANEL);

  useEffect(() => {
    debugLog.log?.('[visibility] MANAGE_SPONSORS_PANEL', { visible });
    if (visible) {
      debugLog.log?.('OPENING ManageSponsors');
    }
  }, [visible]);

  debugLog.log?.('[render]', { visible });

  return <ManageSponsorsInner />;
}

function ManageSponsorsInner() {
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

      // This panel is for sponsor *wallets*, not tokens
      if (isToken) return;

      const wallet = asset as WalletAccount;

      // 1️⃣ Set sponsorAccount in ExchangeContext
      ctx?.setExchangeContext(
        (prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            accounts: {
              ...prev.accounts,
              sponsorAccount: wallet,
            },
          };
        },
        'ManageSponsors:handleCommit(sponsorAccount)'
      );

      // 2️⃣ Defer opening MANAGE_SPONSOR_PANEL so it runs *after*
      //     any toTrading(MAIN_TRADING_PANEL) transition.
      if (typeof window !== 'undefined') {
        window.setTimeout(() => {
          debugLog.log?.(
            '[handleCommit] deferred open of MANAGE_SPONSOR_PANEL after transitions'
          );
          openPanel(
            SP_COIN_DISPLAY.MANAGE_SPONSOR_PANEL,
            'ManageSponsors:handleCommit(deferred open MANAGE_SPONSOR_PANEL)'
          );
        }, 0);
      } else {
        // Fallback (shouldn’t really hit because we’re in a client component)
        debugLog.log?.(
          '[handleCommit] non-window environment; opening MANAGE_SPONSOR_PANEL immediately'
        );
        openPanel(
          SP_COIN_DISPLAY.MANAGE_SPONSOR_PANEL,
          'ManageSponsors:handleCommit(open MANAGE_SPONSOR_PANEL)'
        );
      }
    },
    [ctx, openPanel]
  );

  debugLog.log?.('[inner] mounting PanelListSelectWrapper', {
    panel: 'MANAGE_SPONSORS_PANEL',
    feedType: 'MANAGE_SPONSORS',
    instancePrefix: 'sponsor',
  });

  return (
    <PanelListSelectWrapper
      panel={SP_COIN_DISPLAY.MANAGE_SPONSORS_PANEL}
      feedType={FEED_TYPE.MANAGE_SPONSORS}
      instancePrefix="sponsor"
      onCommit={handleCommit}
    />
  );
}
