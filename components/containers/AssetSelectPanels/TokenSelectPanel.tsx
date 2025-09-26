// File: components/containers/AssetSelectPanels/TokenSelectPanel.tsx
'use client';

import { useMemo, useCallback } from 'react';
import type { Address } from 'viem';
import { TokenContract, SP_COIN_DISPLAY, WalletAccount } from '@/lib/structure';

import AssetSelectPanel from './AssetSelectPanel';
import { useExchangeContext } from '@/lib/context/hooks';
import type { AssetSelectBag } from '@/lib/context/structure/types/panelBag';

import { AssetSelectProvider } from '@/lib/context';
import { AssetSelectDisplayProvider } from '@/lib/context/providers/AssetSelect/AssetSelectDisplayProvider';
import { usePanelTree } from '@/lib/context/exchangeContext/hooks/usePanelTree';

interface TokenSelectPanelProps {
  isActive: boolean;
  closePanelCallback: () => void;
  /** Parent-provided handler to store the chosen token (buy/sell) */
  setTradingTokenCallback: (asset: TokenContract) => void;
  peerAddress?: string | Address;
}

export default function TokenSelectPanel({
  isActive,
  closePanelCallback,
  setTradingTokenCallback,
  peerAddress,
}: TokenSelectPanelProps) {
  const { isVisible } = usePanelTree();
  const { exchangeContext } = useExchangeContext();
  const chainId = exchangeContext?.network?.chainId ?? 1;

  // Determine which token-select overlay is currently active (BUY or SELL)
  const activeType: SP_COIN_DISPLAY | null = useMemo(() => {
    if (isVisible(SP_COIN_DISPLAY.SELL_SELECT_PANEL_LIST)) return SP_COIN_DISPLAY.SELL_SELECT_PANEL_LIST;
    if (isVisible(SP_COIN_DISPLAY.BUY_SELECT_PANEL_LIST))  return SP_COIN_DISPLAY.BUY_SELECT_PANEL_LIST;
    return null;
  }, [isVisible]);

  const initialPanelBag: AssetSelectBag | null = useMemo(() => {
    if (!activeType) return null;
    return {
      type: activeType,
      chainId,
      ...(peerAddress ? { peerAddress } : {}),
    } as AssetSelectBag;
  }, [activeType, peerAddress, chainId]);

  const instanceId = useMemo(() => {
    const label = activeType != null ? SP_COIN_DISPLAY[activeType] : 'UNKNOWN';
    return `TOKEN_SELECT_${label}_${chainId}`;
  }, [activeType, chainId]);

  const closeForProvider = useCallback(
    (_fromUser: boolean) => { closePanelCallback(); },
    [closePanelCallback]
  );

  // Adapter: provider emits (TokenContract | WalletAccount). We only accept TokenContract here.
  const onAssetChosen = useCallback(
    (asset: TokenContract | WalletAccount) => {
      // Heuristic: tokens have numeric "decimals"
      const looksLikeToken = typeof (asset as any)?.decimals === 'number';
      if (!looksLikeToken) {
        // Ignore wallet selections in token panel
        // console.warn('[TokenSelectPanel] Ignoring non-token selection', asset);
        return;
      }
      setTradingTokenCallback(asset as TokenContract);
    },
    [setTradingTokenCallback]
  );

  // If the overlay isn't active or we couldn't resolve which one, render nothing
  if (!isActive || !activeType || !initialPanelBag) return null;

  return (
    <AssetSelectDisplayProvider instanceId={instanceId}>
      <AssetSelectProvider
        key={instanceId}
        closePanelCallback={closeForProvider}
        // IMPORTANT: AssetSelectProvider expects `setSelectedAssetCallback`, not `setTradingTokenCallback`
        setSelectedAssetCallback={onAssetChosen}
        containerType={activeType}
        initialPanelBag={initialPanelBag}
      >
        <AssetSelectPanel />
      </AssetSelectProvider>
    </AssetSelectDisplayProvider>
  );
}
