// File: @/components/views/ManageSponsorships/ManageAgents.tsx
'use client';

import React, { useEffect, useContext, useCallback } from 'react';
import { FEED_TYPE, SP_COIN_DISPLAY, type spCoinAccount, type TokenContract } from '@/lib/structure';
import { usePanelVisible } from '@/lib/context/exchangeContext/hooks/usePanelVisible';
import { usePanelTree } from '@/lib/context/exchangeContext/hooks/usePanelTree';
import { ExchangeContextState } from '@/lib/context/ExchangeProvider';

import PanelListSelectWrapper from '@/components/views/AssetSelectPanels/PanelListSelectWrapper';
import { createDebugLogger } from '@/lib/utils/debugLogger';

const LOG_TIME = false;
const DEBUG_ENABLED = process.env.NEXT_PUBLIC_DEBUG_LOG_MANAGE_AGENTS === 'true';
const debugLog = createDebugLogger('ManageAgents', DEBUG_ENABLED, LOG_TIME);

export default function ManageAgents() {
  const visible = usePanelVisible(SP_COIN_DISPLAY.AGENT_LIST_SELECT_PANEL_OLD);
  const ctx = useContext(ExchangeContextState);
  const { openPanel } = usePanelTree();

  useEffect(() => {
    debugLog.log?.('[visibility] AGENT_LIST_SELECT_PANEL_OLD', { visible });
    if (visible) debugLog.log?.('OPENING ManageAgents');
  }, [visible]);

  debugLog.log?.('[render]', { visible });

  if (!visible) return null; // ✅ critical (prevents hidden mounting)

  const handleCommit = useCallback(
    (asset: spCoinAccount | TokenContract) => {
      const isToken = typeof (asset as any)?.decimals === 'number';
      if (isToken) return;

      const wallet = asset as spCoinAccount;

      ctx?.setExchangeContext(
        (prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            accounts: { ...prev.accounts, agentAccount: wallet },
          };
        },
        'ManageAgents:handleCommit(agentAccount)',
      );

      window.setTimeout(() => {
        openPanel(
          SP_COIN_DISPLAY.AGENT_ACCOUNT_PANEL,
          'ManageAgents:handleCommit(deferred open AGENT_ACCOUNT_PANEL)',
        );
      }, 0);
    },
    [ctx, openPanel],
  );

  debugLog.log?.('[mounting PanelListSelectWrapper]', {
    panel: 'AGENT_LIST_SELECT_PANEL_OLD',
    feedType: 'MANAGE_AGENTS',
    instancePrefix: 'agent',
  });

  return (
    <div id="AGENT_LIST_SELECT_PANEL_OLD">
      <PanelListSelectWrapper
        panel={SP_COIN_DISPLAY.AGENT_LIST_SELECT_PANEL_OLD}
        feedType={FEED_TYPE.MANAGE_AGENTS}
        listType={SP_COIN_DISPLAY.AGENTS}
        instancePrefix="agent"
        onCommit={handleCommit}
      />
    </div>
  );
}
