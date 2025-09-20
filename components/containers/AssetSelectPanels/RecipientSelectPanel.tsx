// File: components/containers/AssetSelectPanels/RecipientSelectPanel.tsx
'use client';

import { useMemo, useCallback } from 'react';
import type { Address } from 'viem';
import { TokenContract, SP_COIN_DISPLAY, WalletAccount } from '@/lib/structure';

import AssetSelectPanel from './AssetSelectPanel';
import { useExchangeContext } from '@/lib/context/hooks';
import type { AssetSelectBag } from '@/lib/context/structure/types/panelBag';

import { AssetSelectProvider } from '@/lib/context';
import { AssetSelectDisplayProvider } from '@/lib/context/providers/AssetSelect/AssetSelectDisplayProvider';

interface RecipientSelectPanelProps {
  isActive: boolean;
  closePanelCallback: () => void;
  /** Recipient selection returns a WalletAccount; provider accepts TokenContract | WalletAccount */
  setTradingTokenCallback: (asset: TokenContract | WalletAccount) => void;
  /** Included for API symmetry; not usually needed for recipients */
  peerAddress?: string | Address;
}

export default function RecipientSelectPanel({
  isActive,
  closePanelCallback,
  setTradingTokenCallback,
  peerAddress,
}: RecipientSelectPanelProps) {
  const { exchangeContext } = useExchangeContext();
  const chainId = exchangeContext?.network?.chainId ?? 1;

  const containerType = SP_COIN_DISPLAY.RECIPIENT_SELECT_PANEL_LIST;

  const initialPanelBag: AssetSelectBag = useMemo(
    () =>
      ({
        type: containerType,
        chainId,
        ...(peerAddress ? { peerAddress } : {}),
      } as AssetSelectBag),
    [containerType, peerAddress, chainId]
  );

  const instanceId = useMemo(
    () => `RECIPIENT_SELECT_${SP_COIN_DISPLAY[containerType]}_${chainId}`,
    [containerType, chainId]
  );

  const closeForProvider = useCallback(
    (_fromUser: boolean) => { closePanelCallback(); },
    [closePanelCallback]
  );

  if (!isActive) return null;

  return (
    <AssetSelectDisplayProvider instanceId={instanceId}>
      <AssetSelectProvider
        key={instanceId}
        closePanelCallback={closeForProvider}
        setTradingTokenCallback={setTradingTokenCallback}
        containerType={containerType}
        initialPanelBag={initialPanelBag}
      >
        <AssetSelectPanel />
      </AssetSelectProvider>
    </AssetSelectDisplayProvider>
  );
}
