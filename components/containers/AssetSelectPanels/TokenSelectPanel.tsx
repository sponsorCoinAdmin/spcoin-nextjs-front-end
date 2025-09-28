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

export default function TokenSelectPanel() {
  const { isVisible, openPanel } = usePanelTree();
  const { exchangeContext } = useExchangeContext();
  const chainId = exchangeContext?.network?.chainId ?? 1;

  const { commitToken } = useSelectionCommit();

  // Which token-list overlay is currently active?
  const activeType: SP_COIN_DISPLAY | null = useMemo(() => {
    if (isVisible(SP_COIN_DISPLAY.SELL_SELECT_PANEL_LIST)) return SP_COIN_DISPLAY.SELL_SELECT_PANEL_LIST;
    if (isVisible(SP_COIN_DISPLAY.BUY_SELECT_PANEL_LIST))  return SP_COIN_DISPLAY.BUY_SELECT_PANEL_LIST;
    return null;
  }, [isVisible]);

  const instanceId = useMemo(() => {
    const label = activeType != null ? SP_COIN_DISPLAY[activeType] : 'UNKNOWN';
    return `TOKEN_SELECT_${label}_${chainId}`;
  }, [activeType, chainId]);

  const closeForProvider = useCallback((_fromUser: boolean) => {
    openPanel(SP_COIN_DISPLAY.TRADING_STATION_PANEL);
  }, [openPanel]);

  // Provider emits (TokenContract | WalletAccount); we only care about tokens here.
  const onAssetChosen = useCallback((asset: TokenContract | WalletAccount) => {
    if (!activeType) return;
    const isToken = typeof (asset as any)?.decimals === 'number';
    if (!isToken) return;

    const side = activeType === SP_COIN_DISPLAY.SELL_SELECT_PANEL_LIST ? 'sell' : 'buy';
    commitToken(asset as TokenContract, side); // finishes (returns to Trading) inside the hook
  }, [activeType, commitToken]);

  // Only render when one of the token overlays is active
  if (!activeType) return null;

  return (
    <AssetSelectDisplayProvider instanceId={instanceId}>
      <AssetSelectProvider
        key={instanceId}
        closePanelCallback={closeForProvider}
        setSelectedAssetCallback={onAssetChosen}
        containerType={activeType}
        initialPanelBag={{ type: activeType, chainId }}
      >
        <AssetSelectPanel />
      </AssetSelectProvider>
    </AssetSelectDisplayProvider>
  );
}
