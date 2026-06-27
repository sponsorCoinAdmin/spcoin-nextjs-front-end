// File: components/views/RadioOverlayPanels/ListSelectPanels/AgentListSelectPanel.tsx
'use client';

import { SP_COIN_DISPLAY, type spCoinAccount, type TokenContract } from '@/lib/structure';
import { usePanelVisible } from '@/lib/context/exchangeContext/hooks/usePanelVisible';
import PanelListSelectWrapper from '../../AssetSelectPanels/PanelListSelectWrapper';

type Props = {
  onSelect: (account: spCoinAccount) => void;
};

/** Visibility gate only. */
export default function AgentListSelectPanel({ onSelect }: Props) {
  const vAccountList = usePanelVisible(SP_COIN_DISPLAY.ACCOUNT_LIST_SELECT_PANEL);
  const vAgentList = usePanelVisible(SP_COIN_DISPLAY.AGENT_LIST);
  const visible = vAccountList && vAgentList;
  if (!visible) return null;
  return <AgentListSelectPanelInner onSelect={onSelect} />;
}

/** Shim: define feed + commit behavior. */
function AgentListSelectPanelInner({ onSelect }: { onSelect: (account: spCoinAccount) => void }) {
  const handleCommit = (asset: spCoinAccount | TokenContract) => {
    const isToken = typeof (asset as any)?.decimals === 'number';
    if (isToken) return;
    onSelect(asset as spCoinAccount);
  };

  return (
    <div id="AGENT_LIST_SELECT_PANEL" className="flex h-full min-h-0 w-full flex-col overflow-hidden">
      <div id="ACCOUNT_LIST_SELECT_PANEL" className="flex h-full min-h-0 w-full flex-col overflow-hidden">
        <div id="AGENT_LIST" className="flex h-full min-h-0 w-full flex-col overflow-hidden">
          <PanelListSelectWrapper
            onCommit={handleCommit}
            containerTypeOverride={SP_COIN_DISPLAY.AGENT_LIST}
          />
        </div>
      </div>
    </div>
  );
}
