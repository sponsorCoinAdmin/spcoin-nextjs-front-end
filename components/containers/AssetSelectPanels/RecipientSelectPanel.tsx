// File: components/containers/AssetSelectPanels/RecipientSelectPanel.tsx
'use client';

import { useMemo, useCallback } from 'react';
import { TokenContract, SP_COIN_DISPLAY, WalletAccount } from '@/lib/structure';
import AssetSelectPanel from './AssetSelectPanel';
import { useExchangeContext } from '@/lib/context/hooks';
import { AssetSelectProvider } from '@/lib/context';
import { AssetSelectDisplayProvider } from '@/lib/context/providers/AssetSelect/AssetSelectDisplayProvider';
import { usePanelTree } from '@/lib/context/exchangeContext/hooks/usePanelTree';
import type { AssetSelectBag } from '@/lib/context/structure/types/panelBag';
import { useSelectionCommit } from '@/lib/context/hooks/ExchangeContext/selectionCommit/useSelectionCommit';

/** Wrapper does ONLY visibility gating (no hooks after the conditional). */
export default function RecipientSelectPanel() {
  const { isVisible } = usePanelTree();
  const active = isVisible(SP_COIN_DISPLAY.RECIPIENT_SELECT_PANEL_LIST);
  if (!active) return null;
  return <RecipientSelectPanelInner />;
}

/** All hooks live in the inner component so the hook order is stable. */
function RecipientSelectPanelInner() {
  const { openPanel } = usePanelTree();
  const { exchangeContext } = useExchangeContext();
  const { commitRecipient } = useSelectionCommit();

  const chainId = exchangeContext?.network?.chainId ?? 1;

  const instanceId = useMemo(
    () =>
      `RECIPIENT_SELECT_${SP_COIN_DISPLAY[SP_COIN_DISPLAY.RECIPIENT_SELECT_PANEL_LIST]}_${chainId}`,
    [chainId]
  );

  // Close → back to Trading
  const closeForProvider = useCallback(
    (_fromUser: boolean) => {
      openPanel(SP_COIN_DISPLAY.TRADING_STATION_PANEL);
    },
    [openPanel]
  );

  // Provider emits (TokenContract | WalletAccount); this panel only accepts WalletAccount
  const onAssetChosen = useCallback(
    (asset: TokenContract | WalletAccount) => {
      const looksLikeToken = typeof (asset as any)?.decimals === 'number';
      if (looksLikeToken) return; // ignore tokens here
      commitRecipient(asset as WalletAccount); // commits + navigates inside the hook
    },
    [commitRecipient]
  );

  const initialPanelBag: AssetSelectBag = useMemo(
    () => ({ type: SP_COIN_DISPLAY.RECIPIENT_SELECT_PANEL_LIST, chainId }),
    [chainId]
  );

  return (
    <AssetSelectDisplayProvider instanceId={instanceId}>
      <AssetSelectProvider
        key={instanceId}
        closePanelCallback={closeForProvider}
        setSelectedAssetCallback={onAssetChosen}
        containerType={SP_COIN_DISPLAY.RECIPIENT_SELECT_PANEL_LIST}
        initialPanelBag={initialPanelBag}
      >
        <AssetSelectPanel />
      </AssetSelectProvider>
    </AssetSelectDisplayProvider>
  );
}
