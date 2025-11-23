// File: @/components/containers/AssetSelectPanels/AgentListSelectPanel.tsx
'use client';

import { FEED_TYPE, SP_COIN_DISPLAY, type WalletAccount, type TokenContract } from '@/lib/structure';
import { usePanelVisible } from '@/lib/context/exchangeContext/hooks/usePanelVisible';
import { useSelectionCommit } from '@/lib/context/hooks/ExchangeContext/selectionCommit/useSelectionCommit';
import PanelListSelectWrapper from './PanelListSelectWrapper';

/** Visibility gate only. */
export default function AgentListSelectPanel() {
  const visible = usePanelVisible(SP_COIN_DISPLAY.AGENT_LIST_SELECT_PANEL);
  if (!visible) return null;
  return <AgentListSelectPanelInner />;
}

/** Shim: define feed + commit behavior. */
function AgentListSelectPanelInner() {
  const { commitAgent } = useSelectionCommit();

  const handleCommit = (asset: WalletAccount | TokenContract) => {
    const isToken = typeof (asset as any)?.decimals === 'number';
    if (isToken) return;
    commitAgent(asset as WalletAccount);
  };

  return (
    <PanelListSelectWrapper
      panel={SP_COIN_DISPLAY.AGENT_LIST_SELECT_PANEL}
      feedType={FEED_TYPE.AGENT_ACCOUNTS}
      instancePrefix="agent"
      onCommit={handleCommit}
    />
  );
}
