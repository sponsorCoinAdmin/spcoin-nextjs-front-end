// File: components/containers/AssetSelectPanels/AgentSelectPanel.tsx
'use client';

import { useMemo, useCallback } from 'react';
import type { Address } from 'viem';
import { SP_COIN_DISPLAY, TokenContract, WalletAccount } from '@/lib/structure';

import AssetSelectPanel from './AssetSelectPanel';
import { useExchangeContext } from '@/lib/context/hooks';
import type { AssetSelectBag } from '@/lib/context/structure/types/panelBag';

import { AssetSelectProvider } from '@/lib/context';
import { AssetSelectDisplayProvider } from '@/lib/context/providers/AssetSelect/AssetSelectDisplayProvider';

interface AgentSelectPanelProps {
  isActive: boolean;
  closePanelCallback: () => void;
  /** Agent selection returns a WalletAccount; provider accepts TokenContract | WalletAccount */
  setTradingTokenCallback: (asset: TokenContract | WalletAccount) => void;
  /** Included for API symmetry; rarely needed here */
  peerAddress?: string | Address;
}

export default function AgentSelectPanel({
  isActive,
  closePanelCallback,
  setTradingTokenCallback,
  peerAddress,
}: AgentSelectPanelProps) {
  const { exchangeContext } = useExchangeContext();
  const chainId = exchangeContext?.network?.chainId ?? 1;

  // Match the enum used throughout (list variant for the scroll panel)
  const containerType = SP_COIN_DISPLAY.AGENT_SELECT_PANEL_LIST;

  // Seed the provider with the same shape the Recipient panel uses
  const initialPanelBag: AssetSelectBag = useMemo(
    () =>
      ({
        type: containerType,
        chainId,
        ...(peerAddress ? { peerAddress } : {}),
      } as AssetSelectBag),
    [containerType, peerAddress, chainId]
  );

  // Stable instance id (and React key) — important for FSM / context instance scoping
  const instanceId = useMemo(
    () => `AGENT_SELECT_${SP_COIN_DISPLAY[containerType]}_${chainId}`,
    [containerType, chainId]
  );

  // Adapt parent close callback to provider signature
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
