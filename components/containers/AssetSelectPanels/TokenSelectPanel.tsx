// File: components/containers/AssetSelectPanels/TokenSelectPanel.tsx
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

/** Wrapper: subscribe narrowly to each token-list panel; no other hooks here. */
export default function TokenSelectPanel() {
  const sellListVisible = usePanelVisible(SP_COIN_DISPLAY.SELL_SELECT_PANEL_LIST);
  const buyListVisible  = usePanelVisible(SP_COIN_DISPLAY.BUY_SELECT_PANEL_LIST);

  // Radio overlay guarantees at most one true; prefer SELL if both somehow true.
  const activeType: SP_COIN_DISPLAY | null =
    sellListVisible ? SP_COIN_DISPLAY.SELL_SELECT_PANEL_LIST
    : buyListVisible ? SP_COIN_DISPLAY.BUY_SELECT_PANEL_LIST
    : null;

  if (!activeType) return null;
  return <TokenSelectPanelInner activeType={activeType} />;
}

/** Inner: all hooks live here; stable order; no early returns. */
function TokenSelectPanelInner({ activeType }: { activeType: SP_COIN_DISPLAY }) {
  const { exchangeContext } = useExchangeContext();
  const { commitToken } = useSelectionCommit();
  const { toTrading } = usePanelTransitions();

  const chainId = exchangeContext?.network?.chainId ?? 1;

  const instanceId = useMemo(() => {
    const label = SP_COIN_DISPLAY[activeType] ?? 'UNKNOWN';
    return `TOKEN_SELECT_${label}_${chainId}`;
  }, [activeType, chainId]);

  const closeForProvider = useCallback(() => {
    toTrading();
  }, [toTrading]);

  const onAssetChosen = useCallback(
    (asset: TokenContract | WalletAccount) => {
      // token lists only accept tokens (has decimals)
      if (typeof (asset as any)?.decimals !== 'number') return;

      const side = activeType === SP_COIN_DISPLAY.SELL_SELECT_PANEL_LIST ? 'sell' : 'buy';
      commitToken(asset as TokenContract, side);
    },
    [activeType, commitToken]
  );

  const initialPanelBag: AssetSelectBag = useMemo(
    () => ({ type: SP_COIN_DISPLAY.UNDEFINED, chainId }),
    [chainId]
  );

  return (
    <AssetSelectDisplayProvider instanceId={instanceId}>
      <AssetSelectProvider
        key={instanceId}
        closePanelCallback={closeForProvider}
        setSelectedAssetCallback={onAssetChosen}
        containerType={activeType}
        initialPanelBag={initialPanelBag}
      >
        <AssetSelectPanel />
      </AssetSelectProvider>
    </AssetSelectDisplayProvider>
  );
}
