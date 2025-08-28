// File: components/containers/AssetSelectPanels/TokenSelectPanel.tsx
'use client';

import { useMemo, useCallback } from 'react';
import type { Address } from 'viem';
import { TokenContract, SP_COIN_DISPLAY, WalletAccount } from '@/lib/structure';

import AssetSelectPanel from './AssetSelectPanel';
import { useActiveDisplay, useExchangeContext } from '@/lib/context/hooks'; // ← add useExchangeContext

import type { AssetSelectBag } from '@/lib/context/structure/types/panelBag';

// Instance-scoped display provider
import { AssetSelectDisplayProvider } from '@/lib/context/providers/AssetSelect/AssetSelectDisplayProvider';
import { ASSET_SELECTION_DISPLAY } from '@/lib/structure/assetSelection';

// Provider (via barrel export)
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
  const { exchangeContext } = useExchangeContext();              // ← app network source of truth
  const chainId = exchangeContext?.network?.chainId ?? 1;        // fallback safe default

  const initialPanelBag: AssetSelectBag = useMemo(
    () =>
      ({
        type: activeDisplay as SP_COIN_DISPLAY,
        chainId,                                              // ← include in bag if your provider reads it
        ...(peerAddress ? { peerAddress } : {}),
      } as AssetSelectBag),
    [activeDisplay, peerAddress, chainId]                      // ← depend on chainId
  );

  const instanceId = useMemo(
    () =>
      `TOKEN_SELECT_${SP_COIN_DISPLAY[activeDisplay as SP_COIN_DISPLAY] ?? 'UNKNOWN'}_${chainId}`, // ← include chainId
    [activeDisplay, chainId]
  );

  const closeForProvider = useCallback(
    (_fromUser: boolean) => {
      closePanelCallback();
    },
    [closePanelCallback]
  );

  if (!isActive) return null;

  return (
    <AssetSelectDisplayProvider
      key={instanceId}                                         // ← force remount on network change
      instanceId={instanceId}
      initial={ASSET_SELECTION_DISPLAY.IDLE}
    >
      <AssetSelectProvider
        key={instanceId}                                       // ← also key the inner provider
        closePanelCallback={closeForProvider}
        setTradingTokenCallback={setTradingTokenCallback}
        containerType={activeDisplay as SP_COIN_DISPLAY}
        initialPanelBag={initialPanelBag}
      >
        <AssetSelectPanel />
      </AssetSelectProvider>
    </AssetSelectDisplayProvider>
  );
}
