// File: @/components/views/ManageSponsorships/ManageAgents.tsx
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

import PanelListSelectWrapper from '@/components/views/TradingStationPanel/AssetSelectPanels/PanelListSelectWrapper';
import { createDebugLogger } from '@/lib/utils/debugLogger';

const LOG_TIME = false;
const DEBUG_ENABLED =
  process.env.NEXT_PUBLIC_DEBUG_LOG_MANAGE_AGENTS === 'true';
const debugLog = createDebugLogger('ManageAgents', DEBUG_ENABLED, LOG_TIME);

/**
 * Agents list:
 * - List visibility: MANAGE_AGENTS_PANEL (opened by ManageSponsorshipsPanel.openOnly)
 * - Detail visibility: MANAGE_AGENT_PANEL (ManageAgent + PanelGate)
 * - Selection source: FEED_TYPE.MANAGE_AGENTS via PanelListSelectWrapper
 */
export default function ManageAgents() {
  const visible = usePanelVisible(SP_COIN_DISPLAY.MANAGE_AGENTS_PANEL);

  useEffect(() => {
    debugLog.log?.('[visibility] MANAGE_AGENTS_PANEL', { visible });
    if (visible) {
      debugLog.log?.('OPENING ManageAgents');
    }
  }, [visible]);

  debugLog.log?.('[render]', { visible });

  return <ManageAgentsInner />;
}

function ManageAgentsInner() {
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

      // This panel is for agent *wallets*, not tokens
      if (isToken) return;

      const wallet = asset as WalletAccount;

      // 1️⃣ Set agentAccount in ExchangeContext
      ctx?.setExchangeContext(
        (prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            accounts: {
              ...prev.accounts,
              agentAccount: wallet,
            },
          };
        },
        'ManageAgents:handleCommit(agentAccount)',
      );

      // 2️⃣ Defer opening MANAGE_AGENT_PANEL so it runs *after*
      //     any toTrading(MAIN_TRADING_PANEL) transition.
      if (typeof window !== 'undefined') {
        window.setTimeout(() => {
          debugLog.log?.(
            '[handleCommit] deferred open of MANAGE_AGENT_PANEL after transitions',
          );
          openPanel(
            SP_COIN_DISPLAY.MANAGE_AGENT_PANEL,
            'ManageAgents:handleCommit(deferred open MANAGE_AGENT_PANEL)',
          );
        }, 0);
      } else {
        // Fallback (shouldn’t really hit because we’re in a client component)
        debugLog.log?.(
          '[handleCommit] non-window environment; opening MANAGE_AGENT_PANEL immediately',
        );
        openPanel(
          SP_COIN_DISPLAY.MANAGE_AGENT_PANEL,
          'ManageAgents:handleCommit(open MANAGE_AGENT_PANEL)',
        );
      }
    },
    [ctx, openPanel],
  );

  debugLog.log?.('[inner] mounting PanelListSelectWrapper', {
    panel: 'MANAGE_AGENTS_PANEL',
    feedType: 'MANAGE_AGENTS',
    instancePrefix: 'agent',
  });

  return (
    <div id="MANAGE_AGENTS_PANEL">
      <PanelListSelectWrapper
        panel={SP_COIN_DISPLAY.MANAGE_AGENTS_PANEL}
        feedType={FEED_TYPE.MANAGE_AGENTS}
        listType={LIST_TYPE.UNDEFINED}
        instancePrefix="agent"
        onCommit={handleCommit}
      />
    </div>
  );
}
