// File: components/containers/AssetSelectPanels/RecipientSelectPanel.tsx
'use client';

import { useCallback, useMemo } from 'react';
import type { Address } from 'viem';
import { SP_COIN_DISPLAY, WalletAccount, TokenContract } from '@/lib/structure';

import { useActiveDisplay } from '@/lib/context/hooks';

import {
  AssetSelectDisplayProvider,
} from '@/lib/context/providers/AssetSelect/AssetSelectDisplayProvider';
import { ASSET_SELECTION_DISPLAY } from '@/lib/structure/assetSelection';

// Provider (barrel export)
import { AssetSelectProvider } from '@/lib/context';
import { AssetSelectPanel } from './AssetSelectScrollPanels';

interface RecipientSelectPanelProps {
  isActive: boolean;
  /** Parent close callback (no args). We’ll adapt to provider’s (fromUser:boolean) signature. */
  closePanelCallback: () => void;
  /** Widened to match AssetSelectProvider’s expected type */
  setTradingTokenCallback: (asset: WalletAccount | TokenContract) => void;
  /** (Optional) Opposite side’s address if you use peer-aware logic elsewhere */
  peerAddress?: string | Address;
}

export default function RecipientSelectPanel({
  isActive,
  closePanelCallback,
  setTradingTokenCallback,
}: RecipientSelectPanelProps) {
  const { activeDisplay } = useActiveDisplay();

  // Adapt parent close callback to provider’s (fromUser:boolean) signature
  const closeForProvider = useCallback(
    (_fromUser: boolean) => {
      closePanelCallback();
    },
    [closePanelCallback]
  );

  const instanceId = useMemo(
    () =>
      `RECIPIENT_SELECT_${SP_COIN_DISPLAY[activeDisplay as SP_COIN_DISPLAY] ?? 'UNKNOWN'}`,
    [activeDisplay]
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
      >
        {/* Provider now owns terminals & preview bridging; panel is purely presentational */}
        <AssetSelectPanel />
      </AssetSelectProvider>
    </AssetSelectDisplayProvider>
  );
}
