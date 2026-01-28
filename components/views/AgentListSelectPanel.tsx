// File: @/components/views/AgentListSelectPanel.tsx
'use client';

import { FEED_TYPE, SP_COIN_DISPLAY, type spCoinAccount, type TokenContract } from '@/lib/structure';
import { usePanelVisible } from '@/lib/context/exchangeContext/hooks/usePanelVisible';
import { useSelectionCommit } from '@/lib/context/hooks/ExchangeContext/selectionCommit/useSelectionCommit';
import PanelListSelectWrapper from './AssetSelectPanels/PanelListSelectWrapper';

/** Visibility gate only. */
export default function AgentListSelectPanel() {
  const visible = usePanelVisible(SP_COIN_DISPLAY.AGENT_LIST_SELECT_PANEL_OLD);
  if (!visible) return null;
  return <AgentListSelectPanelInner />;
}

/** Shim: define feed + commit behavior. */
function AgentListSelectPanelInner() {
  const { commitAgent } = useSelectionCommit();

  const handleCommit = (asset: spCoinAccount | TokenContract) => {
    const isToken = typeof (asset as any)?.decimals === 'number';
    if (isToken) return;
    commitAgent(asset as spCoinAccount);
  };

  return (
    <PanelListSelectWrapper
      panel={SP_COIN_DISPLAY.AGENT_LIST_SELECT_PANEL_OLD}
      feedType={FEED_TYPE.AGENT_ACCOUNTS}
      listType={SP_COIN_DISPLAY.AGENTS}
      instancePrefix="agent"
      onCommit={handleCommit}
    />
  );
}
