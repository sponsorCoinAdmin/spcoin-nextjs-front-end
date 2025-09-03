// File: components/containers/AssetSelectPanels/TokenSelectPanel.tsx
'use client';

import { useMemo, useCallback } from 'react';
import type { Address } from 'viem';
import { TokenContract, SP_COIN_DISPLAY, WalletAccount } from '@/lib/structure';

import AssetSelectPanel from './AssetSelectPanel';
import { useActiveDisplay, useExchangeContext } from '@/lib/context/hooks';
import type { AssetSelectBag } from '@/lib/context/structure/types/panelBag';

// ❌ Removed AssetSelectDisplayProvider + ASSET_SELECTION_DISPLAY
import { AssetSelectProvider } from '@/lib/context';

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
  const { activeDisplay } = useActiveDisplay();
  const { exchangeContext } = useExchangeContext();
  const chainId = exchangeContext?.network?.chainId ?? 1;

  const initialPanelBag: AssetSelectBag = useMemo(
    () =>
      ({
        type: activeDisplay as SP_COIN_DISPLAY,
        chainId,
        ...(peerAddress ? { peerAddress } : {}),
      } as AssetSelectBag),
    [activeDisplay, peerAddress, chainId]
  );

  const instanceId = useMemo(
    () => `TOKEN_SELECT_${SP_COIN_DISPLAY[activeDisplay as SP_COIN_DISPLAY] ?? 'UNKNOWN'}_${chainId}`,
    [activeDisplay, chainId]
  );

  const closeForProvider = useCallback(
    (_fromUser: boolean) => { closePanelCallback(); },
    [closePanelCallback]
  );

  if (!isActive) return null;

  return (
    <AssetSelectProvider
      key={instanceId}
      closePanelCallback={closeForProvider}
      setTradingTokenCallback={setTradingTokenCallback}
      containerType={activeDisplay as SP_COIN_DISPLAY}
      initialPanelBag={initialPanelBag}
    >
      <AssetSelectPanel />
    </AssetSelectProvider>
  );
}
