// File: @/components/views/AgentListSelectPanel.tsx
'use client';

import { SP_COIN_DISPLAY, type spCoinAccount, type TokenContract } from '@/lib/structure';
import { usePanelVisible } from '@/lib/context/exchangeContext/hooks/usePanelVisible';
import { useSelectionCommit } from '@/lib/context/hooks/ExchangeContext/selectionCommit/useSelectionCommit';
import PanelListSelectWrapper from '../../AssetSelectPanels/PanelListSelectWrapper';

/** Visibility gate only. */
export default function AgentListSelectPanel() {
  const visible = usePanelVisible(SP_COIN_DISPLAY.AGENT_LIST);
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
      onCommit={handleCommit}
      containerTypeOverride={SP_COIN_DISPLAY.AGENT_LIST}
    />
  );
}
