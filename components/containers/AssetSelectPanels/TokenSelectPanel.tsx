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
  setTradingTokenCallback: (asset: TokenContract | WalletAccount) => void;
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

  // If the overlay isn't active or we couldn't resolve which one, render nothing
  if (!isActive || !activeType || !initialPanelBag) return null;

  return (
    <AssetSelectDisplayProvider instanceId={instanceId}>
      <AssetSelectProvider
        key={instanceId}
        closePanelCallback={closeForProvider}
        setTradingTokenCallback={setTradingTokenCallback}
        containerType={activeType}
        initialPanelBag={initialPanelBag}
      >
        <AssetSelectPanel />
      </AssetSelectProvider>
    </AssetSelectDisplayProvider>
  );
}
