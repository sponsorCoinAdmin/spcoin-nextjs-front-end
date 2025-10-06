// File: components/containers/AssetSelectPanels/AgentSelectPanel.tsx
'use client';

import { useMemo, useCallback } from 'react';
import { SP_COIN_DISPLAY, type WalletAccount, type TokenContract } from '@/lib/structure';

import AssetSelectPanel from './AssetSelectPanel';
import { useExchangeContext } from '@/lib/context/hooks';
import type { AssetSelectBag } from '@/lib/context/structure/types/panelBag';

import { AssetSelectProvider } from '@/lib/context';
import { AssetSelectDisplayProvider } from '@/lib/context/providers/AssetSelect/AssetSelectDisplayProvider';
import { usePanelTree } from '@/lib/context/exchangeContext/hooks/usePanelTree';
import { useSelectionCommit } from '@/lib/context/hooks/ExchangeContext/selectionCommit/useSelectionCommit';
import { usePanelTransitions } from '@/lib/context/exchangeContext/hooks/usePanelTransitions';

/** Wrapper component: only checks visibility and returns null. No other hooks/logic here. */
export default function AgentSelectPanel() {
  const { isVisible } = usePanelTree();
  const active = isVisible(SP_COIN_DISPLAY.AGENT_SELECT_PANEL_LIST);
  if (!active) return null;
  return <AgentSelectPanelInner />;
}

/** Inner component: all hooks live here; no early returns. */
function AgentSelectPanelInner() {
  const { exchangeContext } = useExchangeContext();
  const { commitAgent } = useSelectionCommit();
  const { toTrading } = usePanelTransitions();

  const chainId = exchangeContext?.network?.chainId ?? 1;
  const containerType = SP_COIN_DISPLAY.AGENT_SELECT_PANEL_LIST;

  const instanceId = useMemo(
    () => `AGENT_SELECT_${SP_COIN_DISPLAY[containerType]}_${chainId}`,
    [containerType, chainId]
  );

  const closeForProvider = useCallback((_fromUser: boolean) => {
    toTrading();
  }, [toTrading]);

  const onAssetChosen = useCallback(
    (asset: TokenContract | WalletAccount) => {
      const looksLikeToken = typeof (asset as any)?.decimals === 'number';
      if (looksLikeToken) return;
      commitAgent(asset as WalletAccount);
    },
    [commitAgent]
  );

  const initialPanelBag: AssetSelectBag = useMemo(
    () => ({ type: containerType, chainId }),
    [containerType, chainId]
  );

  return (
    <AssetSelectDisplayProvider instanceId={instanceId}>
      <AssetSelectProvider
        key={instanceId}
        closePanelCallback={closeForProvider}
        setSelectedAssetCallback={onAssetChosen}
        containerType={containerType}
        initialPanelBag={initialPanelBag}
      >
        <AssetSelectPanel />
      </AssetSelectProvider>
    </AssetSelectDisplayProvider>
  );
}
