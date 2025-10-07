// File: components/containers/AssetSelectPanels/RecipientSelectPanel.tsx
'use client';

import { useMemo, useCallback } from 'react';
import { TokenContract, SP_COIN_DISPLAY, WalletAccount } from '@/lib/structure';
import AssetSelectPanel from './AssetSelectPanel';
import { useExchangeContext } from '@/lib/context/hooks';
import { AssetSelectProvider } from '@/lib/context';
import { AssetSelectDisplayProvider } from '@/lib/context/providers/AssetSelect/AssetSelectDisplayProvider';
import type { AssetSelectBag } from '@/lib/context/structure/types/panelBag';
import { useSelectionCommit } from '@/lib/context/hooks/ExchangeContext/selectionCommit/useSelectionCommit';
import { usePanelTransitions } from '@/lib/context/exchangeContext/hooks/usePanelTransitions';
import { usePanelVisible } from '@/lib/context/exchangeContext/hooks/usePanelVisible';

/** Wrapper: only visibility gating; no hooks after the conditional. */
export default function RecipientSelectPanel() {
  const visible = usePanelVisible(SP_COIN_DISPLAY.RECIPIENT_SELECT_PANEL_LIST);
  if (!visible) return null;
  return <RecipientSelectPanelInner />;
}

/** Inner: stable hooks only, no early returns. */
function RecipientSelectPanelInner() {
  const { exchangeContext } = useExchangeContext();
  const { commitRecipient } = useSelectionCommit();
  const { toTrading } = usePanelTransitions();

  const chainId = exchangeContext?.network?.chainId ?? 1;
  const containerType = SP_COIN_DISPLAY.RECIPIENT_SELECT_PANEL_LIST;

  const instanceId = useMemo(
    () => `RECIPIENT_SELECT_${SP_COIN_DISPLAY[containerType]}_${chainId}`,
    [containerType, chainId]
  );

  const closeForProvider = useCallback(() => {
    toTrading();
  }, [toTrading]);

  const onAssetChosen = useCallback(
    (asset: TokenContract | WalletAccount) => {
      const looksLikeToken = typeof (asset as any)?.decimals === 'number';
      if (looksLikeToken) return; // recipients are wallet accounts, not tokens
      commitRecipient(asset as WalletAccount);
    },
    [commitRecipient]
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
