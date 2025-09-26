// File: components/containers/AssetSelectPanels/AgentSelectPanel.tsx
'use client';

import { useMemo, useCallback } from 'react';
import type { Address } from 'viem';
import { SP_COIN_DISPLAY, WalletAccount, type TokenContract } from '@/lib/structure';

import AssetSelectPanel from './AssetSelectPanel';
import { useExchangeContext } from '@/lib/context/hooks';
import type { AssetSelectBag } from '@/lib/context/structure/types/panelBag';

import { AssetSelectProvider } from '@/lib/context';
import { AssetSelectDisplayProvider } from '@/lib/context/providers/AssetSelect/AssetSelectDisplayProvider';

interface AgentSelectPanelProps {
  isActive: boolean;
  closePanelCallback: () => void;
  /** Agent selection returns a WalletAccount (adapter will satisfy provider prop) */
  setAgentCallback: (wallet: WalletAccount) => void;
  /** Included for API symmetry; rarely needed here */
  peerAddress?: string | Address;
}

export default function AgentSelectPanel({
  isActive,
  closePanelCallback,
  setAgentCallback,
  peerAddress,
}: AgentSelectPanelProps) {
  const { exchangeContext } = useExchangeContext();
  const chainId = exchangeContext?.network?.chainId ?? 1;

  // list variant for the scroll panel
  const containerType = SP_COIN_DISPLAY.AGENT_SELECT_PANEL_LIST;

  // seed provider
  const initialPanelBag: AssetSelectBag = useMemo(
    () =>
      ({
        type: containerType,
        chainId,
        ...(peerAddress ? { peerAddress } : {}),
      } as AssetSelectBag),
    [containerType, peerAddress, chainId]
  );

  // stable instance id (and React key)
  const instanceId = useMemo(
    () => `AGENT_SELECT_${SP_COIN_DISPLAY[containerType]}_${chainId}`,
    [containerType, chainId]
  );

  // adapt parent close callback to provider signature
  const closeForProvider = useCallback(
    (_fromUser: boolean) => {
      closePanelCallback();
    },
    [closePanelCallback]
  );

  // 🔁 Adapter: provider expects (TokenContract | WalletAccount),
  // but this panel only ever returns a WalletAccount.
  const onAssetChosen = useCallback(
    (asset: TokenContract | WalletAccount) => {
      setAgentCallback(asset as WalletAccount);
    },
    [setAgentCallback]
  );

  if (!isActive) return null;

  return (
    <AssetSelectDisplayProvider instanceId={instanceId}>
      <AssetSelectProvider
        key={instanceId}
        closePanelCallback={closeForProvider}
        setSelectedAssetCallback={onAssetChosen}
        containerType={containerType}
        initialPanelBag={initialPanelBag}
      >
        <AssetSelectPanel />
      </AssetSelectProvider>
    </AssetSelectDisplayProvider>
  );
}
