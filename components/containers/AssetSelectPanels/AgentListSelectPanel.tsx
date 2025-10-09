// File: components/containers/AssetSelectPanels/AgentListSelectPanel.tsx
'use client';

import { useMemo, useCallback } from 'react';
import { SP_COIN_DISPLAY, type WalletAccount, type TokenContract } from '@/lib/structure';

import AssetListSelectPanel from './AssetListSelectPanel';
import { useExchangeContext } from '@/lib/context/hooks';
import type { AssetSelectBag } from '@/lib/context/structure/types/panelBag';

import { AssetSelectProvider } from '@/lib/context';
import { AssetSelectDisplayProvider } from '@/lib/context/providers/AssetSelect/AssetSelectDisplayProvider';
import { usePanelTransitions } from '@/lib/context/exchangeContext/hooks/usePanelTransitions';
import { usePanelVisible } from '@/lib/context/exchangeContext/hooks/usePanelVisible';

/** Wrapper component: subscribe narrowly to visibility and return null when hidden. */
export default function AgentListSelectPanel() {
  const active = usePanelVisible(SP_COIN_DISPLAY.AGENT_LIST_SELECT_PANEL);
  if (!active) return null;
  return <AgentListSelectPanelInner />;
}

/** Inner component: all hooks live here; no early returns. */
function AgentListSelectPanelInner() {
  const { exchangeContext } = useExchangeContext();
  const { toTrading } = usePanelTransitions();

  const chainId = exchangeContext?.network?.chainId ?? 1;
  const containerType = SP_COIN_DISPLAY.AGENT_LIST_SELECT_PANEL;

  const instanceId = useMemo(
    () => `AGENT_SELECT_${SP_COIN_DISPLAY[containerType]}_${chainId}`,
    [containerType, chainId]
  );

  // NOTE: Signature must accept an optional boolean to satisfy the provider type.
  const closeForProvider = useCallback((fromUser?: boolean) => {
    // you can inspect fromUser if needed
    toTrading();
  }, [toTrading]);

  const onAssetChosen = useCallback(
    (asset: TokenContract | WalletAccount) => {
      const looksLikeToken = typeof (asset as any)?.decimals === 'number';
      if (looksLikeToken) return;
      // If you have a commitAgent(...) hook, call it here with the WalletAccount.
      // For now, we pass the chosen WalletAccount back through the provider’s callback chain.
    },
    []
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
        <AssetListSelectPanel />
      </AssetSelectProvider>
    </AssetSelectDisplayProvider>
  );
}
