// File: components/containers/AssetSelectPanels/TokenSelectPanel.tsx
'use client';

import { useMemo, useCallback } from 'react';
import { TokenContract, SP_COIN_DISPLAY, WalletAccount } from '@/lib/structure';

import AssetSelectPanel from './AssetSelectPanel';
import { useExchangeContext } from '@/lib/context/hooks';
import { AssetSelectProvider } from '@/lib/context';
import { AssetSelectDisplayProvider } from '@/lib/context/providers/AssetSelect/AssetSelectDisplayProvider';
import { usePanelTree } from '@/lib/context/exchangeContext/hooks/usePanelTree';
import { useSelectionCommit } from '@/lib/context/hooks/ExchangeContext/selectionCommit/useSelectionCommit';
import { usePanelTransitions } from '@/lib/context/exchangeContext/hooks/usePanelTransitions';

export default function TokenSelectPanel() {
  const { activeMainOverlay, isVisible } = usePanelTree();

  const { exchangeContext } = useExchangeContext();
  const chainId = exchangeContext?.network?.chainId ?? 1;

  const { commitToken } = useSelectionCommit();
  const { toTrading } = usePanelTransitions();

  // Gate rendering strictly by the *active* radio overlay.
  const activeType: SP_COIN_DISPLAY | null = useMemo(() => {
    if (activeMainOverlay === SP_COIN_DISPLAY.SELL_SELECT_PANEL_LIST) {
      return SP_COIN_DISPLAY.SELL_SELECT_PANEL_LIST;
    }
    if (activeMainOverlay === SP_COIN_DISPLAY.BUY_SELECT_PANEL_LIST) {
      return SP_COIN_DISPLAY.BUY_SELECT_PANEL_LIST;
    }
    // Fallback: handle legacy/mixed state where visibility may be set
    if (isVisible(SP_COIN_DISPLAY.SELL_SELECT_PANEL_LIST)) {
      return SP_COIN_DISPLAY.SELL_SELECT_PANEL_LIST;
    }
    if (isVisible(SP_COIN_DISPLAY.BUY_SELECT_PANEL_LIST)) {
      return SP_COIN_DISPLAY.BUY_SELECT_PANEL_LIST;
    }
    return null;
  }, [activeMainOverlay, isVisible]);

  const instanceId = useMemo(() => {
    const label = activeType != null ? SP_COIN_DISPLAY[activeType] : 'UNKNOWN';
    return `TOKEN_SELECT_${label}_${chainId}`;
  }, [activeType, chainId]);

  // When the provider asks to close, navigate via transition.
  const closeForProvider = useCallback(() => {
    toTrading();
  }, [toTrading]);

  const onAssetChosen = useCallback(
    (asset: TokenContract | WalletAccount) => {
      if (!activeType) return;
      const isToken = typeof (asset as any)?.decimals === 'number';
      if (!isToken) return;

      const side =
        activeType === SP_COIN_DISPLAY.SELL_SELECT_PANEL_LIST ? 'sell' : 'buy';
      commitToken(asset as TokenContract, side);
    },
    [activeType, commitToken]
  );

  if (!activeType) return null;

  return (
    <AssetSelectDisplayProvider instanceId={instanceId}>
      <AssetSelectProvider
        key={instanceId}
        closePanelCallback={closeForProvider}
        setSelectedAssetCallback={onAssetChosen}
        containerType={activeType}
        initialPanelBag={{ type: activeType }}
      >
        <AssetSelectPanel />
      </AssetSelectProvider>
    </AssetSelectDisplayProvider>
  );
}
