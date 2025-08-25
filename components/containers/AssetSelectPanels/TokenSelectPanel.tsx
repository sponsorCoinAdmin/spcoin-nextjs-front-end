// File: components/containers/AssetSelectPanels/TokenSelectPanel.tsx
'use client';

import { useMemo, useCallback } from 'react';
import type { Address } from 'viem';
import { TokenContract, SP_COIN_DISPLAY, WalletAccount } from '@/lib/structure';

import AssetSelectPanel from './AssetSelectPanel';
import { useActiveDisplay } from '@/lib/context/hooks';

import type { AssetSelectBag } from '@/lib/context/structure/types/panelBag';

// Instance-scoped display provider (kept; provider uses it internally)
import {
  AssetSelectDisplayProvider,
} from '@/lib/context/providers/AssetSelect/AssetSelectDisplayProvider';
import { ASSET_SELECTION_DISPLAY } from '@/lib/structure/assetSelection';

// Provider (via barrel export)
import { AssetSelectProvider } from '@/lib/context';

interface TokenSelectPanelProps {
  isActive: boolean;
  /** Parent close callback (no args). We’ll adapt to provider’s (fromUser:boolean) signature. */
  closePanelCallback: () => void;
  /** Widen to match AssetSelectProvider’s expected type */
  setTradingTokenCallback: (asset: TokenContract | WalletAccount) => void;
  /** Opposing side’s committed address (optional). BUY panel gets SELL’s addr; SELL panel gets BUY’s addr. */
  peerAddress?: string | Address;
}

export default function TokenSelectPanel({
  isActive,
  closePanelCallback,
  setTradingTokenCallback,
  peerAddress,
}: TokenSelectPanelProps) {
  const { activeDisplay } = useActiveDisplay();

  const initialPanelBag: AssetSelectBag = useMemo(
    () =>
      ({
        type: activeDisplay as SP_COIN_DISPLAY,
        ...(peerAddress ? { peerAddress } : {}),
      } as AssetSelectBag),
    [activeDisplay, peerAddress]
  );

  const instanceId = useMemo(
    () =>
      `TOKEN_SELECT_${SP_COIN_DISPLAY[activeDisplay as SP_COIN_DISPLAY] ?? 'UNKNOWN'}`,
    [activeDisplay]
  );

  // Adapt parent close callback to provider’s signature (fromUser:boolean)
  const closeForProvider = useCallback(
    (_fromUser: boolean) => {
      // Provider supplies the boolean; parent close has no args
      closePanelCallback();
    },
    [closePanelCallback]
  );

  if (!isActive) return null;

  return (
    <AssetSelectDisplayProvider
      instanceId={instanceId}
      initial={ASSET_SELECTION_DISPLAY.IDLE}
    >
      <AssetSelectProvider
        closePanelCallback={closeForProvider}
        setTradingTokenCallback={setTradingTokenCallback}
        containerType={activeDisplay as SP_COIN_DISPLAY}
        initialPanelBag={initialPanelBag}
      >
        {/* Panels no longer need their own preview/terminal effects; provider handles it */}
        <AssetSelectPanel />
      </AssetSelectProvider>
    </AssetSelectDisplayProvider>
  );
}
